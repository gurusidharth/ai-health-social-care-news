import webpush from "npm:web-push@3";
import { jsonResponse } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

// Server-to-server only (called from scripts/notify-push.mjs in CI, after
// each news fetch) — authenticated with the same shared secret as `notify`.
// Sends at most one push, for the single hero article of this fetch cycle
// (picked by the caller) — dedup against `pushed_articles` (keyed by the
// article's stable `link`, not its `id`) means a persisting hero across
// cycles is a silent no-op rather than a repeat push.

type PushArticle = {
  link: string;
  title: string;
  description?: string;
  image?: string | null;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const expectedSecret = Deno.env.get("NOTIFY_SECRET");
  const providedSecret = req.headers.get("x-notify-secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT");
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return jsonResponse({ error: "VAPID keys not configured" }, 500);
  }

  let article: PushArticle | undefined;
  try {
    const body = await req.json();
    article = body?.article;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!article || typeof article.link !== "string" || typeof article.title !== "string") {
    return jsonResponse({ error: "A valid article (link, title) is required" }, 400);
  }

  const supabase = supabaseAdmin();

  try {
    const { data: already, error: alreadyError } = await supabase
      .from("pushed_articles")
      .select("link")
      .eq("link", article.link)
      .maybeSingle();
    if (alreadyError) throw alreadyError;

    if (already) {
      return jsonResponse({ sent: 0, subscribers: 0, reason: "already pushed this article" });
    }

    const { data: subscriptions, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth");
    if (subsError) throw subsError;

    // Record it as pushed regardless of subscriber count, so this stays
    // idempotent if the workflow retries.
    await supabase.from("pushed_articles").upsert({ link: article.link }, { onConflict: "link", ignoreDuplicates: true });

    if (!subscriptions || subscriptions.length === 0) {
      return jsonResponse({ sent: 0, subscribers: 0 });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const payload = JSON.stringify({
      title: article.title,
      body: article.description || "New story on OneAICare",
      url: article.link,
      icon: article.image || undefined,
    });

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone (browser unsubscribed / uninstalled) — clean it up.
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        } else {
          console.error(`Push failed for ${sub.endpoint}:`, err);
        }
      }
    }

    return jsonResponse({ sent, subscribers: subscriptions.length });
  } catch (err) {
    console.error("notify-push error:", err);
    return jsonResponse({ error: "Something went wrong sending the push" }, 500);
  }
});
