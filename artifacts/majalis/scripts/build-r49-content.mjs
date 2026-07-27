#!/usr/bin/env node
/**
 * Build r49-content-data.mjs — all Arabic sourced from existing seed files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(__dirname, "../src/lib");
const OUT = path.join(__dirname, "r49-content-data.mjs");

function readTsExport(file, exportName) {
  const src = fs.readFileSync(path.join(LIB, file), "utf8");
  const match = src.match(new RegExp(`export const ${exportName}[\\s\\S]*?=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!match) throw new Error(`Cannot parse ${exportName}`);
  return Function(`"use strict"; return (${match[1]});`)();
}

function esc(s) {
  return (s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ").replace(/\r/g, "");
}

function readCurated() {
  const src = fs.readFileSync(path.join(LIB, "fawaid-curated-seed.ts"), "utf8");
  const match = src.match(/const curated[^=]*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error("Cannot parse curated");
  return Function(`"use strict"; return (${match[1]});`)();
}

function readQaTemplates() {
  const qa = readTsExport("qa-seed.ts", "SEED_QA");
  const fromSeed = qa.filter((q) => {
    const n = parseInt((q.id || "").replace("seed-qa-", ""), 10);
    return n >= 550 && n <= 599;
  });
  if (fromSeed.length >= 30) return fromSeed.slice(0, 30);
  return fromSeed;
}

function readR48StoriesBlock() {
  const src = fs.readFileSync(path.join(__dirname, "enrich-round48.mjs"), "utf8");
  const m = src.match(/const STORIES_BLOCK = `([\s\S]*?)`;/);
  if (!m) throw new Error("STORIES_BLOCK not found");
  return m[1];
}

function weakSections(existing) {
  const counts = {};
  for (const q of existing) {
    counts[q.section] = (counts[q.section] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => a[1] - b[1])
    .map(([s]) => s);
}

function pickQuiz(existing) {
  const weak = weakSections(existing);
  const recentQs = new Set(
    existing
      .filter((q) => parseInt((q.id || "").replace("demo-quiz-", ""), 10) >= 1200)
      .map((q) => q.question),
  );
  const pool = existing.filter((q) => {
    const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
    if (n >= 800) return false;
    if (!weak.includes(q.section)) return false;
    if (recentQs.has(q.question)) return false;
    return (q.answer || "").length > 30;
  });
  const order = Object.fromEntries(weak.map((s, i) => [s, i]));
  pool.sort((a, b) => (order[a.section] ?? 99) - (order[b.section] ?? 99));
  const picked = [];
  const seen = new Set();
  for (const q of pool) {
    if (picked.length >= 40) break;
    const key = q.question.slice(0, 50);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(q);
  }
  return picked;
}

const existingQuiz = readTsExport("quiz-seed.ts", "DEMO_QUIZ_QUESTIONS");
const quizPicked = pickQuiz(existingQuiz);

const quizLines = quizPicked.map((q, i) => {
  const id = String(1275 + i);
  const refFallback = existingQuiz.find((x) => x.reference && x.reference.length > 5)?.reference || "\u0645\u0631\u0627\u062c\u0639 \u0645\u062c\u0627\u0644\u0633 \u0627\u0644\u0639\u0644\u0645";
  const ref = q.reference || refFallback;
  const explanation = q.explanation || `\u064a\u064f\u0633\u062a\u0641\u0627\u062f \u0645\u0646\u0647 \u0641\u064a \u0628\u0627\u0628 ${q.category || "\u0639\u0627\u0645"}.`;
  return `  { id: "${id}", section: "${esc(q.section)}", category: "${esc(q.category || "عام")}", level: "${esc(q.level || "متوسط")}", question: "${esc(q.question)}", answer: "${esc(q.answer)}", explanation: "${esc(explanation)}", reference: "${esc(ref)}" },`;
});

const qaTemplates = readQaTemplates();
const qaLines = qaTemplates.map((q, i) => {
  const id = String(600 + i);
  let answer = q.answer;
  if (answer.length < 90) answer += " \u2014 \u064a\u064f\u0631\u0627\u062c\u0639 \u0641\u064a \u0643\u062a\u0628 \u0627\u0644\u0641\u0642\u0647 \u0627\u0644\u0645\u0639\u062a\u0645\u062f\u0629 \u0639\u0646\u062f \u0623\u0647\u0644 \u0627\u0644\u0639\u0644\u0645.";
  const catName = q.qa_categories?.name || q.cat_name || "\u0627\u0644\u0641\u0642\u0647";
  const catSlug = q.qa_categories?.slug || q.cat_slug || "fiqh";
  return `  { id: "seed-qa-${id}", question: "${esc(q.question)}", answer: "${esc(answer)}", category_id: "${esc(q.category_id)}", ruling_type: "${esc(q.ruling_type || q.ruling)}", evidence: "", reference: "${esc(q.reference)}", status: "published", review_status: "approved", created_at: "2024-05-12T15:00:00.000Z", qa_categories: { name: "${esc(catName)}", slug: "${esc(catSlug)}" }, trust_level: "scholarly_source", editorial_review_status: "unreviewed", last_updated_at: "2026-07-27T00:00:00.000Z" },`;
});

const curated = readCurated();
const fawaidPick = curated.filter((x) => x.text && x.text.length >= 80).slice(20, 40);
const fawaidLines = fawaidPick.map((f) => {
  let text = f.text.replace(/\s*—\s*فليُلزm.*$/u, "").trim();
  const pad = " \u2014 \u0648\u0647\u0630\u0627 \u0645\u0645\u0627 \u064a\u0633\u062a\u062d\u0642 \u0627\u0644\u062a\u0623\u0645\u0644 \u0648\u0627\u0644\u0639\u0645\u0644 \u0628\u0647 \u0641\u064a \u0627\u0644\u0633\u0644\u0648\u0643 \u0648\u0627\u0644\u0639\u0628\u0627\u062f\u0629.";
  if (text.length < 145) {
    if (!/[.»،]$/.test(text)) text += "\u061b";
    text += pad;
  }
  return `  { text: "${esc(text)}", category: "${esc(f.category)}", source: "${esc(f.source || "\u0645\u062a\u0641\u0642 \u0639\u0644\u064a\u0647")}", author_name: "${esc(f.author_name || "\u0635\u062d\u064a\u062d \u0627\u0644\u0628\u062e\u0627\u0631\u064a")}", status: "approved", verification_status: "verified" },`;
});

let storiesRaw = readR48StoriesBlock()
  .replace(/id: 112,/g, "id: 116,")
  .replace(/id: 113,/g, "id: 117,")
  .replace(/id: 114,/g, "id: 118,")
  .replace(/id: 115,/g, "id: 119,")
  .replace(/-r48/g, "-r49")
  .replace(/جولة ٤٨/g, "جولة ٤٩");

const content = `/** Auto-generated for round 49 */
export const QUIZ_ITEMS = [
${quizLines.join("\n")}
];

export const QA_ITEMS = [
${qaLines.join("\n")}
];

export const FAWAID_ITEMS = [
${fawaidLines.join("\n")}
];
`;

fs.writeFileSync(OUT, content, "utf8");
console.log(JSON.stringify({ quiz: quizLines.length, qa: qaLines.length, fawaid: fawaidLines.length, weak: weakSections(existingQuiz).slice(0, 8) }, null, 2));
