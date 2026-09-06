#!/usr/bin/env node
/**
 * Smoke جاهزية الإطلاق — healthz/readyz + مسارات حرجة + sitemap/nav حراسة.
 * Usage: node scripts/smoke-launch-readiness.mjs [--base=https://www.ssunnah.com]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const base = (process.argv.find((a) => a.startsWith("--base=")) || "").slice(7) ||
  process.env.SMOKE_BASE ||
  "http://127.0.0.1:4173";

const routes = [
  "/",
  "/lessons",
  "/fiqh",
  "/hadith",
  "/search",
  "/sections",
  "/prayer-times",
  "/mushaf",
  "/tawhid",
  "/tawhid/tawhid-issues",
  "/tawhid/aqeedah-foundations",
  "/manifest.webmanifest",
  "/sitemap.xml",
  "/robots.txt",
  "/healthz",
  "/readyz",
];

function okHealth(j) {
  return j && j.ok === true && j.service === "ssunnah" && j.commit && j.builtAt;
}

let failed = 0;
const homeHtml = await (await fetch(new URL("/", base))).text();
if (/المزيد|المكتبة العلمية/.test(homeHtml)) {
  console.error("✗ home contains legacy labels المزيد/المكتبة العلمية");
  failed++;
} else {
  console.log("✓ home legacy labels absent");
}

for (const path of routes) {
  const url = new URL(path, base).toString();
  try {
    const res = await fetch(url, { redirect: "manual" });
    if (path === "/healthz" || path === "/readyz") {
      if (res.status !== 200) {
        console.error(`✗ ${path} → HTTP ${res.status}`);
        failed++;
        continue;
      }
      const j = await res.json();
      if (!okHealth(j)) {
        console.error(`✗ ${path} → bad json`, j);
        failed++;
        continue;
      }
      console.log(`✓ ${path}`, j.commit);
      continue;
    }
    if (path === "/sitemap.xml") {
      const xml = await res.text();
      if (res.status !== 200 || /\/more|\/library/.test(xml)) {
        console.error(`✗ sitemap status=${res.status} or contains /more|/library`);
        failed++;
        continue;
      }
      console.log("✓ sitemap.xml");
      continue;
    }
    // follow for SPA routes
    const followed = await fetch(url, { redirect: "follow" });
    if (followed.status >= 500) {
      console.error(`✗ ${path} → HTTP ${followed.status}`);
      failed++;
      continue;
    }
    console.log(`✓ ${path} → ${followed.status}`);
  } catch (err) {
    console.error(`✗ ${path} → ${err.message}`);
    failed++;
  }
}

// legacy paths must redirect, not render a library/more page
for (const [path, expect] of [
  ["/more", "/"],
  ["/library", "/search"],
]) {
  const res = await fetch(new URL(path, base), { redirect: "manual" });
  const loc = res.headers.get("location") || "";
  if ([301, 302, 307, 308].includes(res.status) && loc.includes(expect)) {
    console.log(`✓ ${path} → ${loc}`);
    continue;
  }
  const vercel = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../vercel.json"), "utf8");
  const configured =
    vercel.includes(`"source": "${path}"`) && vercel.includes(`"destination": "${expect}"`);
  if (res.status === 200 && configured) {
    console.log(`✓ ${path} SPA host + vercel redirect configured → ${expect}`);
    continue;
  }
  console.error(`✗ ${path} redirect expected to ${expect}, got ${res.status} ${loc}`);
  failed++;
}

if (failed) {
  console.error(`\nsmoke-launch-readiness: ${failed} failed`);
  process.exit(1);
}
console.log("\nsmoke-launch-readiness: ok");
