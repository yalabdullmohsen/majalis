#!/usr/bin/env node
/**
 * Smoke-test production URLs after deploy.
 * Usage: node scripts/verify-production-urls.mjs [--base=https://majlisilm.com]
 */

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "https://majlisilm.com";

const pages = [
  "/",
  "/lessons",
  "/sheikhs",
  "/library",
  "/qa",
  "/quran",
  "/quran-live",
  "/quran-radio",
  "/prayer-times",
  "/calendar",
  "/tasbih",
  "/prayer-ranks",
  "/about",
  "/contact",
  "/search",
  "/admin",
  "/login",
  "/register",
  "/sitemap.xml",
  "/robots.txt",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/site.webmanifest",
  "/assistant",
  "/question-answer",
  "/about-platform",
];
  "/api/healthz",
  "/api/knowledge-search?q=صلاة",
  "/api/daily-content",
  "/api/prayer-times?city=Kuwait",
];

let failed = 0;

async function check(path, expectJson = false) {
  const url = new URL(path, base).toString();
  const res = await fetch(url, { redirect: "follow" });
  const ok = res.status === 200;
  if (!ok) {
    console.error(`✗ ${path} → HTTP ${res.status}`);
    failed++;
    return;
  }
  if (path === "/") {
    const html = await res.text();
    if (html.includes("/src/main.tsx")) {
      console.error(`✗ ${path} → serves OLD unbundled Vite (main.tsx)`);
      failed++;
      return;
    }
    if (!html.includes("/assets/index")) {
      console.error(`✗ ${path} → missing Vite bundle (/assets/index)`);
      failed++;
      return;
    }
    const match = html.match(/\/assets\/index-[^"]+/);
    console.log(`✓ ${path} → HTTP 200 (bundle: ${match?.[0] || "?"})`);
    return;
  }
  if (expectJson) {
    try {
      await res.json();
    } catch {
      console.error(`✗ ${path} → invalid JSON`);
      failed++;
      return;
    }
  }
  console.log(`✓ ${path} → HTTP ${res.status}`);
}

console.log(`Production URL verification — ${base}\n`);

for (const path of pages) {
  await check(path);
}

for (const path of apis) {
  await check(path, true);
}

console.log("");
if (failed) {
  console.error(`FAILED: ${failed} check(s)`);
  process.exit(1);
}
console.log("All production URL checks passed.");
