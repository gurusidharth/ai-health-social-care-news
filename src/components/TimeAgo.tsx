"use client";

import { useEffect, useState } from "react";

function format(date: string): string {
  const diff = Date.now() - Date.parse(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function TimeAgo({ date }: { date: string }) {
  const [text, setText] = useState(() => format(date));
  useEffect(() => setText(format(date)), [date]);
  return <span suppressHydrationWarning>{text}</span>;
}
