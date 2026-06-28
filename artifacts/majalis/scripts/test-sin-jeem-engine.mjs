#!/usr/bin/env node
/** Unit tests for sin-jeem engine logic (pure JS, no TS import) */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log(`✓ ${msg}`);
  } else {
    fail++;
    console.error(`✗ ${msg}`);
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(config, pool) {
  let questions = [...pool];
  if (config.categorySlugs?.length) {
    questions = questions.filter((q) => config.categorySlugs.includes(q.category_slug || ""));
  }
  const used = new Set();
  const picked = [];
  for (const q of shuffle(questions)) {
    if (picked.length >= config.questionCount) break;
    if (used.has(q.question)) continue;
    used.add(q.question);
    picked.push(q);
  }
  return picked.slice(0, config.questionCount);
}

const bankPath = path.join(ROOT, "data/sin-jeem/questions-bank.json");
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
ok(bank.length >= 500, `Bank JSON >= 500 (${bank.length})`);
ok(new Set(bank.map((q) => q.question)).size === bank.length, "Bank has unique question texts");

const config = { questionCount: 10, categorySlugs: [] };
const picked = pickQuestions(config, bank);
ok(picked.length === 10, "pickQuestions returns 10");
ok(new Set(picked.map((q) => q.question)).size === 10, "pickQuestions dedupes");

const types = new Set(bank.map((q) => q.question_type));
ok(types.size >= 5, `Question types variety (${types.size} types)`);

const categories = new Set(bank.map((q) => q.category_slug));
ok(categories.size >= 15, `Category coverage (${categories.size} slugs)`);

const withSource = bank.filter((q) => q.source).length;
ok(withSource >= 400, `Questions with source field (${withSource})`);

console.log(`\nEngine tests: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
