import { Editor } from "@tiptap/react";
import { useState } from "react";
import { rewriteText } from "../routes";

type FloatingToolbarProps = {
  editor: Editor;
  isVisible: boolean;
  top: number;
  left: number;
};

export function FloatingToolbar({
  editor,
  isVisible,
  top,
  left,
}: FloatingToolbarProps) {
  const [isPrompting, setIsPrompting] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);

  if (!isVisible) return null;

  const handleAIRewrite = async () => {
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      " "
    );

    if (!selectedText) return;

    const prompt = window.prompt("How would you like to rewrite this text?");
    if (!prompt) return;

    setIsRewriting(true);
    try {
      const newText = await rewriteText({
        data: { text: selectedText, prompt },
      });
      editor.chain().focus().deleteSelection().insertContent(newText).run();
    } catch (error) {
      console.error("Failed to rewrite text:", error);
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200"
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
    >
      <button
        onClick={handleAIRewrite}
        disabled={isRewriting}
        className="px-3 py-1.5 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2"
      >
        <span role="img" aria-label="AI">
          🤖
        </span>
        {isRewriting ? "Rewriting..." : "AI Rewrite"}
      </button>
    </div>
  );
}
