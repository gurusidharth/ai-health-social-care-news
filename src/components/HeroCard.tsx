"use client";

import { useState } from "react";
import type { Article } from "@/lib/news";
import ArticleImage from "./ArticleImage";
import ArticleModal from "./ArticleModal";
import SourceBadge from "./SourceBadge";
import TimeAgo from "./TimeAgo";
import { getCategory } from "@/lib/news";

export default function HeroCard({ article }: { article: Article }) {
  const cat = getCategory(article.category);
  const [open, setOpen] = useState(false);
  return (
    <>
    <div className="grid md:grid-cols-[1.3fr_1fr] gap-5 items-stretch">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        className="group relative block rounded-2xl overflow-hidden bg-card border border-line shadow-sm min-h-[240px] md:min-h-[380px] cursor-pointer"
      >
        <ArticleImage
          src={article.image}
          alt={article.title}
          gradient={cat?.gradient ?? "from-slate-700 to-slate-900"}
          label={cat?.short ?? "News"}
          source={article.source}
          className="absolute inset-0 w-full h-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        className="group flex flex-col justify-center cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider">
          <SourceBadge category={article.category} />
          <span className="text-ink/80">{article.source}</span>
          <span className="text-muted normal-case font-medium">
            · <TimeAgo date={article.date} />
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold leading-tight group-hover:text-accent transition-colors">
          {article.title}
        </h1>
        {article.description && (
          <p className="mt-3 text-muted line-clamp-3">{article.description}</p>
        )}
      </div>
    </div>
    {open && <ArticleModal article={article} onClose={() => setOpen(false)} />}
    </>
  );
}
