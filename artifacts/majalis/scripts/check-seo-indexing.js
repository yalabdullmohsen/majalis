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
if (existsSync(routesPath)) {
  const { routes } = JSON.parse(readFileSync(routesPath, "utf8"));
  for (const r of routes) {
    const p = String(r.path || "").replace(/\/$/, "") || "/";
    if (r.sitemap && (r.robots || "").includes("noindex")) {
      failures.push(`seo-routes: ${p} sitemap=true مع noindex`);
    }
    if (r.sitemap && isSitemapDenied(p)) {
      failures.push(`seo-routes: ${p} sitemap=true رغم سياسة المنع`);
    }
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
