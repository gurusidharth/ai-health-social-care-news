const STORAGE_KEY = "oneaicare:follows";
const CHANGE_EVENT = "oneaicare:follows-changed";

export function readFollows(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writeFollows(follows: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(follows)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function toggleFollow(slug: string): boolean {
  const follows = readFollows();
  const next = !follows.has(slug);
  if (next) {
    follows.add(slug);
  } else {
    follows.delete(slug);
  }
  writeFollows(follows);
  return next;
}

export function onFollowsChange(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
