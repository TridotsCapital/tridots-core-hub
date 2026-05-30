// supabase/functions/_shared/cors.ts
// Substitui o pattern de hard-coded `Access-Control-Allow-Origin: "*"`
// presente em todas as 37 edge functions.
//
// Uso:
//   import { corsHeaders } from "../_shared/cors.ts";
//   ...
//   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
//   return new Response(JSON.stringify(data), { headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
//
// Origens permitidas vêm de env var ALLOWED_ORIGINS (CSV) ou fallback hard-coded.

const ENV_ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const DEFAULT_ALLOWED = new Set<string>([
  "https://app.garantfacil.com.br",
  "https://garantfacil.com.br",
  "https://staging.garantfacil.com.br",
  "https://staging-app.garantfacil.com.br",
  // Adicionar previews do Lovable (durante Onda 1):
  ...((Deno.env.get("LOVABLE_PREVIEW_HOST") ?? "").split(",").map((s) => s.trim()).filter(Boolean)),
  // Dev local:
  ...(Deno.env.get("DENO_ENV") === "development" ? ["http://localhost:5173", "http://localhost:3000"] : []),
]);

const ALLOWED = new Set<string>([...DEFAULT_ALLOWED, ...ENV_ALLOWED]);

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED.has(origin) ? origin : "https://app.garantfacil.com.br";

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function corsPreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  return null;
}
