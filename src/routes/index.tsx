import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import fs from "fs/promises";
import path from "path";
import { StoryCard } from "../components/StoryCard";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

const STORY_DIRECTORY = process.env.STORY_DIRECTORY!;

export const loadStories = createServerFn().handler(async () => {
  try {
    // Convert relative path to absolute path
    const absolutePath = path.resolve(process.cwd(), STORY_DIRECTORY);
    console.log("Loading stories from:", absolutePath);

    const files = await fs.readdir(absolutePath);
    console.log("Found files:", files);

    const storyFiles = files.filter((file) => file.endsWith(".txt"));
    console.log("Story files:", storyFiles);

    const stories = await Promise.all(
      storyFiles.map(async (file) => {
        const filePath = path.join(absolutePath, file);
        const stats = await fs.stat(filePath);
        return {
          title: file.replace(".txt", ""),
          lastModified: stats.mtime,
          path: file,
        };
      })
    );

    console.log("Loaded stories:", stories);
    return stories.sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime()
    );
  } catch (error) {
    console.error("Error loading stories:", error);
    return [];
  }
});

export const createNewStory = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      title: z.string(),
    })
  )
  .handler(async (ctx) => {
    const { title } = ctx.data;
    const filename = `${title}.txt`;
    const absolutePath = path.resolve(process.cwd(), STORY_DIRECTORY);
    console.log("Creating new story in:", absolutePath);

    await fs.mkdir(absolutePath, { recursive: true });
    await fs.writeFile(
      path.join(absolutePath, filename),
      "<p>Start writing your story here...</p>"
    );
    return filename;
  });

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: async () => {
    const stories = await loadStories();
    return { stories };
  },
});

interface Story {
  title: string;
  lastModified: Date;
  path: string;
}

function HomePage() {
  const { stories } = Route.useLoaderData();
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreateStory = async () => {
    if (!newStoryTitle.trim()) return;
    setIsCreating(true);
    try {
      const filename = await createNewStory({ data: { title: newStoryTitle } });
      navigate({ to: "/stories/$storySlug", params: { storySlug: filename } });
    } catch (error) {
      console.error("Failed to create story:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Your Stories</h1>
        <div className="flex gap-4">
          <input
            type="text"
            value={newStoryTitle}
            onChange={(e) => setNewStoryTitle(e.target.value)}
            placeholder="New story title"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreateStory}
            disabled={isCreating || !newStoryTitle.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : "New Story"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <StoryCard
            key={story.path}
            title={story.title}
            lastModified={story.lastModified}
            path={story.path}
          />
        ))}
      </div>
    </div>
  );
}
