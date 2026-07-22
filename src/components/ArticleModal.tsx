"use client";

import { useEffect } from "react";
import type { Article } from "@/lib/news";
import { getCategory } from "@/lib/news";
import ArticleImage from "./ArticleImage";
import SourceBadge from "./SourceBadge";
import TimeAgo from "./TimeAgo";

export default function ArticleModal({
  article,
  onClose,
}: {
  article: Article;
  onClose: () => void;
}) {
  const cat = getCategory(article.category);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={article.title}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-card border border-line shadow-xl overflow-hidden"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="overflow-y-auto">
          <div className="relative aspect-[16/9] shrink-0">
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

          <div className="p-5">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider">
              <SourceBadge category={article.category} size={24} />
              <span className="text-ink/80">{article.source}</span>
              <span className="text-muted normal-case font-medium">
                · <TimeAgo date={article.date} />
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold leading-tight">{article.title}</h1>

            {article.content ? (
              <div className="mt-4 space-y-4 text-[15px] text-ink/90 leading-relaxed">
                {article.content.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            ) : (
              article.description && (
                <p className="mt-3 text-muted leading-relaxed">{article.description}</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
