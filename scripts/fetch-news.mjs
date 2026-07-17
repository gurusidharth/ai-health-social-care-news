import Parser from "rss-parser";
import { chromium } from "playwright";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "data", "news.json");
const IMAGE_CACHE_FILE = join(ROOT, "data", "image-cache.json");

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const gnewsUK = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-GB&gl=GB&ceid=GB:en`;
const gnewsUS = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

// Only keep items that are actually about AI/tech — the site's core focus.
// Applied to publisher feeds (broad general feeds) and any Google News feed
// that lists mustMatch explicitly (queries wide enough to admit noise).
const TOPIC_RE =
  /\b(AI|A\.I\.|artificial intelligence|machine learning|algorithm|digital|tech|robot|data|automation|virtual|remote monitoring|telehealth|telecare|EPR|interoperab)|\bapps?\b/i;

// UK-first sources, plus global coverage. Every feed is tagged with the
// region its content actually belongs to, independent of its category —
// e.g. Research & Innovation mixes a UK query with a global (US) publication.
const FEEDS = [
  // NHS & Digital Health
  { url: "https://www.digitalhealth.net/feed/", category: "nhs-digital-health", source: "Digital Health", region: "uk" },
  { url: "https://htn.co.uk/feed/", category: "nhs-digital-health", source: "HTN", region: "uk" },
  { url: gnewsUK('NHS "artificial intelligence"'), category: "nhs-digital-health", region: "uk" },

  // Social Care Tech (direct publisher feeds 403-block bots, so route via Google News)
  { url: gnewsUK('"social care" AI OR digital OR technology OR robotics'), category: "social-care-tech", region: "uk" },
  { url: gnewsUK('"care home" OR "home care" OR "care sector" technology OR AI'), category: "social-care-tech", region: "uk" },
  { url: gnewsUK("site:carehomeprofessional.com OR site:homecareinsight.co.uk"), category: "social-care-tech", region: "uk" },
  {
    // Skills for Care (workforce development body) — query is broad, so
    // require an explicit AI/digital/tech mention to cut generic workforce noise
    url: gnewsUK('"Skills for Care" AI OR digital OR technology OR workforce'),
    category: "social-care-tech",
    region: "uk",
    mustMatch: TOPIC_RE,
    matchOn: "title",
  },

  // Policy & Regulation — DHSC, CQC (regulator) and MHRA
  { url: gnewsUK("AI health regulation CQC OR DHSC OR MHRA"), category: "policy-regulation", region: "uk" },
  { url: gnewsUK('CQC "artificial intelligence" OR AI OR "digital technology"'), category: "policy-regulation", region: "uk" },
  {
    url: "https://www.gov.uk/government/organisations/department-of-health-and-social-care.atom",
    category: "policy-regulation",
    source: "GOV.UK DHSC",
    region: "uk",
    // DHSC publishes all policy news — keep only clearly tech/AI items (by title)
    mustMatch: /\b(AI|artificial intelligence|digital|technology|tech|robot|innovation|data)\b/i,
    matchOn: "title",
  },

  // Research & Innovation
  { url: gnewsUK("AI medical research UK university OR NIHR"), category: "research-innovation", region: "uk" },
  {
    url: "https://www.technologyreview.com/feed/",
    category: "research-innovation",
    source: "MIT Tech Review",
    region: "global",
    // general tech feed — keep only health/medicine stories
    mustMatch: /\b(health|medic|drug|cancer|clinical|patient|hospital|biotech|disease|vaccine|surg|NHS|care)\b/i,
  },

  // Startups & Funding
  { url: gnewsUK('healthtech OR "digital health" OR "health tech" startup funding'), category: "startups-funding", region: "global" },
  { url: gnewsUK('"health tech" OR healthtech OR "care tech" UK raises OR funding OR investment OR startup'), category: "startups-funding", region: "uk" },

  // World
  { url: gnewsUS("AI healthcare"), category: "world", region: "global" },
  { url: "https://www.healthcareitnews.com/home/feed", category: "world", source: "Healthcare IT News", region: "global" },
];

const parser = new Parser({
  timeout: 15000,
  headers: { "user-agent": "Mozilla/5.0 (compatible; OneAICareNewsBot/1.0)" },
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
    region: feed.region || "uk",
    date,
    description,
    image: extractImage(item),
    // transient — used to decide og:image scraping, stripped before writing news.json
    isDirect: !isGoogleNews,
  };
}

const OG_IMAGE_RE =
  /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i;
const OG_IMAGE_RE_REV =
  /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image(?::secure_url)?["']/i;
const TWITTER_IMAGE_RE =
  /<meta[^>]+(?:property|name)=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i;

// A bare user-agent trips basic bot-detection on some publisher sites — these
// extra headers mimic what a real browser navigation actually sends.
const BROWSER_LIKE_HEADERS = {
  "user-agent": BROWSER_UA,
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "sec-fetch-mode": "navigate",
  "sec-fetch-dest": "document",
  "sec-fetch-site": "none",
  "upgrade-insecure-requests": "1",
};

/** Fetch a real article page and read its og:image/twitter:image meta tag. */
async function fetchOgImage(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: BROWSER_LIKE_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(OG_IMAGE_RE) || html.match(OG_IMAGE_RE_REV) || html.match(TWITTER_IMAGE_RE);
    if (!match) return null;
    return new URL(match[1], res.url).href;
  } catch {
    return null;
  }
}

/**
 * Last-resort fallback: render the page in a real (headless) browser and
 * read og:image from the rendered HTML. Only reached when the plain fetch()
 * above fails — some sites 403 anything that isn't a real browser. Slower and
 * heavier than fetchOgImage, so callers should try that first.
 */
async function fetchOgImageViaBrowser(browser, url) {
  let page;
  try {
    page = await browser.newPage({ userAgent: BROWSER_UA });
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    if (!res || !res.ok()) return null;
    const html = await page.content();
    const match = html.match(OG_IMAGE_RE) || html.match(OG_IMAGE_RE_REV) || html.match(TWITTER_IMAGE_RE);
    if (!match) return null;
    return new URL(match[1], page.url()).href;
  } catch {
    return null;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

const GNEWS_ARTICLE_RE = /news\.google\.com\/rss\/articles\/([^?]+)/;

/**
 * Google News RSS article links are a JS-rendered redirect page, not the
 * publisher URL — plain fetch() can't follow them, so og:image scraping on
 * the raw link just reads Google's own page. This decodes the real publisher
 * URL via Google News' internal batchexecute endpoint (undocumented but
 * widely relied upon by open-source Google News decoders) so we can scrape
 * the actual article's og:image instead.
 */
async function decodeGoogleNewsUrl(articleUrl) {
  const m = articleUrl.match(GNEWS_ARTICLE_RE);
  if (!m) return null;
  const articleId = m[1];

  try {
    const res = await fetch(articleUrl, {
      headers: { "user-agent": BROWSER_UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const dataP = html.match(/data-p="([^"]+)"/);
    if (!dataP) return null;
    const decoded = dataP[1].replace(/&quot;/g, '"');
    const tail = decoded.match(/,(\d{9,}),"([^"]+)"\]$/);
    if (!tail) return null;
    const [, timestamp, signature] = tail;

    // Google validates the locale in this payload against the session that
    // issued the signature — reuse whatever locale/country Google actually
    // embedded in the page rather than a hardcoded one.
    const localeMatch = decoded.match(/^%\.@\.\[\["([^"]+)","([^"]+)"/);
    const [lang, country] = localeMatch ? [localeMatch[1], localeMatch[2]] : ["en-US", "US"];

    const innerPayload = JSON.stringify([
      "garturlreq",
      [
        [lang, country, ["FINANCE_TOP_INDICES", "GENESIS_PUBLISHER_SECTION", "WEB_TEST_1_0_0"], null, null, 1, 1, `${country}:en`],
        lang,
        country,
        1,
        [3, 5, 9, 19],
        1,
        1,
        null,
        0,
        0,
        null,
        0,
      ],
      articleId,
      timestamp,
      signature,
    ]);
    const body = new URLSearchParams();
    body.set("f.req", JSON.stringify([[["Fbv4je", innerPayload, null, "generic"]]]));

    const decodeRes = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        "user-agent": BROWSER_UA,
      },
      body: body.toString(),
      signal: AbortSignal.timeout(8000),
    });
    if (!decodeRes.ok) return null;
    const text = await decodeRes.text();
    // The URL is JSON-encoded inside a JSON string, so its quotes are escaped
    // (\"garturlres\",\"https://...\") in the raw response body.
    const urlMatch = text.match(/"garturlres\\",\\"(https?:\/\/[^\\"]+)\\"/);
    return urlMatch ? urlMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the best available image for one article: decode Google News links
 * to the real publisher URL first, try a plain fetch, and only reach for the
 * (much slower) headless browser if that fetch didn't turn up an image.
 */
async function resolveImageForArticle(a, browser) {
  let target = a.link;
  if (GNEWS_ARTICLE_RE.test(a.link)) {
    target = await decodeGoogleNewsUrl(a.link);
    if (!target) return null;
  }
  const viaFetch = await fetchOgImage(target);
  if (viaFetch) return viaFetch;
  return fetchOgImageViaBrowser(browser, target);
}

async function resolveImages(candidates) {
  let cache = {};
  if (existsSync(IMAGE_CACHE_FILE)) {
    try {
      cache = JSON.parse(readFileSync(IMAGE_CACHE_FILE, "utf8"));
    } catch {
      cache = {};
    }
  }

  const RETRY_FAILURE_AFTER_MS = 3 * 24 * 3600 * 1000;
  const toFetch = candidates.filter((a) => {
    const cached = cache[a.link];
    if (!cached) return true;
    if (cached.url) return false; // known-good, skip
    return Date.now() - cached.failedAt > RETRY_FAILURE_AFTER_MS; // known-bad, retry after cooldown
  });

  const browser = toFetch.length > 0 ? await chromium.launch() : null;
  try {
    // Headless pages are far heavier than plain fetches (real browser process
    // per page), so keep concurrency low even though most candidates never
    // reach the browser fallback.
    const CONCURRENCY = 3;
    for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
      const batch = toFetch.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map(async (a) => {
          const url = await resolveImageForArticle(a, browser);
          cache[a.link] = url ? { url } : { failedAt: Date.now() };
        })
      );
    }
  } finally {
    if (browser) await browser.close();
  }

  for (const a of candidates) {
    const cached = cache[a.link];
    if (cached?.url) a.image = cached.url;
  }

  // prune cache entries for articles no longer in the current set
  const liveLinks = new Set(candidates.map((a) => a.link));
  for (const link of Object.keys(cache)) {
    if (!liveLinks.has(link)) delete cache[link];
  }

  mkdirSync(dirname(IMAGE_CACHE_FILE), { recursive: true });
  writeFileSync(IMAGE_CACHE_FILE, JSON.stringify(cache, null, 1));
  console.log(`Resolved images: ${toFetch.length} fetched (${toFetch.filter((a) => cache[a.link]?.url).length} succeeded), ${candidates.length - toFetch.length} cached`);
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

  // og:image scraping for every article still missing an image — direct feeds
  // scrape their own link, Google News links get decoded to the real publisher
  // URL first (see resolveImageForArticle).
  const imageCandidates = capped.filter((a) => !a.image);
  await resolveImages(imageCandidates);

  // Some sites (e.g. GOV.UK) return the same site-wide og:image on every page —
  // not a real per-article photo. Drop any image reused across multiple articles.
  const imageCounts = {};
  for (const a of capped) if (a.image) imageCounts[a.image] = (imageCounts[a.image] || 0) + 1;
  for (const a of capped) if (a.image && imageCounts[a.image] > 1) a.image = null;

  const output = capped.map(({ isDirect, ...rest }) => rest);

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify({ updatedAt: new Date().toISOString(), articles: output }, null, 1));
  console.log(`Wrote ${capped.length} articles to data/news.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
