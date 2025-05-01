import { Link } from "@tanstack/react-router";
import { format } from "date-fns";

interface StoryCardProps {
  title: string;
  lastModified: Date;
  path: string;
}

export function StoryCard({ title, lastModified, path }: StoryCardProps) {
  return (
    <Link
      to="/stories/$storySlug"
      params={{ storySlug: path }}
      className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">
        Last modified: {format(lastModified, "MMM d, yyyy 'at' h:mm a")}
      </p>
    </Link>
  );
}
