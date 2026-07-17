"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "oneaicare:bookmarks";

function readBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export default function BookmarkButton({ articleId }: { articleId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readBookmarks().has(articleId));
  }, [articleId]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const bookmarks = readBookmarks();
    const next = !bookmarks.has(articleId);
    if (next) {
      bookmarks.add(articleId);
    } else {
      bookmarks.delete(articleId);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(bookmarks)));
    setSaved(next);
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
