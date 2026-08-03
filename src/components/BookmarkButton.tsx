"use client";

import { useEffect, useState } from "react";
import { onBookmarksChange, readBookmarks, toggleBookmark } from "@/lib/bookmarks";

export default function BookmarkButton({ articleId }: { articleId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(readBookmarks().has(articleId));
    sync();
    return onBookmarksChange(sync);
  }, [articleId]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaved(toggleBookmark(articleId));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? "Remove bookmark" : "Save article"}
      aria-pressed={saved}
      className={`p-1 -m-1 transition-colors ${saved ? "text-accent" : "text-muted hover:text-ink"}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
