#!/usr/bin/env node
/**
 * Production activation check for Instagram Phase 7.
 * Usage: BASE_URL=https://www.majlisilm.com node scripts/verify-instagram-production.mjs
 */
const BASE = process.env.BASE_URL || "https://majlisilm.com";

const routes = [
  "/admin/sources",
  "/admin/integrations/instagram",
  "/admin/automation/dashboard",
  "/admin/automation/center",
  "/api/healthz",
];

let failed = 0;

async function checkRoute(path) {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "follow" });
    const ok = res.status === 200;
    const text = await res.text();
    const is404 = text.includes("404") && text.includes("الصفحة غير موجودة");
    const isSpa = ok && !is404;
    if (!isSpa) {
      console.error(`✗ ${path} → HTTP ${res.status}${is404 ? " (404 page)" : ""}`);
      failed += 1;
    } else {
      console.log(`✓ ${path} → HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`✗ ${path} → ${err.message}`);
    failed += 1;
  }
}

console.log(`Instagram Phase 7 — Production route check (${BASE})\n`);

for (const path of routes) {
  await checkRoute(path);
}

const hasToken = Boolean(process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN);
const hasBiz = Boolean(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID);
console.log(`\nInstagram Graph API env (local): token=${hasToken} business=${hasBiz}`);

if (!hasToken || !hasBiz) {
  console.log("\n⚠ Add Meta secrets in Vercel Production → Settings → Environment Variables");
  console.log("  INSTAGRAM_GRAPH_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID, INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET");
}

console.log(failed ? `\n${failed} route check(s) failed` : "\nAll production routes reachable (SPA).");
process.exit(failed ? 1 : 0);
