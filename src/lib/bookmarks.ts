const STORAGE_KEY = "oneaicare:bookmarks";
const CHANGE_EVENT = "oneaicare:bookmarks-changed";

export function readBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writeBookmarks(bookmarks: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(bookmarks)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function toggleBookmark(articleId: string): boolean {
  const bookmarks = readBookmarks();
  const next = !bookmarks.has(articleId);
  if (next) {
    bookmarks.add(articleId);
  } else {
    bookmarks.delete(articleId);
  }
  writeBookmarks(bookmarks);
  return next;
}

export function onBookmarksChange(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
