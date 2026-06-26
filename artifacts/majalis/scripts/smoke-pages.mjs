#!/usr/bin/env node
/**
 * Smoke-test SPA routes return bundled HTML (no /src/main.tsx leak).
 * Usage: node scripts/smoke-pages.mjs [--base=http://127.0.0.1:4173]
 */
const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "http://127.0.0.1:4173";

const PAGES = [
  "/",
  "/lessons",
  "/quran",
  "/quran-live",
  "/quran/tajweed",
  "/quran/surah-stories",
  "/quran-radio",
  "/qa",
  "/library",
  "/assistant",
  "/settings",
  "/login",
  "/register",
  "/admin",
];

let failed = 0;

for (const path of PAGES) {
  const url = new URL(path, base).toString();
  try {
    const res = await fetch(url, { redirect: "follow" });
    const html = await res.text();
    if (res.status !== 200) {
      console.error(`✗ ${path} → HTTP ${res.status}`);
      failed++;
      continue;
    }
    if (html.includes("/src/main.tsx")) {
      console.error(`✗ ${path} → unbundled Vite source (main.tsx)`);
      failed++;
      continue;
    }
    if (!html.includes("/assets/index-")) {
      console.error(`✗ ${path} → missing Vite bundle`);
      failed++;
      continue;
    }
    if (html.includes("تعذر عرض هذه الصفحة")) {
      console.error(`✗ ${path} → Error Boundary HTML in response`);
      failed++;
      continue;
    }
    console.log(`✓ ${path}`);
  } catch (err) {
    console.error(`✗ ${path} → ${err.message}`);
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} page(s) failed smoke test.`);
  process.exit(1);
}

console.log(`\nAll ${PAGES.length} routes passed smoke test.`);
