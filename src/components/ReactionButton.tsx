"use client";

import { useEffect, useState } from "react";
import { fetchReactionCount, hasReacted, onReactionsChange, toggleReaction } from "@/lib/reactions";

export default function ReactionButton({ link }: { link: string }) {
  const [reacted, setReacted] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setReacted(hasReacted(link));
    sync();
    fetchReactionCount(link).then(setCount);
    return onReactionsChange(sync);
  }, [link]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = await toggleReaction(link);
    if (next !== null) {
      setReacted(hasReacted(link));
      setCount(next);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={reacted ? "Remove reaction" : "Mark as useful"}
      aria-pressed={reacted}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-colors shrink-0 ${
        reacted
          ? "bg-accent text-[#0f1114] border-accent"
          : "border-line text-muted hover:text-ink hover:border-accent/40"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={reacted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      Useful{count !== null && count > 0 ? ` · ${count}` : ""}
    </button>
  );
}
