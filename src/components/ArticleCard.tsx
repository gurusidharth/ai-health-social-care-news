"use client";

import { useState } from "react";
import type { Article } from "@/lib/news";
import { getCategory } from "@/lib/news";
import ArticleImage from "./ArticleImage";
import ArticleModal from "./ArticleModal";
import BookmarkButton from "./BookmarkButton";
import SourceBadge from "./SourceBadge";
import TimeAgo from "./TimeAgo";

export default function ArticleCard({ article }: { article: Article }) {
  const cat = getCategory(article.category);
  const [open, setOpen] = useState(false);
  return (
    <>
    <div
      role="button"
      tabIndex={0}
      onClick={() => setOpen(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setOpen(true);
      }}
      className="group flex flex-col rounded-xl overflow-hidden bg-card border border-line hover:border-accent/40 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="relative">
        <div className="relative aspect-[16/10] overflow-hidden">
          <ArticleImage
            src={article.image}
            alt={article.title}
            gradient={cat?.gradient ?? "from-slate-700 to-slate-900"}
            label={cat?.short ?? "News"}
            source={article.source}
            showLabel={false}
            className="absolute inset-0 w-full h-full transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </div>
        <div className="absolute -bottom-3.5 left-3 z-10">
          <SourceBadge category={article.category} size={28} className="ring-2 ring-card" />
        </div>
      </div>
      <div className="flex flex-col flex-1 p-3 pt-5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1.5">
          <span className="text-ink/70">{article.source}</span>
          <span className="text-muted normal-case font-medium">
            · <TimeAgo date={article.date} />
          </span>
        </div>
        <h3 className="text-sm font-bold leading-snug group-hover:text-accent transition-colors line-clamp-3">
          {article.title}
        </h3>
        <div className="flex justify-end mt-2">
          <BookmarkButton articleId={article.id} />
        </div>
      </div>
    </div>
    {open && <ArticleModal article={article} onClose={() => setOpen(false)} />}
    </>
  );
}
