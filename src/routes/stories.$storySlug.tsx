import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Toolbar } from "../components/Toolbar";
import { FloatingToolbar } from "../components/FloatingToolbar";
import { FloatingBadges } from "../components/FloatingBadges";
import { Toaster, toast } from "sonner";
import OpenAI from "openai";
import { useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";

const STORY_DIRECTORY = process.env.STORY_DIRECTORY!;

export const loadStory = createServerFn()
  .validator(
    z.object({
      storySlug: z.string(),
    })
  )
  .handler(async (ctx) => {
    try {
      const absolutePath = path.resolve(process.cwd(), STORY_DIRECTORY);
      const story = await fs.readFile(
        path.join(absolutePath, ctx.data.storySlug),
        "utf-8"
      );
      return story;
    } catch (error) {
      return "";
    }
  });

export const saveStory = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      storySlug: z.string(),
      text: z.string(),
    })
  )
  .handler(async (ctx) => {
    const { storySlug, text } = ctx.data;
    const absolutePath = path.resolve(process.cwd(), STORY_DIRECTORY);
    await fs.mkdir(absolutePath, { recursive: true });
    await fs.writeFile(path.join(absolutePath, storySlug), text);
  });

export const rewriteText = createServerFn()
  .validator(
    z.object({
      text: z.string(),
      prompt: z.string(),
    })
  )
  .handler(async (ctx) => {
    const { text, prompt } = ctx.data;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful writing assistant. Rewrite the given text according to the user's prompt. Only return the rewritten text, nothing else.",
        },
        {
          role: "user",
          content: `Please rewrite this text: "${text}" according to this prompt: "${prompt}"`,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content || text;
  });

export const Route = createFileRoute("/stories/$storySlug")({
  component: StoryEditor,
  loader: async ({ params }) => {
    const content = await loadStory({ data: { storySlug: params.storySlug } });
    return { content };
  },
});

function StoryEditor() {
  const { storySlug } = Route.useParams();
  const { content } = Route.useLoaderData();
  const [isSaving, setIsSaving] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  const debouncedSave = useCallback(
    debounce(async (html: string) => {
      setIsSaving(true);
      try {
        await saveStory({ data: { storySlug, text: html } });
      } catch (error) {
        console.error("Failed to save story:", error);
        toast.error("Failed to save story");
      } finally {
        setIsSaving(false);
      }
    }, 3000),
    [storySlug]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class:
          "text-xl prose prose-lg max-w-none focus:outline-none min-h-[500px] p-8 font-sans text-gray-800 leading-relaxed tracking-wide",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setIsSaving(true);
      debouncedSave(html);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setIsToolbarVisible(false);
        return;
      }

      const view = editor.view;
      const { top, left } = view.coordsAtPos(from);
      setToolbarPosition({ top: top - 40, left });
      setIsToolbarVisible(true);
    },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Toaster richColors />
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {storySlug.replace(".txt", "")}
      </h1>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
        {editor && (
          <FloatingToolbar
            editor={editor}
            isVisible={isToolbarVisible}
            top={toolbarPosition.top}
            left={toolbarPosition.left}
          />
        )}
      </div>
      {editor && <FloatingBadges editor={editor} isSaving={isSaving} />}
    </div>
  );
}
