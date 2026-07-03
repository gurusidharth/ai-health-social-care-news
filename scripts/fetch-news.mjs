import Parser from "rss-parser";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "data", "news.json");

const gnewsUK = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-GB&gl=GB&ceid=GB:en`;
const gnewsUS = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

// Only keep items that are actually about AI/tech — the site's core focus.
// Applied to publisher feeds (broad general feeds) and any Google News feed
// that lists mustMatch explicitly (queries wide enough to admit noise).
const TOPIC_RE =
  /\b(AI|A\.I\.|artificial intelligence|machine learning|algorithm|digital|tech|robot|data|automation|virtual|remote monitoring|telehealth|telecare|EPR|interoperab)|\bapps?\b/i;

// UK-first sources, plus a World category for global coverage.
const FEEDS = [
  // NHS & Digital Health
  { url: "https://www.digitalhealth.net/feed/", category: "nhs-digital-health", source: "Digital Health" },
  { url: "https://htn.co.uk/feed/", category: "nhs-digital-health", source: "HTN" },
  { url: gnewsUK('NHS "artificial intelligence"'), category: "nhs-digital-health" },

  // Social Care Tech (direct publisher feeds 403-block bots, so route via Google News)
  { url: gnewsUK('"social care" AI OR digital OR technology OR robotics'), category: "social-care-tech" },
  { url: gnewsUK('"care home" OR "home care" OR "care sector" technology OR AI'), category: "social-care-tech" },
  { url: gnewsUK("site:carehomeprofessional.com OR site:homecareinsight.co.uk"), category: "social-care-tech" },
  {
    // Skills for Care (workforce development body) — query is broad, so
    // require an explicit AI/digital/tech mention to cut generic workforce noise
    url: gnewsUK('"Skills for Care" AI OR digital OR technology OR workforce'),
    category: "social-care-tech",
    mustMatch: TOPIC_RE,
    matchOn: "title",
  },

  // Policy & Regulation — DHSC, CQC (regulator) and MHRA
  { url: gnewsUK("AI health regulation CQC OR DHSC OR MHRA"), category: "policy-regulation" },
  { url: gnewsUK('CQC "artificial intelligence" OR AI OR "digital technology"'), category: "policy-regulation" },
  {
    url: "https://www.gov.uk/government/organisations/department-of-health-and-social-care.atom",
    category: "policy-regulation",
    source: "GOV.UK DHSC",
    // DHSC publishes all policy news — keep only clearly tech/AI items (by title)
    mustMatch: /\b(AI|artificial intelligence|digital|technology|tech|robot|innovation|data)\b/i,
    matchOn: "title",
  },

  // Research & Innovation
  { url: gnewsUK("AI medical research UK university OR NIHR"), category: "research-innovation" },
  {
    url: "https://www.technologyreview.com/feed/",
    category: "research-innovation",
    source: "MIT Tech Review",
    // general tech feed — keep only health/medicine stories
    mustMatch: /\b(health|medic|drug|cancer|clinical|patient|hospital|biotech|disease|vaccine|surg|NHS|care)\b/i,
  },

  // Startups & Funding
  { url: gnewsUK('healthtech OR "digital health" OR "health tech" startup funding'), category: "startups-funding" },
  { url: gnewsUK('"health tech" OR healthtech OR "care tech" UK raises OR funding OR investment OR startup'), category: "startups-funding" },

  // World
  { url: gnewsUS("AI healthcare"), category: "world" },
  { url: "https://www.healthcareitnews.com/home/feed", category: "world", source: "Healthcare IT News" },
];

const parser = new Parser({
  timeout: 15000,
  headers: { "user-agent": "Mozilla/5.0 (compatible; CarePulseNewsBot/1.0)" },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
      ["source", "gnewsSource"],
    ],
  },
});

const stripHtml = (html = "") =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

function extractImage(item) {
  const media = item.mediaContent?.find((m) => m?.$?.url);
  if (media) return media.$.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url && /image|jpg|jpeg|png|webp/i.test(item.enclosure.type || item.enclosure.url))
    return item.enclosure.url;
  const html = item.contentEncoded || item.content || "";
  const img = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (img && !/doubleclick|pixel|emoji|gravatar/i.test(img[1])) return img[1];
  return null;
}

function normalizeItem(item, feed) {
  let title = stripHtml(item.title || "");
  let source = feed.source || null;
  const isGoogleNews = !feed.source;
  if (isGoogleNews) {
    // Google News: source is in <source> tag and appended to the title as " - Source"
    const tag = item.gnewsSource;
    source = typeof tag === "string" ? tag : tag?._ || null;
    if (source && title.toLowerCase().endsWith(` - ${source.toLowerCase()}`)) {
      title = title.slice(0, -(source.length + 3)).trim();
    } else {
      const idx = title.lastIndexOf(" - ");
      if (idx > 20) {
        source = source || title.slice(idx + 3).trim();
        title = title.slice(0, idx).trim();
      }
    }
  }
  if (!title || !item.link) return null;

  const date = item.isoDate || (item.pubDate ? new Date(item.pubDate).toISOString() : null);
  if (!date || Number.isNaN(Date.parse(date))) return null;

  let description = stripHtml(item.contentSnippet || item.summary || item.content || "");
  // Google News descriptions are just repeated headlines/link lists — drop them
  if (isGoogleNews && description.startsWith(title.slice(0, 40))) description = "";
  if (description.length > 240) description = description.slice(0, 237).trimEnd() + "...";

  return {
    id: null, // filled in after dedup
    title,
    link: item.link,
    source: source || "News",
    category: feed.category,
    date,
    description,
    image: extractImage(item),
  };
}

async function fetchFeed(feed) {
  try {
    const parsed = await parser.parseURL(feed.url);
    const items = (parsed.items || [])
      .map((item) => normalizeItem(item, feed))
      .filter(Boolean)
      // topic-filter publisher feeds; Google News queries are pre-scoped
      .filter((a) => (feed.source ? TOPIC_RE.test(a.title + " " + a.description) : true))
      .filter((a) =>
        feed.mustMatch
          ? feed.mustMatch.test(feed.matchOn === "title" ? a.title : a.title + " " + a.description)
          : true
      );
    console.log(`  ok  ${feed.category.padEnd(20)} ${items.length.toString().padStart(3)} items  ${parsed.title || feed.url}`);
    return items;
  } catch (err) {
    console.warn(`  FAIL ${feed.category.padEnd(20)} ${feed.url} :: ${err.message}`);
    return [];
  }
}

const normTitle = (t) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 90);

async function main() {
  console.log(`Fetching ${FEEDS.length} feeds...`);
  const results = await Promise.all(FEEDS.map(fetchFeed));

  const cutoff = Date.now() - 45 * 24 * 3600 * 1000; // drop stories older than 45 days
  const seen = new Set();
  const articles = [];
  for (const item of results.flat().sort((a, b) => Date.parse(b.date) - Date.parse(a.date))) {
    const key = normTitle(item.title);
    if (seen.has(key) || Date.parse(item.date) < cutoff || Date.parse(item.date) > Date.now() + 3600e3) continue;
    seen.add(key);
    articles.push(item);
  }

  // cap per category
  const perCat = {};
  const capped = articles.filter((a) => {
    perCat[a.category] = (perCat[a.category] || 0) + 1;
    return perCat[a.category] <= 40;
  });
  capped.forEach((a, i) => (a.id = `a${i}`));

  const counts = capped.reduce((m, a) => ((m[a.category] = (m[a.category] || 0) + 1), m), {});
  console.log("Category counts:", counts);

  if (capped.length === 0) {
    if (existsSync(OUT_FILE)) {
      console.warn("All feeds failed — keeping existing data/news.json");
      return;
    }
    throw new Error("All feeds failed and no existing news.json to fall back to");
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify({ updatedAt: new Date().toISOString(), articles: capped }, null, 1));
  console.log(`Wrote ${capped.length} articles to data/news.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
