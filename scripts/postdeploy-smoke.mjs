#!/usr/bin/env node
/**
 * فحص ما بعد النشر — production smoke لـ Ssunnah.com
 *
 * Usage:
 *   node scripts/postdeploy-smoke.mjs
 *   SMOKE_BASE=https://www.ssunnah.com node scripts/postdeploy-smoke.mjs
 */
import {
  PRODUCTION_BASE,
  APEX_BASE,
  ensureReportsDir,
  writeJsonReport,
  fetchHttp,
  isFullCommitHash,
  parseSitemapLocs,
  scanTextForForbiddenBrand,
  FORBIDDEN_PUBLIC_BRAND,
  SENSITIVE_SITEMAP_PREFIXES,
  shortSha,
} from "./release-guard-lib.mjs";

const BASE = PRODUCTION_BASE;
const failures = [];
const warnings = [];
const checks = [];

function fail(msg) {
  failures.push(msg);
  checks.push({ name: msg, ok: false });
}

function warn(msg) {
  warnings.push(msg);
  checks.push({ name: msg, ok: true, warn: true });
}

function pass(msg) {
  checks.push({ name: msg, ok: true });
}

async function expect200(path, opts = {}) {
  const r = await fetchHttp(BASE, path, opts);
  if (r.status !== 200) {
    fail(`${path} → HTTP ${r.status}`);
    return null;
  }
  pass(`${path} → 200`);
  return r;
}

console.log(`▶ postdeploy-smoke — ${BASE}\n`);

// ── 1) الصفحة الرئيسية + apex ─────────────────────────────────────────────
const home = await expect200("/");
if (home) {
  for (const re of FORBIDDEN_PUBLIC_BRAND) {
    if (re.test(home.text)) fail(`الرئيسية: اسم تجاري قديم (${re})`);
  }
  if (home.text.includes("/src/main.tsx")) fail("الرئيسية: Vite dev غير مُجمَّع");
}

const apex = await fetchHttp(APEX_BASE, "/", { redirect: "manual" }).catch((err) => ({
  status: 0,
  headers: new Headers(),
  text: "",
  url: APEX_BASE,
  ok: false,
  error: String(err?.cause?.code || err?.message || err),
}));
if (apex.error) {
  warn(`ssunnah.com apex: تعذّر الاتصال (${apex.error}) — راجع docs/domain-checklist.md`);
} else if (apex.status === 200) {
  pass("ssunnah.com apex → 200");
} else if ([301, 302, 307, 308].includes(apex.status)) {
  const loc = apex.headers.get("location") || "";
  if (loc.includes("www.ssunnah.com")) pass(`ssunnah.com → redirect ${apex.status} إلى www`);
  else fail(`ssunnah.com redirect غير متوقع: ${loc}`);
} else if (apex.status === 502 || apex.status === 503) {
  fail(`ssunnah.com apex → HTTP ${apex.status} — راجع docs/domain-checklist.md`);
} else {
  fail(`ssunnah.com apex → HTTP ${apex.status}`);
}

// ── 2) صفحات أساسية ───────────────────────────────────────────────────────
for (const path of ["/mushaf", "/lessons", "/hadith", "/prayer-times"]) {
  await expect200(path);
}

// ── 3) health endpoints ───────────────────────────────────────────────────
const healthz = await fetchHttp(BASE, "/api/healthz");
if (healthz.status !== 200) {
  fail(`/api/healthz → HTTP ${healthz.status}`);
} else {
  try {
    const j = JSON.parse(healthz.text);
    if (j.ok !== true) fail("/api/healthz: ok !== true");
    if (scanTextForForbiddenBrand(healthz.text).length) fail("/api/healthz: اسم قديم");
    if (j.commit || j.uptime || j.env) fail("/api/healthz: يسرب تفاصيل داخلية");
    else pass("/api/healthz ok");
  } catch {
    fail("/api/healthz: JSON غير صالح");
  }
}

const readyz = await fetchHttp(BASE, "/api/readyz");
if (readyz.status !== 200 && readyz.status !== 503) {
  fail(`/api/readyz → HTTP ${readyz.status}`);
} else {
  try {
    const j = JSON.parse(readyz.text);
    const blob = JSON.stringify(j);
    if (/postgres(ql)?:\/\/|SUPABASE|DATABASE_URL|password|secret/i.test(blob)) {
      fail("/api/readyz: يسرب أسرار");
    }
    if (isFullCommitHash(j.commit)) fail("/api/readyz: يسرب commit كامل");
    if (scanTextForForbiddenBrand(blob).length) fail("/api/readyz: اسم قديم");
    else pass(`/api/readyz → ${readyz.status}`);
  } catch {
    fail("/api/readyz: JSON غير صالح");
  }
}

// ── 4) SEO / PWA assets ─────────────────────────────────────────────────────
const robots = await expect200("/robots.txt");
if (robots && !/Sitemap:\s*https:\/\/www\.ssunnah\.com\/sitemap\.xml/i.test(robots.text)) {
  fail("robots.txt: بلا Sitemap رسمي");
}

const sitemap = await expect200("/sitemap.xml");
if (sitemap) {
  const locs = parseSitemapLocs(sitemap.text);
  if (!locs.length) fail("sitemap.xml: فارغ");
  for (const loc of locs) {
    for (const pre of SENSITIVE_SITEMAP_PREFIXES) {
      if (loc === pre || loc.startsWith(`${pre}/`)) fail(`sitemap: مسار حساس ${loc}`);
    }
    if (/content-review|internal\/review/i.test(loc)) fail(`sitemap: مراجعة داخلية ${loc}`);
  }
  if (!sitemap.text.includes("https://www.ssunnah.com")) warn("sitemap: تحقق من canonical host");
  else pass(`sitemap.xml — ${locs.length} رابط`);
}

let manifestRes = await fetchHttp(BASE, "/manifest.webmanifest");
if (manifestRes.status !== 200) manifestRes = await fetchHttp(BASE, "/site.webmanifest");
if (manifestRes.status !== 200) {
  fail("manifest → غير متاح");
} else {
  try {
    const m = JSON.parse(manifestRes.text);
    if (m.name !== "سُنّة" && m.name !== "سنّة") fail(`manifest name=${m.name}`);
    else pass("manifest → 200");
  } catch {
    fail("manifest: JSON غير صالح");
  }
}

const sw = await expect200("/sw.js");
if (sw) {
  if (!/ssunnah-v\$\{SW_BUILD_ID\}/.test(sw.text)) warn("sw.js: تحقق من بادئة الكاش");
  if (scanTextForForbiddenBrand(sw.text, { allowLegacyCache: true }).length) {
    fail("sw.js: اسم قديم خارج سياق التنظيف");
  }
  const cc = sw.headers.get("cache-control") || "";
  if (!/no-cache|no-store|must-revalidate/i.test(cc)) {
    warn(`sw.js Cache-Control: ${cc || "(فارغ)"} — يُفضّل no-cache`);
  }
}

// ── 5) /search — 200 + noindex ──────────────────────────────────────────────
const search = await fetchHttp(BASE, "/search");
if (search.status !== 200) {
  fail(`/search → HTTP ${search.status}`);
} else {
  const robotsHdr = (search.headers.get("x-robots-tag") || "").toLowerCase();
  const metaRobots = search.text.match(/name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1] || "";
  if (!robotsHdr.includes("noindex") && !metaRobots.toLowerCase().includes("noindex")) {
    warn("/search: لا يبدو noindex — تحقق من seo-routes أو headers");
  } else pass("/search → 200 noindex");
}

// ── 6) version.json — short commit فقط ─────────────────────────────────────
const version = await fetchHttp(BASE, "/version.json");
if (version.status !== 200) {
  fail(`/version.json → HTTP ${version.status}`);
} else {
  try {
    const j = JSON.parse(version.text);
    if (!j.shortCommit) fail("version.json: shortCommit مفقود");
    if (isFullCommitHash(j.commit)) fail("version.json: يسرب commit كامل للعامة");
    else pass(`version.json → ${j.shortCommit || "?"}`);
  } catch {
    fail("version.json: JSON غير صالح");
  }
}

// ── 7) Security headers (عينة) ──────────────────────────────────────────────
if (home) {
  const hsts = home.headers.get("strict-transport-security");
  if (!hsts) warn("الرئيسية: بلا Strict-Transport-Security");
  const xcto = home.headers.get("x-content-type-options");
  if (xcto !== "nosniff") warn(`الرئيسية: X-Content-Type-Options=${xcto || "—"}`);
  else pass("security headers (عينة)");
}

// ── نتيجة ───────────────────────────────────────────────────────────────────
const ok = failures.length === 0;
const result = {
  at: new Date().toISOString(),
  base: BASE,
  localShortSha: shortSha(),
  ok,
  failures,
  warnings,
  checks,
  blockRelease: !ok,
};

ensureReportsDir();
writeJsonReport(".release-postdeploy.json", result);

console.log(`\n📊 postdeploy-smoke`);
console.log(`   فشل: ${failures.length}`);
console.log(`   تحذيرات: ${warnings.length}`);

if (!ok) {
  console.error("\n⛔ BLOCK_RELEASE — لا تعتمد هذا الإصدار:");
  console.error("   فشل healthz أو homepage أو sitemap أو صفحة أساسية.");
  console.error("   راجع docs/rollback.md قبل أي إجراء يدوي.\n");
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

if (warnings.length) {
  console.warn("\n⚠️  تحذيرات (لا تمنع الإصدار):");
  for (const w of warnings) console.warn(`   • ${w}`);
}

console.log("\n✅ postdeploy-smoke — PASS\n");
