import Parser from "rss-parser";
import { chromium } from "playwright";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "data", "news.json");
// Named for history — now caches the full article-page resolution (image + body text).
const EXTRAS_CACHE_FILE = join(ROOT, "data", "image-cache.json");
const MAX_CONTENT_LEN = 20000;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const gnewsUK = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-GB&gl=GB&ceid=GB:en`;

// Only keep items that are actually about AI/tech — the site's core focus.
// Applied to publisher feeds (broad general feeds) and any Google News feed
// that lists mustMatch explicitly (queries wide enough to admit noise).
const TOPIC_RE =
  /\b(AI|A\.I\.|artificial intelligence|machine learning|algorithm|digital|tech|robot|data|automation|virtual|remote monitoring|telehealth|telecare|EPR|interoperab)|\bapps?\b/i;

// UK-first sources, plus global coverage. Every feed is tagged with the
// region its content actually belongs to, independent of its category —
// e.g. Research and Innovation mixes a UK query with a global (US) publication.
//
// Client-specified categories: Policy and Regulation, Funding and Research,
// Research and Innovation, Practical Opportunities - Our blogs, Assistive Technology.
// NHS & Digital Health content now folds into Policy and Regulation (NHS
// digital rollout is fundamentally a policy story); Social Care Tech folds
// into Assistive Technology (telecare, care robotics, mobility aids overlap
// heavily); the old generic "World" bucket has no equivalent and is dropped.
const FEEDS = [
  // Policy and Regulation — DHSC, CQC (regulator), MHRA, plus NHS digital rollout/policy
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
  { url: "https://www.digitalhealth.net/feed/", category: "policy-regulation", source: "Digital Health", region: "uk" },
  { url: "https://htn.co.uk/feed/", category: "policy-regulation", source: "HTN", region: "uk" },
  { url: gnewsUK('NHS "artificial intelligence"'), category: "policy-regulation", region: "uk" },

  // Funding and Research (was Startups & Funding)
  { url: gnewsUK('healthtech OR "digital health" OR "health tech" startup funding'), category: "funding-research", region: "global" },
  { url: gnewsUK('"health tech" OR healthtech OR "care tech" UK raises OR funding OR investment OR startup'), category: "funding-research", region: "uk" },

  // Research and Innovation
  { url: gnewsUK("AI medical research UK university OR NIHR"), category: "research-innovation", region: "uk" },
  { url: gnewsUK('AI OR "artificial intelligence" health OR medical research OR breakthrough OR study OR trial'), category: "research-innovation", region: "uk" },
  { url: gnewsUK('AI healthcare research OR innovation OR breakthrough OR discovery'), category: "research-innovation", region: "global" },
  {
    url: "https://www.technologyreview.com/feed/",
    category: "research-innovation",
    source: "MIT Tech Review",
    region: "global",
    // general tech feed — keep only health/medicine stories
    mustMatch: /\b(health|medic|drug|cancer|clinical|patient|hospital|biotech|disease|vaccine|surg|NHS|care)\b/i,
  },

  // Practical Opportunities - Our blogs — hands-on adoption stories: case
  // studies, guidance, training and toolkits for AI/digital in health and social care
  { url: gnewsUK('AI OR digital "case study" OR "best practice" OR toolkit health OR "social care"'), category: "practical-opportunities", region: "uk" },
  { url: gnewsUK('"how to" OR guidance OR training OR "digital skills" AI adoption NHS OR "social care"'), category: "practical-opportunities", region: "uk" },
  { url: gnewsUK('NHS OR "social care" staff AI training OR upskilling OR workforce'), category: "practical-opportunities", region: "uk" },

  // Assistive Technology (was Social Care Tech, direct publisher feeds
  // 403-block bots so route via Google News, plus dedicated assistive-tech queries)
  { url: gnewsUK('"assistive technology" OR "assistive tech" disability OR care OR mobility'), category: "assistive-technology", region: "uk" },
  { url: gnewsUK('telecare OR "fall detection" OR "assisted living" OR "care robot" technology'), category: "assistive-technology", region: "uk" },
  { url: gnewsUK('"social care" AI OR digital OR technology OR robotics'), category: "assistive-technology", region: "uk" },
  { url: gnewsUK('"care home" OR "home care" OR "care sector" technology OR AI'), category: "assistive-technology", region: "uk" },
  { url: gnewsUK("site:carehomeprofessional.com OR site:homecareinsight.co.uk"), category: "assistive-technology", region: "uk" },
  {
    // Skills for Care (workforce development body) — query is broad, so
    // require an explicit AI/digital/tech mention to cut generic workforce noise
    url: gnewsUK('"Skills for Care" AI OR digital OR technology OR workforce'),
    category: "assistive-technology",
    region: "uk",
    mustMatch: TOPIC_RE,
    matchOn: "title",
  },
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

const decodeEntities = (s = "") =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const stripHtml = (html = "") =>
  decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

/** Like stripHtml, but keeps paragraph/line breaks — for full article body text. */
function htmlToParagraphText(html = "") {
  const withBreaks = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(withBreaks)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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
    content: null,
    image: extractImage(item),
    // transient — stripped before writing news.json
    isDirect: !isGoogleNews,
    rawContentHtml: item.contentEncoded || item.content || null,
  };
}

/** Full body text already present in the RSS item itself (common on direct WordPress/Atom feeds). */
function contentFromFeed(article) {
  const html = article.rawContentHtml;
  if (!html) return null;
  const text = htmlToParagraphText(html);
  return text.length > 600 ? text.slice(0, MAX_CONTENT_LEN) : null;
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

function extractOgImage(html, baseUrl) {
  const match = html.match(OG_IMAGE_RE) || html.match(OG_IMAGE_RE_REV) || html.match(TWITTER_IMAGE_RE);
  if (!match) return null;
  try {
    return new URL(match[1], baseUrl).href;
  } catch {
    return null;
  }
}

/** Parse full article body text out of a page's HTML via Readability. */
/**
 * Parse both the article body text and (as a fallback for pages with no
 * og:image/twitter:image meta tag) the first real image inside Readability's
 * cleaned article body — much more reliable than scanning the raw page HTML,
 * since Readability has already stripped nav/ad/sidebar images for us.
 */
function parseArticle(html, url) {
  try {
    const dom = new JSDOM(html, { url });
    const parsed = new Readability(dom.window.document).parse();
    const text = parsed?.textContent?.replace(/\n{3,}/g, "\n\n").trim();
    const content = text && text.length > 200 ? text.slice(0, MAX_CONTENT_LEN) : null;

    let image = null;
    const imgMatch = parsed?.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && !/doubleclick|pixel|emoji|gravatar|avatar/i.test(imgMatch[1])) {
      try {
        image = new URL(imgMatch[1], url).href;
      } catch {
        image = null;
      }
    }

    return { content, image };
  } catch {
    return { content: null, image: null };
  }
}

/** Fetch a real article page's HTML. */
async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: BROWSER_LIKE_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return { html: await res.text(), finalUrl: res.url };
  } catch {
    return null;
  }
}

/**
 * Last-resort fallback: render the page in a real (headless) browser. Only
 * reached when the plain fetch() above fails — some sites 403 anything that
 * isn't a real browser. Slower and heavier, so callers should try that first.
 */
async function fetchPageViaBrowser(browser, url) {
  let page;
  try {
    page = await browser.newPage({ userAgent: BROWSER_UA });
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    if (!res || !res.ok()) return null;
    return { html: await page.content(), finalUrl: page.url() };
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
    // The body is XSSI-protected (")]}'" prefix) JSON; the real URL is nested
    // two levels of JSON-encoding deep, so it must be parsed rather than
    // regex-matched — a regex on the raw escaped text breaks whenever the URL
    // itself contains an escaped character (e.g. = for "=" in a query string).
    const outer = JSON.parse(text.replace(/^\)\]\}'/, ""));
    const inner = JSON.parse(outer[0][2]);
    const url = inner[1];
    return typeof url === "string" && /^https?:\/\//.test(url) ? url : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the best available image + full body text for one article: decode
 * Google News links to the real publisher URL first, fetch that page once
 * (plain fetch, falling back to a headless browser for bot-gated sites), then
 * pull both the og:image and the Readability-parsed article text out of it.
 */
async function resolveExtrasForArticle(a, browser) {
  const feedContent = contentFromFeed(a);

  let target = a.link;
  if (GNEWS_ARTICLE_RE.test(a.link)) {
    target = await decodeGoogleNewsUrl(a.link);
  }
  if (!target) return { image: null, content: feedContent };

  let page = await fetchPage(target);
  if (!page) page = await fetchPageViaBrowser(browser, target);
  if (!page) return { image: null, content: feedContent };

  const ogImage = extractOgImage(page.html, page.finalUrl);
  const parsed = ogImage && feedContent ? null : parseArticle(page.html, page.finalUrl);
  const image = ogImage || parsed?.image || null;
  const content = feedContent || parsed?.content || null;
  return { image, content };
}

async function resolveExtras(candidates) {
  let cache = {};
  if (existsSync(EXTRAS_CACHE_FILE)) {
    try {
      cache = JSON.parse(readFileSync(EXTRAS_CACHE_FILE, "utf8"));
    } catch {
      cache = {};
    }
  }

  const RETRY_FAILURE_AFTER_MS = 3 * 24 * 3600 * 1000;
  const toFetch = candidates.filter((a) => {
    const cached = cache[a.link];
    if (!cached) return true;
    if (cached.failedAt) return Date.now() - cached.failedAt > RETRY_FAILURE_AFTER_MS; // known-bad, retry after cooldown
    if (!("content" in cached)) return true; // pre-existing image-only cache entry — needs content resolved
    return false; // already resolved (even a null content/image is a final result)
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
          const { image, content } = await resolveExtrasForArticle(a, browser);
          cache[a.link] = image || content ? { image, content } : { failedAt: Date.now() };
        })
      );
    }
  } finally {
    if (browser) await browser.close();
  }

  for (const a of candidates) {
    const cached = cache[a.link];
    if (!cached) continue;
    if (!a.image && cached.image) a.image = cached.image;
    a.content = cached.content || null;
  }

  // prune cache entries for articles no longer in the current set
  const liveLinks = new Set(candidates.map((a) => a.link));
  for (const link of Object.keys(cache)) {
    if (!liveLinks.has(link)) delete cache[link];
  }

  mkdirSync(dirname(EXTRAS_CACHE_FILE), { recursive: true });
  writeFileSync(EXTRAS_CACHE_FILE, JSON.stringify(cache, null, 1));
  const withContent = candidates.filter((a) => a.content).length;
  console.log(`Resolved article extras: ${toFetch.length} fetched, ${withContent}/${candidates.length} have content`);
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

  // Every article needs its full body text resolved (and, for the ones
  // missing one, an image) — direct feeds scrape their own link, Google News
  // links get decoded to the real publisher URL first (see resolveExtrasForArticle).
  await resolveExtras(capped);

  // Some sites (e.g. GOV.UK) return the same site-wide og:image on every page —
  // not a real per-article photo. Drop any image reused across multiple articles.
  const imageCounts = {};
  for (const a of capped) if (a.image) imageCounts[a.image] = (imageCounts[a.image] || 0) + 1;
  for (const a of capped) if (a.image && imageCounts[a.image] > 1) a.image = null;

  const output = capped.map(({ isDirect, rawContentHtml, ...rest }) => rest);

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify({ updatedAt: new Date().toISOString(), articles: output }, null, 1));
  console.log(`Wrote ${capped.length} articles to data/news.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
