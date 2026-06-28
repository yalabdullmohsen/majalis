#!/usr/bin/env node
/**
 * Generate Sin Jeem question bank (500+ unique Arabic Islamic questions)
 * Output: artifacts/majalis/data/sin-jeem/questions-bank.json
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeBank } from "./sin-jeem-bank/build.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data/sin-jeem/questions-bank.json");

const REQUIRED_CATEGORIES = [
  "quran", "tafsir", "quran-sciences", "tajweed", "aqeeda", "hadith",
  "hadith-sciences", "seera", "prophets", "sahaba", "fiqh", "usool-fiqh",
  "arabic", "dua", "morning-adhkar", "islamic-history", "kuwait-islamic",
  "nawawi-40", "islamic-puzzles", "maki-madani",
];

const questions = writeBank(OUT);

const texts = new Set();
let dupes = 0;
for (const q of questions) {
  if (texts.has(q.question)) dupes++;
  texts.add(q.question);
}

const slugCounts = {};
for (const q of questions) {
  slugCounts[q.category_slug] = (slugCounts[q.category_slug] || 0) + 1;
}

const missing = REQUIRED_CATEGORIES.filter((s) => !slugCounts[s]);

console.log(`Generated ${questions.length} questions -> ${OUT}`);
console.log(`Unique question texts: ${texts.size}`);
if (dupes) console.warn(`Warning: ${dupes} duplicate texts removed during build`);
if (missing.length) console.warn(`Categories with zero direct slug hits (may use subcategory): ${missing.join(", ")}`);

const typeCounts = {};
for (const q of questions) typeCounts[q.question_type] = (typeCounts[q.question_type] || 0) + 1;
console.log("Question types:", typeCounts);

if (questions.length < 500) {
  console.error(`FAIL: need >= 500 questions, got ${questions.length}`);
  process.exit(1);
}
if (texts.size < 500) {
  console.error(`FAIL: need >= 500 unique texts, got ${texts.size}`);
  process.exit(1);
}

console.log("OK: bank meets minimum requirements");
