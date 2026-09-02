#!/usr/bin/env node
/**
 * فحص إنتاج موحد — روابط عامة، noindex، علامة تجارية، PWA، healthz.
 *
 * Usage:
 *   node scripts/production-audit.js
 *   node scripts/production-audit.js --url=https://www.ssunnah.com
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  ROOT,
  parseBaseUrl,
  FORBIDDEN_BRAND,
  BETA_MARKERS,
  WEAK_MARKERS,
  PUBLIC_PAGES,
  PRIVATE_NOINDEX_PAGES,
  STATIC_ASSETS,
  API_PATHS,
  stripHtml,
  hasNoindex,
  parseSitemapLocs,
  forbiddenSitemapPaths,
  fetchText,
  readText,
} from "./monitoring-utils.mjs";

const base = parseBaseUrl() || "https://www.ssunnah.com";
const failures = [];
const warnings = [];
const report = { base, at: new Date().toISOString(), checks: [] };

function record(name, ok, detail) {
  report.checks.push({ name, ok, detail });
  if (!ok) failures.push(`${name}: ${detail}`);
}

function warn(name, detail) {
  warnings.push(`${name}: ${detail}`);
  report.checks.push({ name, ok: true, warn: detail });
}

async function checkStatus200(path) {
  const { status } = await fetchText(base, path);
  record(`${path} → 200`, status === 200, `HTTP ${status}`);
}

async function checkPublicPage(path) {
  const { status, text } = await fetchText(base, path);
  if (status !== 200) {
    record(`${path} عام`, false, `HTTP ${status}`);
    return;
  }
  const body = stripHtml(text);
  for (const re of FORBIDDEN_BRAND) {
    if (re.test(text) || re.test(body)) {
      record(`${path} علامة`, false, `يحتوي ${re}`);
      return;
    }
  }
  for (const re of BETA_MARKERS) {
    if (re.test(body)) {
      record(`${path} تجريبي`, false, `يحتوي ${re}`);
      return;
    }
  }
  if (path === "/") {
    for (const re of WEAK_MARKERS) {
      if (re.test(body) && !/الضعيف\s*للتنبيه|بين\s*الدرجات/i.test(body)) {
        record(`${path} ضعيف`, false, `يحتوي ${re}`);
        return;
      }
    }
  }
  record(`${path} عام`, true, "OK");
}

async function checkPrivateNoindex(path) {
  const { status, text } = await fetchText(base, path);
  if (status === 404) {
    warn(`${path} noindex`, "404 — SPA غير مُpre-render (مقبول مؤقتًا)");
    record(`${path} noindex`, true, "404 SPA");
    return;
  }
  if (status !== 200 && status !== 401 && status !== 403) {
    record(`${path} noindex`, false, `HTTP ${status}`);
    return;
  }
  if (!hasNoindex(text)) {
    record(`${path} noindex`, false, "robots لا يحتوي noindex");
    return;
  }
  record(`${path} noindex`, true, "OK");
}

async function checkHealthz() {
  const { status, text } = await fetchText(base, "/api/healthz");
  if (status !== 200) {
    record("healthz", false, `HTTP ${status}`);
    return;
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    record("healthz", false, "JSON غير صالح");
    return;
  }
  const sensitive = /VERCEL_GIT_COMMIT_SHA|uptimeMs|DATABASE_URL|SECRET|password/i.test(text);
  if (sensitive) {
    record("healthz حساس", false, "يكشف معلومات داخلية");
    return;
  }
  record("healthz", json.ok === true, JSON.stringify(json).slice(0, 120));
}

async function checkManifest() {
  const { status, text } = await fetchText(base, "/manifest.webmanifest");
  if (status !== 200) {
    record("manifest", false, `HTTP ${status}`);
    return;
  }
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch {
    record("manifest", false, "JSON غير صالح");
    return;
  }
  const okName = manifest.name === "سُنّة" || manifest.name === "سنّة";
  record("manifest name", okName, manifest.name || "(فارغ)");
}

async function checkSw() {
  const { status, text } = await fetchText(base, "/sw.js");
  if (status !== 200) {
    record("sw.js", false, `HTTP ${status}`);
    return;
  }
  const cachesHtmlRoutes =
    /cache\.add\s*\(\s*["']\/["']\s*\)/.test(text) ||
    /cache\.add\s*\(\s*["']\/index\.html["']\s*\)/.test(text) ||
    /STATIC_SHELL_ASSETS[\s\S]*["']\/lessons["']/.test(text);
  record("sw.js HTML routes", !cachesHtmlRoutes, cachesHtmlRoutes ? "يخزّن مسارات HTML" : "OK");
  if (/majlisilm-v/.test(text) && !/LEGACY_CACHE/.test(text)) {
    record("sw.js majlisilm cache", false, "كاش جديد باسم majlisilm");
  } else {
    record("sw.js legacy purge", true, "OK");
  }
}

async function checkSitemap() {
  const { status, text } = await fetchText(base, "/sitemap.xml");
  if (status !== 200) {
    record("sitemap", false, `HTTP ${status}`);
    return;
  }
  const locs = parseSitemapLocs(text);
  const bad = forbiddenSitemapPaths(locs);
  record("sitemap ممنوع", bad.length === 0, bad.length ? bad.slice(0, 5).join(", ") : `${locs.length} URLs`);
}

console.log(`▶ production-audit — ${base}\n`);

for (const p of PUBLIC_PAGES) await checkPublicPage(p);
for (const p of PRIVATE_NOINDEX_PAGES) await checkPrivateNoindex(p);
for (const p of STATIC_ASSETS) {
  if (p === "/manifest.webmanifest") continue;
  if (p === "/sw.js") continue;
  await checkStatus200(p);
}
for (const p of API_PATHS) await checkStatus200(p);
await checkHealthz();
await checkManifest();
await checkSw();
await checkSitemap();

// فحص محلي للشريط (مصدر ثابت)
try {
  const ticker = readText("src/lib/ticker-content.ts");
  for (const re of WEAK_MARKERS) {
    if (re.test(ticker)) {
      record("ticker-content", false, `يحتوي ${re}`);
    }
  }
  if (!failures.some((f) => f.startsWith("ticker-content"))) {
    record("ticker-content", true, "OK");
  }
} catch (err) {
  warn("ticker-content", String(err.message || err));
}

report.ok = failures.length === 0;
report.failures = failures;
report.warnings = warnings;

const outDir = resolve(ROOT, "reports");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "production-audit-latest.json"), JSON.stringify(report, null, 2) + "\n");

if (failures.length) {
  console.error("❌ production-audit فشل:");
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log("✅ production-audit — نجح");
if (warnings.length) {
  for (const w of warnings) console.warn(`   ⚠ ${w}`);
}
