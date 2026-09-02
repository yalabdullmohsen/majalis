import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../admin-auth.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");

const SEARCH_TERMS = ["الصلاة", "الحديث", "القرآن", "الأذكار", "الفقه"];

async function probe(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* ignore */
    }
    return { status: res.status, ok: res.ok, json, text: text.slice(0, 200) };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

function readAuditReport() {
  const p = resolve(ROOT, "reports/production-audit-latest.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

async function countRecentErrors() {
  const admin = getSupabaseAdmin();
  if (!admin) return { count: null, source: "unavailable" };
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  try {
    const { count, error } = await admin
      .from("client_error_logs")
      .select("*", { count: "exact", head: true })
      .gte("occurred_at", since);
    if (error) return { count: null, source: "error", detail: error.message };
    return { count: count ?? 0, source: "supabase" };
  } catch (err) {
    return { count: null, source: "error", detail: err.message };
  }
}

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const base =
    process.env.PRODUCTION_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "https://www.ssunnah.com";
  const origin = String(base).replace(/\/+$/, "");

  const [healthz, readyz, manifest, sitemap, searchChecks] = await Promise.all([
    probe(`${origin}/api/healthz`),
    probe(`${origin}/api/readyz`),
    probe(`${origin}/manifest.webmanifest`),
    probe(`${origin}/sitemap.xml`),
    Promise.all(
      SEARCH_TERMS.map(async (term) => {
        const r = await probe(`${origin}/api/search?q=${encodeURIComponent(term)}&limit=1`);
        const total = Number(r.json?.total ?? r.json?.count ?? 0);
        return { term, ok: total > 0, total, status: r.status };
      }),
    ),
  ]);

  let manifestOk = false;
  try {
    const m = JSON.parse(manifest.text || "{}");
    manifestOk = (m.name === "سُنّة" || m.name === "سنّة") && m.lang === "ar" && m.dir === "rtl";
  } catch {
    manifestOk = false;
  }

  const sitemapBad =
    (sitemap.text || "").includes("/assistant") ||
    (sitemap.text || "").includes("/search") ||
    (sitemap.text || "").includes("/internal");

  const errors24h = await countRecentErrors();
  const lastAudit = readAuditReport();

  let version = null;
  try {
    const v = await probe(`${origin}/version.json`);
    version = v.json;
  } catch {
    version = null;
  }

  const payload = {
    ok: healthz.ok && readyz.ok && manifestOk && !sitemapBad && searchChecks.every((s) => s.ok),
    at: new Date().toISOString(),
    productionUrl: origin,
    version,
    healthz: { status: healthz.status, ok: healthz.ok, body: healthz.json },
    readyz: { status: readyz.status, ok: readyz.ok, body: readyz.json },
    search: { ok: searchChecks.every((s) => s.ok), terms: searchChecks },
    sitemap: { status: sitemap.status, ok: sitemap.ok && !sitemapBad },
    pwa: { manifestOk, status: manifest.status },
    errors24h,
    lastProductionAudit: lastAudit,
  };

  return sendJson(res, payload.ok ? 200 : 503, payload);
}
