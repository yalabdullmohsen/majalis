#!/usr/bin/env node
/**
 * Verify Sin Jeem production readiness
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log(`✓ ${m}`); } else { fail++; console.error(`✗ ${m}`); } }

const files = [
  "src/views/sin-jeem/SinJeemApp.tsx",
  "src/lib/sin-jeem/engine.ts",
  "src/lib/sin-jeem/leaderboard-service.ts",
  "src/lib/sin-jeem/submit-result.ts",
  "src/lib/sin-jeem/questions-bank.ts",
  "data/sin-jeem/questions-bank.json",
  "supabase/sin_jeem_v1.sql",
  "lib/api-handlers/sin-jeem.js",
  "scripts/generate-sin-jeem-bank.mjs",
];

for (const f of files) ok(fs.existsSync(path.join(ROOT, f)), `File: ${f}`);

const app = fs.readFileSync(path.join(ROOT, "src/App.tsx"), "utf8");
ok(app.includes("/sin-jeem"), "App.tsx routes /sin-jeem");

const storage = fs.readFileSync(path.join(ROOT, "src/lib/sin-jeem/storage.ts"), "utf8");
ok(!storage.includes("localStorage.setItem(LEADERBOARD_KEY"), "No localStorage leaderboard writes");

const api = fs.readFileSync(path.join(ROOT, "lib/api-handlers/sin-jeem.js"), "utf8");
ok(api.includes("submit_match"), "API submit_match handler");
ok(api.includes("leaderboard"), "API leaderboard handler");
ok(api.includes("rate_limited"), "API rate limiting");

const sql = fs.readFileSync(path.join(ROOT, "supabase/sin_jeem_v1.sql"), "utf8");
for (const table of [
  "sin_jeem_categories", "sin_jeem_questions", "sin_jeem_matches",
  "sin_jeem_leaderboard_entries", "sin_jeem_question_audit",
  "sin_jeem_ai_generations",
]) {
  ok(sql.includes(table), `SQL table: ${table}`);
}
ok(sql.includes("CREATE UNIQUE INDEX IF NOT EXISTS sin_jeem_questions_content_hash"), "SQL dedup index");

try {
  const bank = JSON.parse(fs.readFileSync(path.join(ROOT, "data/sin-jeem/questions-bank.json"), "utf8"));
  ok(Array.isArray(bank) && bank.length >= 500, `JSON bank >= 500 (${bank.length})`);
  const texts = new Set(bank.map((q) => q.question));
  ok(texts.size === bank.length, "JSON bank no duplicate questions");
  const seedSrc = fs.readFileSync(path.join(ROOT, "src/lib/sin-jeem/questions-seed.ts"), "utf8");
  const seedCount = (seedSrc.match(/\bq\(/g) || []).length;
  ok(bank.length + seedCount >= 500, `Total pool >= 500 (bank ${bank.length} + seed ${seedCount})`);
} catch (e) {
  ok(false, `Bank JSON: ${e.message}`);
}

console.log(`\nSin Jeem production verify: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
