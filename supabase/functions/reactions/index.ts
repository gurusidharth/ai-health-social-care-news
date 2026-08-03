import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

// Browser-facing (CORS + anon key), like `subscribe`. Keyed by the article's
// `link` — not its `id`, which is regenerated on every 6h fetch build.
//
// GET  ?links=<link>&links=<link>...  -> { counts: { [link]: number } }
// POST { link, action: "react" | "unreact" }  -> { count }

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const supabase = supabaseAdmin();

  if (req.method === "GET") {
    const links = new URL(req.url).searchParams.getAll("links").filter(Boolean);
    if (links.length === 0) return jsonResponse({ counts: {} });

    try {
      const { data, error } = await supabase.from("reactions").select("link, count").in("link", links);
      if (error) throw error;

      const counts: Record<string, number> = Object.fromEntries(links.map((l) => [l, 0]));
      for (const row of data ?? []) counts[row.link] = row.count;
      return jsonResponse({ counts });
    } catch (err) {
      console.error("reactions GET error:", err);
      return jsonResponse({ error: "Something went wrong" }, 500);
    }
  }

  if (req.method === "POST") {
    let link: unknown;
    let action: unknown;
    try {
      const body = await req.json();
      link = typeof body?.link === "string" ? body.link : undefined;
      action = body?.action;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    if (typeof link !== "string" || !link || (action !== "react" && action !== "unreact")) {
      return jsonResponse({ error: "link and a valid action are required" }, 400);
    }

    try {
      const { data: existing, error: selectError } = await supabase
        .from("reactions")
        .select("count")
        .eq("link", link)
        .maybeSingle();
      if (selectError) throw selectError;

      const current = existing?.count ?? 0;
      const next = action === "react" ? current + 1 : Math.max(0, current - 1);

      const { error: upsertError } = await supabase
        .from("reactions")
        .upsert({ link, count: next, updated_at: new Date().toISOString() }, { onConflict: "link" });
      if (upsertError) throw upsertError;

      return jsonResponse({ count: next });
    } catch (err) {
      console.error("reactions POST error:", err);
      return jsonResponse({ error: "Something went wrong" }, 500);
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});
