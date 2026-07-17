"use client";

import { useState } from "react";
import ArticleCard from "./ArticleCard";
import type { Article } from "@/lib/news";

const TABS = [
  {
    key: "trending" as const,
    label: "Trending",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    ),
  },
  {
    key: "latest" as const,
    label: "Latest",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
];

export default function TrendingLatestWidget({
  trending,
  latest,
}: {
  trending: Article[];
  latest: Article[];
}) {
  const [tab, setTab] = useState<"trending" | "latest">("trending");
  const articles = tab === "trending" ? trending : latest;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === t.key
                ? "bg-accent text-[#0f1114]"
                : "bg-card border border-line text-muted hover:text-ink"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}
