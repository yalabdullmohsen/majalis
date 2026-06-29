#!/usr/bin/env node
/**
 * Verify Question Bank V2 — structure, dedup, coverage, build readiness.
 * Usage: node scripts/verify-question-bank-v2.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BANK_PATH = join(ROOT, "data/sin-jeem/questions-bank-v2.json");
const REPORT_PATH = join(ROOT, "reports/question-bank-v2-rebuild.json");
const SQL_PATH = join(__dirname, "../../../supabase/question_bank_v2.sql");

function normalizeArabic(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenSimilarity(a, b) {
  const ta = new Set(normalizeArabic(a).split(/\s+/).filter(Boolean));
  const tb = new Set(normalizeArabic(b).split(/\s+/).filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

function validate(q) {
  const errors = [];
  if (!q.question?.trim()) errors.push("missing_question");
  if (!Array.isArray(q.options) || q.options.length !== 4) errors.push("requires_four_options");
  if (new Set(q.options || []).size < 4) errors.push("duplicate_options");
  if (q.correct_index == null || q.correct_index < 0 || q.correct_index > 3) errors.push("invalid_correct_index");
  if (!q.explanation?.trim()) errors.push("missing_explanation");
  if (!q.source?.trim()) errors.push("missing_source");
  if (!q.content_hash) errors.push("missing_hash");
  return errors;
}

const checks = [];
let passed = 0;

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  if (ok) passed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("=== Question Bank V2 Verification ===\n");

check("v2 bank exists", existsSync(BANK_PATH));
check("rebuild report exists", existsSync(REPORT_PATH));
check("SQL migration exists", existsSync(SQL_PATH));

const bank = JSON.parse(readFileSync(BANK_PATH, "utf8"));
const report = existsSync(REPORT_PATH) ? JSON.parse(readFileSync(REPORT_PATH, "utf8")) : null;

check("bank not empty", bank.length > 0, `${bank.length} questions`);
check("published questions available", bank.filter((q) => q.status === "published").length >= 10,
  `${bank.filter((q) => q.status === "published").length} published`);

let structErrors = 0;
const hashes = new Set();
const texts = new Set();
let dupCount = 0;

for (const q of bank) {
  const errs = validate(q);
  structErrors += errs.length;
  if (hashes.has(q.content_hash)) dupCount++;
  hashes.add(q.content_hash);
  const norm = normalizeArabic(q.question);
  if (texts.has(norm)) dupCount++;
  texts.add(norm);
}

for (let i = 0; i < bank.length; i++) {
  for (let j = i + 1; j < bank.length; j++) {
    if (tokenSimilarity(bank[i].question, bank[j].question) >= 0.92) dupCount++;
  }
}

check("structure validation", structErrors === 0, structErrors ? `${structErrors} errors` : "all pass");
check("no duplicates", dupCount === 0, dupCount ? `${dupCount} dup hits` : "clean");

const coverage = {};
for (const q of bank) {
  coverage[q.category_slug] = (coverage[q.category_slug] || 0) + 1;
}
const coveredCats = Object.keys(coverage).length;
check("category coverage", coveredCats >= 5, `${coveredCats} categories`);

if (report) {
  check("purge report quality", report.qualityScore >= 90, `${report.qualityScore}%`);
  check("legacy purge executed", report.removed.total > 0, `${report.removed.total} removed`);
}

console.log("\n--- Build ---");
try {
  execSync("pnpm run typecheck", { cwd: ROOT, stdio: "pipe" });
  check("typecheck", true);
} catch (e) {
  check("typecheck", false, e.stderr?.toString().slice(0, 200) || "failed");
}

try {
  execSync("PORT=24216 BASE_PATH=/ pnpm run build", { cwd: ROOT, stdio: "pipe", env: { ...process.env, PORT: "24216", BASE_PATH: "/" } });
  check("vite build", true);
} catch (e) {
  check("vite build", false, e.stderr?.toString().slice(0, 200) || "failed");
}

const summary = {
  verifiedAt: new Date().toISOString(),
  checks,
  passed,
  total: checks.length,
  ready: passed === checks.length,
  bankSize: bank.length,
  published: bank.filter((q) => q.status === "published").length,
  coverage,
};

console.log(`\n=== ${passed}/${checks.length} checks passed ===`);
console.log(JSON.stringify(summary, null, 2));
process.exit(passed === checks.length ? 0 : 1);
