"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "oneaicare:bookmarks";

function readBookmarks(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export default function BookmarkButton({ id, className = "" }: { id: string; className?: string }) {
  // Starts false on both server and client render to avoid a hydration
  // mismatch, then syncs from localStorage once mounted.
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readBookmarks().has(id));
  }, [id]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const bookmarks = readBookmarks();
    const next = !saved;
    if (next) bookmarks.add(id);
    else bookmarks.delete(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...bookmarks]));
    setSaved(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? "Remove bookmark" : "Add to your bookmarks"}
      aria-pressed={saved}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-card/90 backdrop-blur border border-line text-muted hover:text-accent hover:border-accent/40 transition-colors ${className}`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={saved ? "text-accent" : ""}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
