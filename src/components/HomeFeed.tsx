"use client";

import ArticleCard from "@/components/ArticleCard";
import TrendingSidebar from "@/components/TrendingSidebar";
import { useRegion } from "@/lib/region-context";
import { filterByRegion, getTopStories, getTrending, type Article } from "@/lib/news";

export default function HomeFeed({ articles }: { articles: Article[] }) {
  const { region } = useRegion();
  const filtered = filterByRegion(articles, region);

  if (filtered.length === 0) {
    return <p className="text-muted">No stories match this filter right now.</p>;
  }

  const top = getTopStories(filtered, 20);
  const trending = getTrending(filtered, 6);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-extrabold text-2xl">Top stories</h1>
        <p className="text-muted text-sm mt-1">
          The hottest news and views on AI in health &amp; social care
        </p>
      </div>

      <TrendingSidebar articles={trending} />

      <div className="flex flex-col gap-2.5">
        {top.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </div>
  );
}
