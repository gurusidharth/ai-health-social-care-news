"use client";

import { useEffect, useState } from "react";

const FRESH_WINDOW_MS = 3 * 60 * 60 * 1000;

/** Small "New" pill over a thumbnail for articles published within the freshness window — avoided on the initial server render so it never flashes based on stale build-time data. */
export default function NewBadge({ date }: { date: string }) {
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    setFresh(Date.now() - Date.parse(date) < FRESH_WINDOW_MS);
  }, [date]);

  if (!fresh) return null;

  return (
    <span className="absolute top-2 left-2 z-10 inline-flex items-center rounded-full bg-accent text-[#0f1114] text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 shadow">
      New
    </span>
  );
}
