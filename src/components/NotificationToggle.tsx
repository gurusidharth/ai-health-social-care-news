"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/news";
import { getAllArticles, getCategory } from "@/lib/news";
import { getCurrentSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import ArticleImage from "./ArticleImage";
import TimeAgo from "./TimeAgo";

// The same "hero" pick used everywhere else (src/lib/news.ts's
// getTopStories) — the freshest article with an image, since
// getAllArticles() is already sorted newest-first. This is also exactly the
// article a real push notification would fire for.
function getHeroArticle(): Article | null {
  return getAllArticles()[0] ?? null;
}

export default function NotificationToggle() {
  const router = useRouter();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showLatest, setShowLatest] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPushSupported()) return;
    setSupported(true);
    getCurrentSubscription().then((sub) => setSubscribed(!!sub));
  }, []);

  useEffect(() => {
    if (!showLatest) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowLatest(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showLatest]);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      if (!subscribed) {
        const ok = await subscribeToPush();
        if (ok) setSubscribed(true);
      }
      setShowLatest((v) => !v);
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsubscribe(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const ok = await unsubscribeFromPush();
      if (ok) {
        setSubscribed(false);
        setShowLatest(false);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  const hero = showLatest ? getHeroArticle() : null;
  const cat = hero ? getCategory(hero.category) : undefined;

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={subscribed ? "Show latest breaking news" : "Turn on breaking news notifications"}
        aria-pressed={subscribed}
        className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors shrink-0 disabled:opacity-60 ${
          subscribed ? "text-accent border-accent/40" : "border-line text-muted hover:text-ink hover:border-accent/40"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={subscribed ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {showLatest && (
        <div className="absolute right-0 top-full mt-2 w-72 max-w-[85vw] rounded-xl bg-card border border-line shadow-xl p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Latest breaking news</p>
            {subscribed && (
              <button type="button" onClick={handleUnsubscribe} className="text-xs font-medium text-muted hover:text-ink">
                Turn off
              </button>
            )}
          </div>

          {hero ? (
            <button
              type="button"
              onClick={() => {
                setShowLatest(false);
                router.push(`/category/${hero.category}/`);
              }}
              className="flex items-center gap-3 rounded-xl bg-bg border border-line p-2 w-full text-left"
            >
              <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden">
                <ArticleImage
                  src={hero.image}
                  alt={hero.title}
                  gradient={cat?.gradient ?? "from-slate-700 to-slate-900"}
                  label={cat?.short ?? "News"}
                  source={hero.source}
                  showLabel={false}
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-snug line-clamp-2">{hero.title}</p>
                <p className="text-xs text-muted mt-0.5">
                  {hero.source} · <TimeAgo date={hero.date} />
                </p>
              </div>
            </button>
          ) : (
            <p className="text-xs text-muted">No breaking news right now.</p>
          )}
        </div>
      )}
    </div>
  );
}
