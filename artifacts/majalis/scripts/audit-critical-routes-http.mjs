#!/usr/bin/env node
/**
 * زحف HTTP مركّز للمسارات الحرجة + عيّنة من sitemap (بلا Playwright).
 * MAJLIS_AUDIT_BASE_URL=https://majlisilm.com node scripts/audit-critical-routes-http.mjs
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "../..");
const baseUrl = (process.env.MAJLIS_AUDIT_BASE_URL || "https://majlisilm.com").replace(/\/$/, "");

const CRITICAL = [
  "/",
  "/library",
  "/quiz",
  "/qa",
  "/rulings",
  "/fiqh-council",
  "/fiqh-council/items-cultured-meat",
  "/fiqh-council/items-encrypted-digital-currencies",
  "/universities",
  "/universities/compare",
  "/quran-hub",
  "/quran/recitation-test-ai",
  "/contact",
  "/privacy",
  "/account-deletion",
  "/library/book-razi-tafsir",
];

function loadSitemapSample(limit = 80) {
  const p = resolve(appRoot, "public/sitemap.xml");
  if (!existsSync(p)) return [];
  const xml = readFileSync(p, "utf8");
  const paths = [];
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const u = new URL(m[1].trim());
      paths.push(u.pathname);
    } catch {
      /* ignore */
    }
    if (paths.length >= limit) break;
  }
  return paths;
}

async function probe(path) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(25000),
      headers: { "User-Agent": "MajlisilmRouteAudit/1.0" },
    });
    let finalUrl = `${baseUrl}${path}`;
    let redirects = 0;
    let status = res.status;
    let html = "";
    if ([301, 302, 307, 308].includes(status)) {
      redirects = 1;
      const loc = res.headers.get("location");
      if (loc) {
        const abs = loc.startsWith("http") ? loc : `${baseUrl}${loc}`;
        const res2 = await fetch(abs, { redirect: "follow", signal: AbortSignal.timeout(25000) });
        status = res2.status;
        finalUrl = res2.url;
        html = await res2.text();
        redirects += 1;
      }
    } else if (status === 200) {
      html = await res.text();
    }
    const title = (html.match(/<title>([^<]*)<\/title>/i) || [,""])[1].trim();
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].length;
    const canonical = (html.match(/rel=["']canonical["'][^>]*href=["']([^"']+)/i) || [,""])[1];
    const desc = (html.match(/name=["']description["'][^>]*content=["']([^"']*)/i) || [,""])[1];
    const lang = (html.match(/<html[^>]*lang=["']([^"']+)/i) || [,""])[1];
    const dir = (html.match(/<html[^>]*dir=["']([^"']+)/i) || [,""])[1];
    const thin = status === 200 && html.replace(/<[^>]+>/g, " ").trim().length < 200;
    const homepageFallback =
      path !== "/" &&
      status === 200 &&
      /مجلس علمي|سُنّة/.test(title) &&
      h1s === 1 &&
      /الصفحة الرئيسية|مرحبا/.test(html.slice(0, 2500));
    const sourcePlaceholder = /المصدر قيد الإضافة/.test(html);
    const pendingLeak = /pending_review/.test(html);
    return {
      path,
      status,
      finalUrl,
      redirects,
      title,
      h1Count: h1s,
      canonical,
      description: desc.slice(0, 160),
      lang,
      dir,
      contentLength: html.length,
      thin,
      homepageFallback,
      sourcePlaceholder,
      pendingLeak,
      ms: Date.now() - t0,
    };
  } catch (e) {
    return { path, status: -1, error: String(e).slice(0, 120), ms: Date.now() - t0 };
  }
}

const routes = [...new Set([...CRITICAL, ...loadSitemapSample(100)])];
const results = [];
for (let i = 0; i < routes.length; i += 6) {
  const batch = routes.slice(i, i + 6);
  results.push(...(await Promise.all(batch.map(probe))));
}

const summary = {
  baseUrl,
  routesScanned: results.length,
  "2xx": results.filter((r) => r.status >= 200 && r.status < 300).length,
  redirects: results.filter((r) => (r.redirects || 0) > 0).length,
  "404": results.filter((r) => r.status === 404).length,
  "410": results.filter((r) => r.status === 410).length,
  "5xx": results.filter((r) => r.status >= 500).length,
  networkErrors: results.filter((r) => r.status === -1).length,
  thinPages: results.filter((r) => r.thin).length,
  homepageFallbackPages: results.filter((r) => r.homepageFallback).length,
  sourcePlaceholderLeaks: results.filter((r) => r.sourcePlaceholder).length,
  pendingReviewLeaks: results.filter((r) => r.pendingLeak).length,
  missingLangAr: results.filter((r) => r.status === 200 && r.lang && r.lang !== "ar").length,
  missingDirRtl: results.filter((r) => r.status === 200 && r.dir && r.dir !== "rtl").length,
};

const failures = [];
for (const r of results) {
  if (CRITICAL.includes(r.path) && r.path === "/qa" && !(r.redirects > 0 || (r.finalUrl || "").includes("/quiz"))) {
    failures.push("/qa did not redirect toward /quiz");
  }
  if (r.path === "/rulings" && r.status === 200 && !/الفقه/.test(r.title || "")) {
    failures.push("/rulings did not redirect to fiqh hub");
  }
  if (r.path === "/rulings" && [301, 302, 307, 308].includes(r.status)) {
    /* expected redirect */
  }
  if (r.sourcePlaceholder) failures.push(`${r.path}: المصدر قيد الإضافة`);
  if (r.pendingLeak) failures.push(`${r.path}: pending_review leak`);
  if (r.homepageFallback) failures.push(`${r.path}: homepage fallback`);
}

const rulings = results.find((r) => r.path === "/rulings");
if (rulings) {
  const redirected =
    (rulings.redirects || 0) > 0 ||
    [301, 302, 307, 308].includes(rulings.status) ||
    (rulings.finalUrl || "").includes("/fiqh");
  if (!redirected && rulings.status === 200) {
    const html = await (await fetch(`${baseUrl}/rulings`)).text();
    if (!/الفقه|fiqh/i.test(html)) {
      failures.push("/rulings did not redirect to fiqh");
    }
  }
}

const contact = await (await fetch(`${baseUrl}/contact`)).text();
if (!/mailto:Majlisilm\.app@gmail\.com/i.test(contact)) {
  failures.push("/contact missing official mailto");
}

const outDir = resolve(repoRoot, "reports");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "critical-routes-http-audit.json");
writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), summary, failures, results }, null, 2));

if (failures.length) {
  console.error(JSON.stringify({ ok: false, summary, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, summary, report: outPath }, null, 2));
