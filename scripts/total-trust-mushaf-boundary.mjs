#!/usr/bin/env node
/**
 * TOTAL TRUST Phase 3 — تحقق حدود المصحف (قراءة فقط، بلا تعديل نص).
 * صفحات: 1,2,5,100,221,300,459,604 + قفل البايت + إجمالي 604.
 *
 * تشغيل: node scripts/total-trust-mushaf-boundary.mjs
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const majalis = join(ROOT, "artifacts/majalis");
const OUT = join(ROOT, "reports/total-trust");
const BOUNDARY = [1, 2, 5, 100, 221, 300, 459, 604];

function sha256File(abs) {
  return createHash("sha256").update(readFileSync(abs)).digest("hex");
}

const issues = [];
const pageReports = [];

const pagesDir = join(majalis, "public/data/quran-v2/pages");
const manifestPath = join(majalis, "public/data/quran/pages-manifest.json");
const lockPath = join(majalis, "public/data/quran/PROTECTED_BYTE_LOCK.json");

if (!existsSync(manifestPath)) issues.push("pages-manifest.json مفقود");
else {
  const man = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (man.totalPages !== 604) issues.push(`totalPages=${man.totalPages} متوقع 604`);
  const pageKeys = Object.keys(man.pages || {});
  if (pageKeys.length !== 604) issues.push(`manifest pages entries=${pageKeys.length}`);
}

for (const n of BOUNDARY) {
  const file = join(pagesDir, `page-${String(n).padStart(3, "0")}.json`);
  if (!existsSync(file)) {
    issues.push(`صفحة ناقصة: ${n}`);
    pageReports.push({ page: n, ok: false, reason: "missing" });
    continue;
  }
  const raw = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(raw) || raw.length === 0) {
    issues.push(`صفحة ${n}: بلا آيات`);
    pageReports.push({ page: n, ok: false, reason: "empty" });
    continue;
  }
  const verseKeys = new Set();
  let badPage = false;
  for (const v of raw) {
    if (v.page_number !== n) badPage = true;
    if (!v.verse_key) badPage = true;
    if (verseKeys.has(v.verse_key)) badPage = true;
    verseKeys.add(v.verse_key);
    if (!Array.isArray(v.words) || v.words.length === 0) badPage = true;
  }
  if (badPage) issues.push(`صفحة ${n}: خلل ترقيم/تكرار/كلمات`);
  pageReports.push({
    page: n,
    ok: !badPage,
    verseCount: verseKeys.size,
    first: raw[0]?.verse_key ?? null,
    last: raw[raw.length - 1]?.verse_key ?? null,
    sha256: sha256File(file).slice(0, 16),
  });
}

// توقعات حدود معروفة (مراجع فقط — لا تعديل)
const expect = {
  1: { has: ["1:1", "1:7"] },
  2: { has: ["2:1", "2:5"] },
  604: { has: ["112:1", "114:6"] },
};
for (const [page, exp] of Object.entries(expect)) {
  const file = join(pagesDir, `page-${String(page).padStart(3, "0")}.json`);
  if (!existsSync(file)) continue;
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const keys = new Set(raw.map((v) => v.verse_key));
  for (const k of exp.has) {
    if (!keys.has(k)) issues.push(`صفحة ${page}: مفقود ${k}`);
  }
}

const lock = spawnSync("node", ["scripts/verify-protected-quran-byte-lock.mjs"], {
  cwd: majalis,
  encoding: "utf8",
});
const byteLockOk = lock.status === 0;
if (!byteLockOk) {
  issues.push("PROTECTED_BYTE_LOCK فشل — RELEASE_BLOCKER_CRITICAL إن كان انحراف نص");
}

mkdirSync(OUT, { recursive: true });
const report = {
  program: "SUNNAH_TOTAL_TRUST",
  phase: 3,
  generatedAt: new Date().toISOString(),
  boundaryPages: BOUNDARY,
  byteLockOk,
  byteLockStdout: (lock.stdout || "").trim(),
  pageReports,
  issues,
  releaseBlocker: !byteLockOk || issues.some((i) => /انحراف|ناقصة|خلل/.test(i)),
  note: "لا تعديل على نص القرآن؛ التحقق قراءة فقط. أي انحراف → مراجعة بشرية متخصصة.",
};
writeFileSync(join(OUT, "phase3-mushaf-boundary.json"), JSON.stringify(report, null, 2) + "\n");

if (issues.length) {
  console.error("✗ TOTAL TRUST mushaf boundary:");
  for (const i of issues) console.error("  -", i);
  process.exit(1);
}
console.log(
  `✓ TOTAL TRUST phase3 mushaf boundary: pages=${BOUNDARY.join(",")} byteLock=ok issues=0`,
);
