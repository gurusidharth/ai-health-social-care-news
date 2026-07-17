"use client";

import ArticleCard from "@/components/ArticleCard";
import FeedList from "@/components/FeedList";
import { useRegion } from "@/lib/region-context";
import { filterByRegion, type Article, type Category } from "@/lib/news";

export default function CategoryFeed({ category, articles }: { category: Category; articles: Article[] }) {
  const { region } = useRegion();
  const filtered = filterByRegion(articles, region);
  const cards = filtered.slice(0, 15);
  const more = filtered.slice(15);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {cards.length === 0 && (
        <p className="text-muted">
          No {region === "all" ? "" : region === "uk" ? "UK " : "global "}stories in this category
          right now — check back after the next refresh.
        </p>
      )}

      {cards.length > 0 && (
        <div className="flex flex-col gap-4">
          {cards.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}

      {more.length > 0 && <FeedList articles={more} title={`More ${category.label}`} />}
    </div>
  );
}
