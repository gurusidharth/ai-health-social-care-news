import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

// Browser-facing (CORS + anon key), like `subscribe`.
// POST   { endpoint, keys: { p256dh, auth } }  -> store/refresh a subscription
// DELETE { endpoint }                           -> remove it (notifications turned off)

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const supabase = supabaseAdmin();

  if (req.method === "POST") {
    let endpoint: unknown;
    let p256dh: unknown;
    let auth: unknown;
    try {
      const body = await req.json();
      endpoint = typeof body?.endpoint === "string" ? body.endpoint : undefined;
      p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : undefined;
      auth = typeof body?.keys?.auth === "string" ? body.keys.auth : undefined;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    if (!endpoint || !p256dh || !auth) {
      return jsonResponse({ error: "endpoint and keys.p256dh/keys.auth are required" }, 400);
    }

    try {
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({ endpoint, p256dh, auth }, { onConflict: "endpoint" });
      if (error) throw error;
      return jsonResponse({ ok: true });
    } catch (err) {
      console.error("push-subscribe POST error:", err);
      return jsonResponse({ error: "Something went wrong" }, 500);
    }
  }

  if (req.method === "DELETE") {
    let endpoint: unknown;
    try {
      const body = await req.json();
      endpoint = typeof body?.endpoint === "string" ? body.endpoint : undefined;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    if (!endpoint) return jsonResponse({ error: "endpoint is required" }, 400);

    try {
      const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      if (error) throw error;
      return jsonResponse({ ok: true });
    } catch (err) {
      console.error("push-subscribe DELETE error:", err);
      return jsonResponse({ error: "Something went wrong" }, 500);
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});
