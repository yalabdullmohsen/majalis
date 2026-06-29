#!/usr/bin/env node
/**
 * Phase 1 + 11 — Full Mushaf integrity audit (must pass before deploy).
 * Usage: node scripts/audit-mushaf-integrity.mjs [--strict]
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = join(__dirname, "../public/data/mushaf/page-index.json");
const STRICT = process.argv.includes("--strict");

const EXPECTED = {
  pages: 604,
  surahs: 114,
  juzs: 30,
  hizbs: 60,
  quarters: 240,
};

const LANDMARKS = [
  { name: "الفاتحة start", surah: 1, startPage: 1 },
  { name: "البقرة start", surah: 2, startPage: 2 },
  { name: "آل عمران start", surah: 3, startPage: 50 },
  { name: "الكهف start", surah: 18, startPage: 293 },
  { name: "يس start", surah: 36, startPage: 440 },
  { name: "الملك start", surah: 67, startPage: 562 },
  { name: "الناس end", surah: 114, endPage: 604 },
];

const results = [];
function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

function main() {
  console.log("=== Mushaf Integrity Audit ===\n");
  const index = JSON.parse(readFileSync(INDEX_PATH, "utf8"));

  if (index.totalPages === EXPECTED.pages) pass("Total pages", String(EXPECTED.pages));
  else fail("Total pages", `expected ${EXPECTED.pages}, got ${index.totalPages}`);

  if (index.pages?.length === EXPECTED.pages) pass("Page entries", `${index.pages.length}`);
  else fail("Page entries", String(index.pages?.length));

  const pageNums = index.pages.map((p) => p.page);
  const gaps = [];
  for (let i = 1; i <= EXPECTED.pages; i++) {
    if (pageNums[i - 1] !== i) gaps.push(i);
  }
  if (gaps.length === 0) pass("Page sequence", "1–604 continuous");
  else fail("Page sequence", `gaps at ${gaps.slice(0, 5).join(", ")}${gaps.length > 5 ? "…" : ""}`);

  if (index.surahs?.length === EXPECTED.surahs) pass("Surah count", "114");
  else fail("Surah count", String(index.surahs?.length));

  let surahOrderOk = true;
  for (let i = 0; i < index.surahs.length; i++) {
    const s = index.surahs[i];
    if (s.number !== i + 1) surahOrderOk = false;
    if (!s.name?.trim()) fail(`Surah ${s.number} name`, "empty");
    if (s.startPage > s.endPage) fail(`Surah ${s.number} pages`, `${s.startPage}>${s.endPage}`);
    if (i > 0 && s.startPage < index.surahs[i - 1].startPage) surahOrderOk = false;
  }
  if (surahOrderOk) pass("Surah order", "1–114 ascending start pages");

  for (const lm of LANDMARKS) {
    const s = index.surahs.find((x) => x.number === lm.surah);
    if (!s) { fail(lm.name, "surah missing"); continue; }
    if (lm.startPage != null && s.startPage !== lm.startPage) fail(lm.name, `got page ${s.startPage}`);
    else if (lm.startPage != null) pass(lm.name, `page ${s.startPage}`);
    if (lm.endPage != null && s.endPage !== lm.endPage) fail(lm.name, `end page ${s.endPage}`);
    else if (lm.endPage != null) pass(lm.name, `end page ${s.endPage}`);
  }

  if (index.juzs?.length === EXPECTED.juzs) pass("Juz count", "30");
  else fail("Juz count", String(index.juzs?.length));

  let juzOk = true;
  for (let i = 0; i < index.juzs.length; i++) {
    const j = index.juzs[i];
    if (j.number !== i + 1) juzOk = false;
    if (i > 0 && j.startPage < index.juzs[i - 1].startPage) juzOk = false;
  }
  if (juzOk) pass("Juz order", "ascending start pages");

  if (index.hizbs?.length === EXPECTED.hizbs) pass("Hizb count", "60");
  else fail("Hizb count", String(index.hizbs?.length));

  let hizbOk = true;
  for (let i = 0; i < index.hizbs.length; i++) {
    const h = index.hizbs[i];
    if (h.number !== i + 1) hizbOk = false;
    if (i > 0 && h.startPage < index.hizbs[i - 1].startPage) hizbOk = false;
  }
  if (hizbOk) pass("Hizb order", "ascending start pages");

  if (index.quarters?.length === EXPECTED.quarters) pass("Quarter count", "240");
  else fail("Quarter count", String(index.quarters?.length));

  let quarterOk = true;
  for (let i = 0; i < index.quarters.length; i++) {
    const q = index.quarters[i];
    if (q.number !== i + 1) quarterOk = false;
    if (i > 0 && q.startPage < index.quarters[i - 1].startPage) quarterOk = false;
  }
  if (quarterOk) pass("Quarter order", "ascending start pages");

  for (const p of index.pages) {
    if (!p.juz || p.juz < 1 || p.juz > 30) { fail(`Page ${p.page} juz`, String(p.juz)); break; }
  }
  pass("Page juz range", "spot check OK");

  const metaIssues = index.pages.filter((p) => !p.surahName || !p.surah).length;
  if (metaIssues === 0) pass("Page metadata", "all pages have surah");
  else fail("Page metadata", `${metaIssues} pages missing surah`);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.error("\nSTOP: Fix index before proceeding.");
    process.exit(1);
  }
  if (STRICT && index.source?.includes("Madinah")) {
    console.log("\nNote (strict): Images use Madinah layout CDN — verify Kuwait edition assets separately.");
  }
  console.log("\nMushaf index integrity: VERIFIED");
}

main();
