"use client";

import { useEffect, useState } from "react";
import { onFollowsChange, readFollows, toggleFollow } from "@/lib/follows";

export default function FollowButton({ slug }: { slug: string }) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const sync = () => setFollowing(readFollows().has(slug));
    sync();
    return onFollowsChange(sync);
  }, [slug]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setFollowing(toggleFollow(slug));
      }}
      aria-pressed={following}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-colors shrink-0 ${
        following
          ? "bg-accent text-[#0f1114] border-accent"
          : "border-line text-muted hover:text-ink hover:border-accent/40"
      }`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill={following ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {following ? "Following" : "Follow"}
    </button>
  );
}
