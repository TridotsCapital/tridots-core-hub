// supabase/functions/resolve-short-url/index.ts
//
// Edge function pública para resolver slugs curtos em URLs longas.
// Necessária para migração GarantFacil → Tridots: preserva links de aceite
// em circulação (formato legado: garantfacil.com.br/link/{uuid}).
//
// Endpoint:
//   GET /functions/v1/resolve-short-url?slug=<slug>
//   GET /functions/v1/resolve-short-url/{slug}
//
// Comportamento:
//   - slug encontrado, não-expirado:  302 Location: <target_url>
//   - slug encontrado, expirado:       410 Gone
//   - slug não encontrado:             404 Not Found
//   - erro server-side:                500 Internal Server Error
//
// verify_jwt = false (público, igual ao behaviour do encurtador no legado).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_REDIRECT_PROTOCOLS = new Set(["https:", "http:"]);

function safeRedirectUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!ALLOWED_REDIRECT_PROTOCOLS.has(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function extractSlug(req: Request): string | null {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("slug");
  if (fromQuery) return fromQuery;
  // /functions/v1/resolve-short-url/<slug>
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "resolve-short-url");
  if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  return null;
}

serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const slug = extractSlug(req);
  if (!slug || slug.length > 256) {
    return new Response(JSON.stringify({ error: "Missing or invalid slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase
      .from("short_urls")
      .select("target_url, expires_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("[resolve-short-url] db error:", error.message);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: "Slug not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Link expired" }), {
        status: 410,
        headers: { "Content-Type": "application/json" },
      });
    }

    const target = safeRedirectUrl(data.target_url);
    if (!target) {
      console.error("[resolve-short-url] unsafe target_url for slug", slug);
      return new Response(JSON.stringify({ error: "Invalid target URL" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Increment click_count fire-and-forget (atomic via RPC)
    void supabase.rpc("increment_short_url_click", { p_slug: slug }).then(
      ({ error: rpcErr }) => {
        if (rpcErr) console.warn("[resolve-short-url] click_count update failed:", rpcErr.message);
      },
    );

    return new Response(null, {
      status: 302,
      headers: {
        Location: target,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("[resolve-short-url] uncaught:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
