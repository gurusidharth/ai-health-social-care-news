"use client";

import { useState } from "react";
import type { Article } from "@/lib/news";
import { getCategory } from "@/lib/news";
import ArticleImage from "./ArticleImage";
import ArticleModal from "./ArticleModal";
import BookmarkButton from "./BookmarkButton";
import SourceBadge from "./SourceBadge";
import TimeAgo from "./TimeAgo";

/** Wide featured card: image on the left, text on the right — used to break up dense card grids. */
export default function FeaturedArticleCard({ article }: { article: Article }) {
  const cat = getCategory(article.category);
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="h-full flex rounded-xl overflow-hidden bg-card border border-line min-h-[260px] md:min-h-[220px]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpen(true);
          }}
          className="group flex flex-1 min-w-0 cursor-pointer"
        >
          <div className="relative w-2/5 shrink-0 overflow-hidden">
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
          <div className="flex flex-col justify-center flex-1 p-4 min-w-0">
            <h3 className="text-sm md:text-base font-bold leading-snug group-hover:text-accent transition-colors line-clamp-3">
              {article.title}
            </h3>
            {article.description && (
              <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-3">{article.description}</p>
            )}
            <div className="flex items-center justify-between gap-2 mt-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider min-w-0">
                <SourceBadge category={article.category} size={16} />
                <span className="text-ink/70 normal-case truncate">{article.source}</span>
                <span className="text-muted normal-case font-medium shrink-0">
                  · <TimeAgo date={article.date} />
                </span>
              </div>
              <BookmarkButton articleId={article.id} />
            </div>
          </div>
        </div>
      </div>
      {open && <ArticleModal article={article} onClose={() => setOpen(false)} />}
    </>
  );
}
