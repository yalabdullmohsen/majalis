#!/usr/bin/env node
/**
 * Offline integrity audit for Sin Jeem seed data (no DB required).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORY_SEED } from "../lib/sin-jeem-seed.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let pass = 0;
let fail = 0;

function ok(c, m) {
  if (c) {
    pass++;
    console.log(`✓ ${m}`);
  } else {
    fail++;
    console.error(`✗ ${m}`);
  }
}

const VALID_TYPES = new Set([
  "multiple_choice", "true_false", "complete_verse", "complete_hadith", "complete_mutoon",
  "who_said", "order_events", "match", "image_choice", "mosque_choice", "companion_choice",
  "scholar_choice", "battle_choice", "book_choice", "first_last", "count", "ruling",
  "pillar", "condition", "wajib", "sunnah", "audio_choice", "video_choice", "seira_timeline",
]);

const categorySlugs = new Set(CATEGORY_SEED.map((c) => c.slug));
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, "data/sin-jeem/questions-bank.json"), "utf8"));

ok(Array.isArray(bank), "Bank is array");
ok(bank.length >= 527, `Questions >= 527 (${bank.length})`);

const texts = bank.map((q) => q.question?.trim()).filter(Boolean);
ok(texts.length === bank.length, "No empty question text");
ok(new Set(texts).size === texts.length, "No duplicate question texts");

let nullFields = 0;
let badCategory = 0;
let badType = 0;
let badMcq = 0;

for (const q of bank) {
  if (!q.question?.trim()) nullFields++;
  if (q.category_slug && !categorySlugs.has(q.category_slug)) badCategory++;
  if (q.question_type && !VALID_TYPES.has(q.question_type)) badType++;
  if (q.question_type === "multiple_choice" || q.question_type === "true_false") {
    const opts = q.options || [];
    if (!Array.isArray(opts) || opts.length < 2) badMcq++;
    if (q.correct_index == null && !q.correct_answer) badMcq++;
  }
}

ok(nullFields === 0, `No null questions (${nullFields})`);
ok(badCategory === 0, `All category_slug valid (${badCategory} invalid)`);
ok(badType === 0, `All question_type valid (${badType} invalid)`);
ok(badMcq === 0, `MCQ/TF have options + answer (${badMcq} broken)`);

ok(CATEGORY_SEED.length >= 26, `Categories >= 26 (${CATEGORY_SEED.length})`);
ok(new Set(CATEGORY_SEED.map((c) => c.slug)).size === CATEGORY_SEED.length, "Unique category slugs");

const withSource = bank.filter((q) => q.source).length;
ok(withSource === bank.length, `All questions have source (${withSource}/${bank.length})`);

const types = new Set(bank.map((q) => q.question_type));
ok(types.size >= 10, `Question types >= 10 (${types.size})`);

console.log(`\nSeed integrity: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
