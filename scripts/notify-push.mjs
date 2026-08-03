// Posts the single "hero" article of this fetch cycle to the `notify-push`
// Supabase Edge Function, which sends a Web Push notification to subscribed
// browsers. Run after fetch-news.mjs in CI, alongside notify-digest.mjs.
//
// Picks the hero the same way src/lib/news.ts's getTopStories does — the
// first article with an image, since data/news.json's articles are already
// sorted newest-first by fetch-news.mjs. notify-push itself dedupes against
// articles it has already pushed, so a persisting hero across cycles is a
// silent no-op rather than a repeat push.
//
// Required env: SUPABASE_URL, NOTIFY_SECRET. Missing/blank vars are treated
// as "not configured yet" and the script exits quietly (0) so the deploy
// isn't blocked before push notifications are set up.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NEWS_FILE = join(ROOT, "data", "news.json");

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const notifySecret = process.env.NOTIFY_SECRET;

  if (!supabaseUrl || !notifySecret) {
    console.log("notify-push: SUPABASE_URL/NOTIFY_SECRET not set — skipping (feature not configured yet).");
    return;
  }

  const { articles } = JSON.parse(readFileSync(NEWS_FILE, "utf8"));
  const hero = articles.find((a) => a.image);

  if (!hero) {
    console.log("notify-push: no article with an image to use as the hero — nothing to push.");
    return;
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/notify-push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-notify-secret": notifySecret },
    body: JSON.stringify({
      article: {
        link: hero.link,
        title: hero.title,
        description: hero.description,
        image: hero.image,
      },
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    // Non-fatal: don't fail the whole deploy just because push sending had a
    // problem. Logged loudly so it's visible in the Action run.
    console.error(`notify-push: notify-push function returned ${res.status}: ${body}`);
    return;
  }
  console.log(`notify-push: ${body}`);
}

main().catch((err) => {
  console.error("notify-push: unexpected error (non-fatal):", err);
});
