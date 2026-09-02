#!/usr/bin/env node
/**
 * يفشل إذا sitemap.xml يحتوي مسارات noindex أو أدوات داخلية.
 * تشغيل: node scripts/check-seo-indexing.js
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isSitemapDenied, SITEMAP_DENY_PATHS } from "./seo-index-policy.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const LEGACY_DESC_RE =
  /ضمن منصة|محتوى شرعي موثّ?ق|تصفّح الأقسام المرتبطة في|اطّلع على التفاصيل والمصادر في/u;

const SECTION_OG = {
  "/": "/brand/og-home.png",
  "/quran-hub": "/brand/og-quran.png",
  "/mushaf": "/brand/og-quran.png",
  "/lessons": "/brand/og-lessons.png",
  "/fiqh": "/brand/og-fiqh.png",
  "/hadith": "/brand/og-hadith.png",
  "/adhkar": "/brand/og-adhkar.png",
  "/library": "/brand/og-library.png",
  "/contact": "/brand/og-contact.png",
};

function stripBoilerplate(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*[—–-]\s*صفحة .* ضمن منصة .*$/u, "")
    .replace(/\s*[—–-]\s*محتوى شرعي موثّ?ق.*$/u, "")
    .replace(/\s*تصفّح الأقسام المرتبطة في .*\.?$/u, "")
    .trim();
}

const sitemapPath = resolve(root, "public/sitemap.xml");
if (!existsSync(sitemapPath)) {
  console.error("❌ public/sitemap.xml مفقود — شغّل generate:seo أولًا");
  process.exit(1);
}

const sitemap = readFileSync(sitemapPath, "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
  try {
    return new URL(m[1]).pathname.replace(/\/$/, "") || "/";
  } catch {
    return m[1];
  }
});

const forbiddenPatterns = [
  /login/i,
  /register/i,
  /profile/i,
  /settings/i,
  /\/search/i,
  /assistant/i,
  /\/api/i,
  /admin/i,
  /dashboard/i,
  /fiqh-council\/live/i,
  /fiqh-council\/stats/i,
  /fiqh-council\/compare/i,
  /fiqh-council\/recommendations/i,
  /knowledge-graph/i,
];

for (const loc of locs) {
  if (isSitemapDenied(loc)) {
    failures.push(`sitemap: مسار ممنوع ${loc}`);
    continue;
  }
  for (const re of forbiddenPatterns) {
    if (re.test(loc)) {
      failures.push(`sitemap: نمط ممنوع ${loc} (${re})`);
    }
  }
}

const routesPath = resolve(root, "src/lib/seo-routes.json");
const noindexPaths = new Set();
if (existsSync(routesPath)) {
  const { routes } = JSON.parse(readFileSync(routesPath, "utf8"));
  for (const r of routes) {
    const p = String(r.path || "").replace(/\/$/, "") || "/";
    const robots = String(r.robots || "");
    if (robots.includes("noindex")) noindexPaths.add(p);

    if (r.sitemap && robots.includes("noindex")) {
      failures.push(`seo-routes: ${p} sitemap=true مع noindex`);
    }
    if (r.sitemap && isSitemapDenied(p)) {
      failures.push(`seo-routes: ${p} sitemap=true رغم سياسة المنع`);
    }

    const indexed = r.sitemap !== false && !robots.includes("noindex") && !isSitemapDenied(p);
    if (indexed && r.description) {
      const desc = String(r.description);
      if (LEGACY_DESC_RE.test(desc)) {
        failures.push(`seo-routes: ${p} وصف يحتوي خاتمة SEO قديمة`);
      }
      const clean = stripBoilerplate(desc);
      if (clean.length < 40) {
        failures.push(`seo-routes: ${p} وصف قصير جدًا (${clean.length} حرف)`);
      }
      if (clean.length > 165) {
        failures.push(`seo-routes: ${p} وصف طويل (${clean.length} حرف)`);
      }
    }

    const expectedOg = SECTION_OG[p];
    if (expectedOg && indexed && r.image && !String(r.image).includes(expectedOg.replace("/brand/", ""))) {
      failures.push(`seo-routes: ${p} og:image غير متوافق (${r.image})`);
    }
  }
}

for (const loc of locs) {
  if (noindexPaths.has(loc)) {
    failures.push(`sitemap: ${loc} مُعلَّم noindex في seo-routes`);
  }
}

for (const p of SITEMAP_DENY_PATHS) {
  if (locs.includes(p)) failures.push(`sitemap: ${p} لا يجب أن يظهر`);
}

if (failures.length) {
  console.error("❌ check-seo-indexing فشل:");
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log(`✓ check-seo-indexing: ${locs.length} URL — بلا login/assistant/dashboard/noindex`);
