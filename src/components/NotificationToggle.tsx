"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/news";
import { getAllArticles, getCategory } from "@/lib/news";
import { getCurrentSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import ArticleImage from "./ArticleImage";
import TimeAgo from "./TimeAgo";

// Mirrors the email digest exactly: scripts/notify-digest.mjs sends every
// article from the last 24h (LOOKBACK_MS), and supabase/functions/notify
// caps a single digest at MAX_ARTICLES_PER_DIGEST (30). Same window, same
// cap, so this shows the same set of stories the last email actually did.
const LOOKBACK_MS = 24 * 3600 * 1000;
const MAX_ARTICLES = 30;

function getDigestArticles(): Article[] {
  const cutoff = Date.now() - LOOKBACK_MS;
  return getAllArticles()
    .filter((a) => Date.parse(a.date) >= cutoff)
    .slice(0, MAX_ARTICLES);
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

  const articles = showLatest ? getDigestArticles() : [];

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={subscribed ? "Show breaking news" : "Turn on breaking news notifications"}
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
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[90vw] rounded-xl bg-card border border-line shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-line shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              Breaking news <span className="text-muted normal-case font-medium">· last 24h</span>
            </p>
            {subscribed && (
              <button type="button" onClick={handleUnsubscribe} className="text-xs font-medium text-muted hover:text-ink">
                Turn off
              </button>
            )}
          </div>

          {articles.length > 0 ? (
            <div className="max-h-[70vh] overflow-y-auto p-2 flex flex-col gap-1">
              {articles.map((article) => {
                const cat = getCategory(article.category);
                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => {
                      setShowLatest(false);
                      router.push(`/category/${article.category}/`);
                    }}
                    className="flex items-center gap-3 rounded-xl bg-bg border border-line p-2 w-full text-left shrink-0"
                  >
                    <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden">
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
                      <p className="text-sm font-bold leading-snug line-clamp-2">{article.title}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {article.source} · <TimeAgo date={article.date} />
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted p-3">No breaking news in the last 24 hours.</p>
          )}
        </div>
      )}
    </div>
  );
}
