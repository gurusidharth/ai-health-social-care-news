"use client";

import { useState } from "react";
import type { Article } from "@/lib/news";
import { getCategory } from "@/lib/news";
import ArticleImage from "./ArticleImage";
import ArticleModal from "./ArticleModal";
import BookmarkButton from "./BookmarkButton";
import NewBadge from "./NewBadge";
import SourceBadge from "./SourceBadge";
import TimeAgo from "./TimeAgo";

export default function ArticleCard({ article }: { article: Article }) {
  const cat = getCategory(article.category);
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Compact thumbnail+text row on mobile — big image-top cards make mobile feeds too tall */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        className="group sm:hidden h-full flex items-center gap-3 rounded-xl bg-card border border-line p-2 cursor-pointer"
      >
        <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden">
          <ArticleImage
            src={article.image}
            alt={article.title}
            gradient={cat?.gradient ?? "from-slate-700 to-slate-900"}
            label={cat?.short ?? "News"}
            source={article.source}
            showLabel={false}
            className="absolute inset-0 w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider min-w-0">
              <SourceBadge source={article.source} size={14} />
              <span className="text-ink/70 normal-case truncate">{article.source}</span>
              <span className="text-muted normal-case font-medium shrink-0">
                · <TimeAgo date={article.date} />
              </span>
            </div>
            <BookmarkButton articleId={article.id} />
          </div>
        </div>
      </div>

      {/* Image-top card on tablet/desktop */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        className="group hidden sm:flex h-full flex-col rounded-xl overflow-hidden bg-card border border-line cursor-pointer"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <NewBadge date={article.date} />
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
        <div className="flex flex-col flex-1 p-3">
          <h3 className="text-base font-bold leading-snug group-hover:text-accent transition-colors line-clamp-3">
            {article.title}
          </h3>
          <div className="flex items-center justify-between gap-2 mt-auto pt-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider min-w-0">
              <SourceBadge source={article.source} size={16} />
              <span className="text-ink/70 normal-case truncate">{article.source}</span>
              <span className="text-muted normal-case font-medium shrink-0">
                · <TimeAgo date={article.date} />
              </span>
            </div>
            <BookmarkButton articleId={article.id} />
          </div>
        </div>
      </div>
      {open && <ArticleModal article={article} onClose={() => setOpen(false)} />}
    </>
  );
}
