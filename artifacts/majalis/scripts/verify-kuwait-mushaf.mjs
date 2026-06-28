#!/usr/bin/env node
/**
 * Mandatory verification for Kuwait Mushaf reader.
 * Usage: node scripts/verify-kuwait-mushaf.mjs [--base http://localhost:24216]
 */
import { readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INDEX_PATH = join(ROOT, "public/data/mushaf/page-index.json");
const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://127.0.0.1:24216";

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function fetchOk(url, label) {
  const t0 = performance.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  const ms = Math.round(performance.now() - t0);
  if (!res.ok) {
    fail(label, `${res.status} (${ms}ms)`);
    return null;
  }
  pass(label, `${ms}ms`);
  return { res, ms };
}

async function main() {
  console.log("=== Kuwait Mushaf Verification ===\n");

  const index = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
  const indexSize = statSync(INDEX_PATH).size;

  if (index.totalPages === 604 && index.pages.length === 604) {
    pass("Page index", `604 pages, ${(indexSize / 1024).toFixed(1)} KB`);
  } else {
    fail("Page index", `expected 604, got ${index.pages?.length}`);
  }

  if (index.surahs.length === 114) pass("Surah metadata", "114 surahs");
  else fail("Surah metadata", String(index.surahs?.length));

  const kahf = index.surahs.find((s) => s.number === 18);
  if (kahf?.startPage === 293) pass("Surah Al-Kahf page", "293");
  else fail("Surah Al-Kahf page", String(kahf?.startPage));

  const j30 = index.juzs.find((j) => j.number === 30);
  if (j30?.startPage) pass("Juz 30 start page", String(j30.startPage));
  else fail("Juz 30 start page");

  const t0 = performance.now();
  const svg = await fetch(`https://api.islamic.app/v1/mushaf/page/1.svg?theme=light&width=1200`, {
    signal: AbortSignal.timeout(20_000),
  });
  const firstPageMs = Math.round(performance.now() - t0);
  if (svg.ok) pass("First page SVG load", `${firstPageMs}ms`);
  else fail("First page SVG load", String(svg.status));

  await fetchOk("https://api.islamic.app/v1/mushaf/page/604.svg?theme=light&width=1200", "Page 604 SVG");
  await fetchOk("https://cdn.jsdelivr.net/gh/tarekeldeeb/madina_images@w1024/w1024_page293.png", "Page 293 PNG fallback");

  const searchRes = await fetch("https://api.alquran.cloud/v1/search/%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86/all/ar", {
    signal: AbortSignal.timeout(25_000),
  });
  if (searchRes.ok) {
    const data = await searchRes.json();
    const count = data?.data?.count ?? 0;
    pass('Search "الرحمن"', `${count} matches`);
  } else {
    fail('Search "الرحمن"', String(searchRes.status));
  }

  for (const route of ["/quran/mushaf", "/quran/search", "/quran/tafsir"]) {
    try {
      const r = await fetch(`${BASE}${route}`, { signal: AbortSignal.timeout(15_000) });
      if (r.ok) pass(`Route ${route}`, "200");
      else fail(`Route ${route}`, String(r.status));
    } catch (e) {
      fail(`Route ${route}`, e instanceof Error ? e.message : "unreachable");
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
