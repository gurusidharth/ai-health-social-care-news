"use client";

import { useEffect, useState } from "react";
import { getCurrentSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push";

export default function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    setSupported(true);
    getCurrentSubscription().then((sub) => setSubscribed(!!sub));
  }, []);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const ok = subscribed ? await unsubscribeFromPush() : await subscribeToPush();
      if (ok) setSubscribed(!subscribed);
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={subscribed ? "Turn off breaking news notifications" : "Turn on breaking news notifications"}
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
  );
}
