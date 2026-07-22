"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import HeroCard from "@/components/HeroCard";
import TrendingLatestWidget from "@/components/TrendingLatestWidget";
import { useRegion } from "@/lib/region-context";
import { useSearch } from "@/lib/search-context";
import {
  CATEGORIES,
  filterByRegion,
  filterBySearch,
  getTopStories,
  getTrending,
  type Article,
  type Category,
} from "@/lib/news";

function CategorySection({ category, articles }: { category: Category; articles: Article[] }) {
  const [heroIndex, setHeroIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  if (articles.length === 0) return null;

  const hero = articles[heroIndex] ?? articles[0];
  const cards = articles.filter((_, i) => i !== heroIndex);

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section>
      <div className="mb-4">
        <Link href={`/category/${category.slug}/`} className="text-xl font-extrabold hover:text-accent transition-colors">
          {category.label}
        </Link>
      </div>

      <HeroCard
        article={hero}
        onImageFail={() => {
          const next = articles.findIndex((a, i) => i !== heroIndex && a.image);
          if (next !== -1) setHeroIndex(next);
        }}
      />

      {cards.length > 0 && (
        <div className="relative mt-4">
          <div ref={scrollerRef} className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
            {cards.map((a) => (
              <div key={a.id} className="w-[260px] shrink-0 snap-start">
                <ArticleCard article={a} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 items-center justify-center w-9 h-9 rounded-full bg-card border border-line text-ink shadow-md hover:border-accent/40 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 items-center justify-center w-9 h-9 rounded-full bg-card border border-line text-ink shadow-md hover:border-accent/40 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}

export default function HomeFeed({ articles }: { articles: Article[] }) {
  const { region } = useRegion();
  const { query } = useSearch();
  const filtered = filterBySearch(filterByRegion(articles, region), query);
  const [heroIndex, setHeroIndex] = useState(0);

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
  const hero = top[heroIndex] ?? top[0];
  const cards = top.filter((_, i) => i !== heroIndex);
  const latest = filtered.slice(0, 8);
  const latestIds = new Set(latest.map((a) => a.id));
  const trending = getTrending(
    filtered.filter((a) => !latestIds.has(a.id)),
    8
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Top News</h1>
        <p className="text-muted text-sm mt-1">The latest AI news from health and social care.</p>
      </div>

      {hero && (
        <div>
          <HeroCard
            article={hero}
            onImageFail={() => {
              const next = top.findIndex((a, i) => i !== heroIndex && a.image);
              if (next !== -1) setHeroIndex(next);
            }}
          />
          {cards.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {cards.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </div>
      )}

      {CATEGORIES.map((cat) => (
        <CategorySection key={cat.slug} category={cat} articles={filtered.filter((a) => a.category === cat.slug)} />
      ))}

      <TrendingLatestWidget trending={trending} latest={latest} />
    </div>
  );
}
