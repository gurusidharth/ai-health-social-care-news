import { jsonResponse } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { sendEmail } from "../_shared/mailer.ts";
import { digestEmail, type DigestArticle } from "../_shared/templates.ts";

// Server-to-server only (called from the GitHub Actions workflow after each
// news fetch) — authenticated with a shared secret instead of CORS/anon key.
const MAX_ARTICLES_PER_DIGEST = 30;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const expectedSecret = Deno.env.get("NOTIFY_SECRET");
  const providedSecret = req.headers.get("x-notify-secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let articles: DigestArticle[];
  try {
    const body = await req.json();
    articles = Array.isArray(body?.articles) ? body.articles : [];
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  // De-dupe the incoming batch by link, keep only well-formed entries.
  const byLink = new Map<string, DigestArticle>();
  for (const a of articles) {
    if (a && typeof a.link === "string" && typeof a.title === "string") byLink.set(a.link, a);
  }
  const candidates = [...byLink.values()];

  if (candidates.length === 0) {
    return jsonResponse({ sent: 0, subscribers: 0, newArticles: 0 });
  }

  const supabase = supabaseAdmin();

  try {
    // Find which of these links have already been emailed out.
    const { data: alreadySent, error: sentError } = await supabase
      .from("sent_articles")
      .select("link")
      .in(
        "link",
        candidates.map((a) => a.link)
      );
    if (sentError) throw sentError;

    const sentLinks = new Set((alreadySent ?? []).map((r) => r.link));
    const sortedCandidates = [...candidates].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    const newArticles = sortedCandidates.filter((a) => !sentLinks.has(a.link));

    // Record every candidate as sent regardless of whether anyone was
    // emailed, so late-joining subscribers get a fresh welcome email instead
    // of a backlog, and this run stays idempotent if retried.
    const { error: insertError } = await supabase
      .from("sent_articles")
      .upsert(
        candidates.map((a) => ({ link: a.link })),
        { onConflict: "link", ignoreDuplicates: true }
      );
    if (insertError) throw insertError;

    // Always send a digest every run (every 6h) — if nothing new has come in
    // since the last run, fall back to the latest articles anyway (even ones
    // already sent before) instead of skipping, per product decision to
    // guarantee an email every cycle rather than only on genuinely new news.
    const articlesToSend = (newArticles.length > 0 ? newArticles : sortedCandidates).slice(
      0,
      MAX_ARTICLES_PER_DIGEST
    );

    if (articlesToSend.length === 0) {
      return jsonResponse({ sent: 0, subscribers: 0, newArticles: newArticles.length });
    }

    const { data: subscribers, error: subsError } = await supabase
      .from("subscribers")
      .select("email, unsubscribe_token");
    if (subsError) throw subsError;

    if (!subscribers || subscribers.length === 0) {
      return jsonResponse({ sent: 0, subscribers: 0, newArticles: newArticles.length });
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://oneaicare.com";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    let sent = 0;
    for (const subscriber of subscribers) {
      // Link straight at the Edge Function so clicking it unsubscribes and
      // shows a confirmation — works even if the static site isn't deployed.
      const unsubscribeUrl = `${supabaseUrl}/functions/v1/unsubscribe?token=${subscriber.unsubscribe_token}`;
      const { subject, html, text } = digestEmail(siteUrl, unsubscribeUrl, articlesToSend);
      try {
        await sendEmail({ to: subscriber.email, subject, html, text });
        sent++;
      } catch (err) {
        // One bad/bounced address shouldn't stop the rest of the digest run.
        console.error(`Failed to email ${subscriber.email}:`, err);
      }
    }

    return jsonResponse({ sent, subscribers: subscribers.length, newArticles: newArticles.length });
  } catch (err) {
    console.error("notify error:", err);
    return jsonResponse({ error: "Something went wrong sending the digest" }, 500);
  }
});
