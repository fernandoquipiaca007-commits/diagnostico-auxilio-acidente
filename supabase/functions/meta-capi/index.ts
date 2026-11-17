// API de Conversões da Meta — recebe eventos do quiz e envia do servidor.
// Segredos: META_PIXEL_ID, META_CAPI_TOKEN
const PIXEL = Deno.env.get("META_PIXEL_ID")!;
const TOKEN = Deno.env.get("META_CAPI_TOKEN")!;
const ALLOWED = [/^https:\/\/auxilio\.codeengine1\.com$/, /^https?:\/\/fernandoquipiaca007-commits\.github\.io$/,
  /^https:\/\/diagnostico-auxilio-acidente.*\.vercel\.app$/, /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/,
  /^http:\/\/auxilio\.codeengine1\.com$/];
const EVENTS = new Set(["CompleteRegistration", "Contact", "Lead"]);

const cors = (o: string) => ({
  "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization", "Vary": "Origin",
});

async function sha(v?: string) {
  if (!v) return undefined;
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v.trim().toLowerCase()));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z]/g, "").toLowerCase();

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const ok = ALLOWED.some((r) => r.test(origin));
  const h = { ...cors(ok ? origin : "null"), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { headers: h });
  if (!ok || req.method !== "POST") return new Response('{"error":"forbidden"}', { status: 403, headers: h });

  let b: Record<string, string>;
  try { b = await req.json(); } catch { return new Response('{"error":"json"}', { status: 400, headers: h }); }
  if (!EVENTS.has(b.event_name) || !b.event_id || String(b.event_id).length > 80)
    return new Response('{"error":"bad event"}', { status: 400, headers: h });

  const tel = String(b.tel ?? "").replace(/\D/g, "");
  const parts = String(b.nome ?? "").trim().split(/\s+/);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || undefined;

  const user_data: Record<string, unknown> = {
    client_user_agent: req.headers.get("user-agent") ?? undefined,
    client_ip_address: ip,
    fbp: b.fbp || undefined,
    fbc: b.fbc || undefined,
    ph: tel.length >= 10 ? [await sha(tel.startsWith("55") ? tel : "55" + tel)] : undefined,
    fn: parts[0] ? [await sha(norm(parts[0]))] : undefined,
    ln: parts.length > 1 ? [await sha(norm(parts[parts.length - 1]))] : undefined,
    country: [await sha("br")],
    external_id: [await sha(String(b.event_id).split(":")[0])],
  };

  const event = {
    event_name: b.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: b.event_id,
    event_source_url: String(b.url ?? "").slice(0, 500) || undefined,
    action_source: "website",
    user_data,
    custom_data: { content_name: "auxilio-acidente", status: b.nivel || undefined },
  };

  const payload: Record<string, unknown> = { data: [event] };
  if (b.test_event_code) payload.test_event_code = String(b.test_event_code).slice(0, 40);

  const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL}/events?access_token=${TOKEN}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  const out = await r.json();
  if (!r.ok) console.error("capi error", JSON.stringify(out));
  return new Response(JSON.stringify({ ok: r.ok, events_received: out.events_received ?? 0 }), { status: r.ok ? 200 : 502, headers: h });
});
