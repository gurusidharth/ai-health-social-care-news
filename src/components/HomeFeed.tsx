"use client";

import ArticleCard from "@/components/ArticleCard";
import ArticleCardRows from "@/components/ArticleCardRows";
import HeroCard from "@/components/HeroCard";
import TrendingLatestWidget from "@/components/TrendingLatestWidget";
import { useRegion } from "@/lib/region-context";
import { useSearch } from "@/lib/search-context";
import { filterByRegion, filterBySearch, getTopStories, getTrending, type Article } from "@/lib/news";

export default function HomeFeed({ articles }: { articles: Article[] }) {
  const { region } = useRegion();
  const { query } = useSearch();
  const filtered = filterBySearch(filterByRegion(articles, region), query);

  if (filtered.length === 0) {
    return <p className="text-muted">No stories match this filter right now.</p>;
  }

  if (query.trim()) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Search results</h1>
          <p className="text-muted text-sm mt-1">
            {filtered.length} {filtered.length === 1 ? "story" : "stories"} matching &ldquo;{query.trim()}&rdquo;
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </div>
    );
  }

  const top = getTopStories(filtered, 13);
  const [hero, ...cards] = top;
  const latest = filtered.slice(0, 8);
  const latestIds = new Set(latest.map((a) => a.id));
  const trending = getTrending(
    filtered.filter((a) => !latestIds.has(a.id)),
    8
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Top News</h1>
        <p className="text-muted text-sm mt-1">The latest AI news from health and social care.</p>
      </div>

      {hero && <HeroCard article={hero} />}

      <ArticleCardRows articles={cards} />

      <TrendingLatestWidget trending={trending} latest={latest} />
    </div>
  );
}
