"use client";

import { useEffect, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import { onBookmarksChange, readBookmarks } from "@/lib/bookmarks";
import { getAllArticles, type Article } from "@/lib/news";

export default function SavedPage() {
  const [ids, setIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    const sync = () => setIds(readBookmarks());
    sync();
    return onBookmarksChange(sync);
  }, []);

  const saved: Article[] = ids ? getAllArticles().filter((a) => ids.has(a.id)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Saved articles</h1>
        <p className="text-muted text-sm mt-1">
          {ids === null
            ? "Loading…"
            : `${saved.length} ${saved.length === 1 ? "story" : "stories"} saved on this device.`}
        </p>
      </div>

      {ids !== null && saved.length === 0 && (
        <p className="text-muted">Nothing saved yet — tap the bookmark icon on any story to keep it here.</p>
      )}

      {saved.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-5">
          {saved.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
