import newsData from "../../data/news.json";

export type Region = "uk" | "global";
export type RegionFilter = "all" | Region;

export type Article = {
  id: string;
  title: string;
  link: string;
  source: string;
  category: string;
  region: Region;
  date: string;
  description: string;
  image: string | null;
};

export type Category = {
  slug: string;
  label: string;
  short: string;
  gradient: string;
};

export const CATEGORIES: Category[] = [
  { slug: "nhs-digital-health", label: "NHS & Digital Health", short: "NHS", gradient: "from-sky-800 to-slate-900" },
  { slug: "social-care-tech", label: "Social Care Tech", short: "Social Care", gradient: "from-emerald-800 to-slate-900" },
  { slug: "policy-regulation", label: "Policy & Regulation", short: "Policy", gradient: "from-indigo-800 to-slate-900" },
  { slug: "research-innovation", label: "Research & Innovation", short: "Research", gradient: "from-purple-800 to-slate-900" },
  { slug: "startups-funding", label: "Startups & Funding", short: "Startups", gradient: "from-amber-800 to-slate-900" },
  { slug: "world", label: "World", short: "World", gradient: "from-rose-800 to-slate-900" },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getAllArticles(): Article[] {
  return newsData.articles as Article[];
}

export function getArticlesByCategory(slug: string): Article[] {
  return getAllArticles().filter((a) => a.category === slug);
}

export function filterByRegion(articles: Article[], region: RegionFilter): Article[] {
  return region === "all" ? articles : articles.filter((a) => a.region === region);
}

export function filterBySearch(articles: Article[], query: string): Article[] {
  const q = query.trim().toLowerCase();
  if (!q) return articles;
  return articles.filter((a) => a.title.toLowerCase().includes(q));
}

/**
 * Top stories: hero prefers a fresh story with an image, then the newest
 * article per category (variety), then the rest capped at 3 per category.
 */
export function getTopStories(all: Article[], limit: number): Article[] {
  const hero =
    all.find((a) => a.category !== "world" && a.image) ?? all.find((a) => a.image) ?? all[0];
  if (!hero) return [];

  const picked = new Set([hero.id]);
  const out = [hero];

  for (const cat of CATEGORIES) {
    const lead = all.find((a) => a.category === cat.slug && !picked.has(a.id));
    if (lead) {
      picked.add(lead.id);
      out.push(lead);
    }
  }

  const perCat: Record<string, number> = {};
  for (const a of out) perCat[a.category] = (perCat[a.category] || 0) + 1;
  for (const a of all) {
    if (out.length >= limit) break;
    if (picked.has(a.id) || (perCat[a.category] || 0) >= 3) continue;
    picked.add(a.id);
    perCat[a.category] = (perCat[a.category] || 0) + 1;
    out.push(a);
  }
  return out.slice(0, limit);
}

/** Trending: newest stories from distinct sources, preferring ones with images. */
export function getTrending(all: Article[], limit: number): Article[] {
  const seen = new Set<string>();
  const out: Article[] = [];
  for (const a of all) {
    if (seen.has(a.source)) continue;
    seen.add(a.source);
    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}

export function getUpdatedAt(): string {
  return newsData.updatedAt;
}
