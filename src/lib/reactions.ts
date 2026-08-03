import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

const STORAGE_KEY = "oneaicare:reactions";
const CHANGE_EVENT = "oneaicare:reactions-changed";

function readReacted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writeReacted(reacted: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(reacted)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function hasReacted(link: string): boolean {
  return readReacted().has(link);
}

export function onReactionsChange(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

const authHeaders = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

export async function fetchReactionCount(link: string): Promise<number> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/reactions?links=${encodeURIComponent(link)}`, {
      headers: authHeaders,
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data?.counts?.[link] ?? 0;
  } catch {
    return 0;
  }
}

/** Toggles this device's reaction and returns the article's new count (or null on failure). */
export async function toggleReaction(link: string): Promise<number | null> {
  const reacted = readReacted();
  const wasReacted = reacted.has(link);
  const action = wasReacted ? "unreact" : "react";

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/reactions`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ link, action }),
    });
    if (!res.ok) return null;
    const data = await res.json();

    if (wasReacted) reacted.delete(link);
    else reacted.add(link);
    writeReacted(reacted);

    return data?.count ?? null;
  } catch {
    return null;
  }
}
