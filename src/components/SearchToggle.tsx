"use client";

import { useState } from "react";
import { useSearch } from "@/lib/search-context";

export default function SearchToggle() {
  const { query, setQuery } = useSearch();
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <input
        autoFocus
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => {
          if (!query) setOpen(false);
        }}
        placeholder="Search headlines…"
        className="w-36 sm:w-56 bg-card border border-line rounded-full px-3 py-1.5 text-sm focus:outline-none focus:border-accent/50 shrink-0"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Search"
      className="flex items-center justify-center w-8 h-8 rounded-full border border-line text-muted hover:text-ink hover:border-accent/40 transition-colors shrink-0"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </button>
  );
}
