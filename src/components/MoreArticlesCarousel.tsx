"use client";

import { useRef } from "react";
import type { Article } from "@/lib/news";
import ArticleCard from "./ArticleCard";

export default function MoreArticlesCarousel({ articles, title }: { articles: Article[]; title: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-extrabold text-xl">{title}</h2>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-line text-muted hover:text-ink hover:border-accent/40 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-line text-muted hover:text-ink hover:border-accent/40 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {articles.map((a) => (
          <div key={a.id} className="w-[260px] shrink-0 snap-start">
            <ArticleCard article={a} />
          </div>
        ))}
      </div>
    </section>
  );
}
