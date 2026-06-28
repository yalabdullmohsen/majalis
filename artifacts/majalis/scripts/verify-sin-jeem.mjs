#!/usr/bin/env node
/**
 * Verify سين وجيم game module (structure + seed counts via dynamic import)
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
  "src/views/sin-jeem/SinJeemHomePage.tsx",
  "src/views/sin-jeem/SinJeemSetupPage.tsx",
  "src/views/sin-jeem/SinJeemPlayPage.tsx",
  "src/views/sin-jeem/SinJeemResultsPage.tsx",
  "src/views/sin-jeem/SinJeemLeaderboardPage.tsx",
  "src/views/sin-jeem/SinJeemTournamentPage.tsx",
  "src/views/admin/SinJeemSection.tsx",
  "src/lib/sin-jeem/engine.ts",
  "src/lib/sin-jeem/types.ts",
  "src/lib/sin-jeem/questions-seed.ts",
  "src/lib/sin-jeem/categories-seed.ts",
  "src/styles/sin-jeem.css",
  "supabase/sin_jeem_v1.sql",
  "lib/api-handlers/sin-jeem.js",
];

for (const f of files) ok(fs.existsSync(path.join(ROOT, f)), `File: ${f}`);

const app = fs.readFileSync(path.join(ROOT, "src/App.tsx"), "utf8");
ok(app.includes("/sin-jeem"), "App.tsx routes /sin-jeem");
ok(app.includes("SinJeemApp"), "App.tsx lazy-loads SinJeemApp");

const sql = fs.readFileSync(path.join(ROOT, "supabase/sin_jeem_v1.sql"), "utf8");
for (const table of [
  "sin_jeem_categories", "sin_jeem_questions", "sin_jeem_matches",
  "sin_jeem_rounds", "sin_jeem_answers", "sin_jeem_scores",
  "sin_jeem_achievements", "sin_jeem_daily_challenges", "sin_jeem_tournaments",
  "sin_jeem_question_history", "sin_jeem_ai_generations",
]) {
  ok(sql.includes(table), `SQL table: ${table}`);
}

try {
  const bankPath = path.join(ROOT, "data/sin-jeem/questions-bank.json");
  if (fs.existsSync(bankPath)) {
    const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
    ok(Array.isArray(bank) && bank.length >= 500, `JSON bank >= 500 (${bank.length})`);
  } else {
    ok(false, "questions-bank.json missing");
  }
  const cSrc = fs.readFileSync(path.join(ROOT, "src/lib/sin-jeem/categories-seed.ts"), "utf8");
  const cCount = (cSrc.match(/id: "cat-/g) || []).length;
  ok(cCount >= 40, `Categories >= 40 (${cCount})`);
} catch (e) {
  ok(false, `Seed read: ${e.message}`);
}

console.log(`\nSin Jeem verify: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
