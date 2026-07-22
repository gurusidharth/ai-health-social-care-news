"use client";

import { useState } from "react";
import type { Article } from "@/lib/news";
import ArticleImage from "./ArticleImage";
import ArticleModal from "./ArticleModal";
import BookmarkButton from "./BookmarkButton";
import SourceBadge from "./SourceBadge";
import TimeAgo from "./TimeAgo";
import { getCategory } from "@/lib/news";

export default function HeroCard({
  article,
  onImageFail,
}: {
  article: Article;
  onImageFail?: () => void;
}) {
  const cat = getCategory(article.category);
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="relative flex flex-col md:flex-row rounded-xl overflow-hidden bg-card border border-line">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpen(true);
          }}
          className="group flex flex-col md:flex-row flex-1 min-w-0 cursor-pointer"
        >
          <div className="relative md:w-3/5 shrink-0 min-h-[220px] md:min-h-[360px] overflow-hidden">
            <ArticleImage
              src={article.image}
              alt={article.title}
              gradient={cat?.gradient ?? "from-slate-700 to-slate-900"}
              label={cat?.short ?? "News"}
              source={article.source}
              className="absolute inset-0 w-full h-full transition-transform duration-300 group-hover:scale-[1.03]"
              onFail={onImageFail}
            />
          </div>

          <div className="flex flex-col justify-center flex-1 p-5 md:p-6 min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold leading-tight group-hover:text-accent transition-colors">
              {article.title}
            </h1>
            {article.description && (
              <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-4">{article.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold pr-8">
              <SourceBadge category={article.category} size={20} />
              <span className="text-ink/80">{article.source}</span>
              <span className="text-muted font-medium">
                · <TimeAgo date={article.date} />
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 right-4">
          <BookmarkButton articleId={article.id} />
        </div>
      </div>
      {open && <ArticleModal article={article} onClose={() => setOpen(false)} />}
    </>
  );
}
