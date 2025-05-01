import { Editor } from "@tiptap/react";

type FloatingBadgesProps = {
  editor: Editor | null;
  isSaving: boolean;
};

export function FloatingBadges({ editor, isSaving }: FloatingBadgesProps) {
  if (!editor) return null;

  const characterCount = editor.state.doc.textContent.length;

  return (
    <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
      <div
        className={`rounded-lg shadow-lg border border-gray-200 px-3 py-2 text-sm ${
          isSaving ? "bg-yellow-50" : "bg-green-50"
        }`}
      >
        {isSaving ? "Saving..." : "All changes saved"}
      </div>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 text-sm">
        {characterCount.toLocaleString()} characters
      </div>
    </div>
  );
}
