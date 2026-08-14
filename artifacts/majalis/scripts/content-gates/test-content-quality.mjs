#!/usr/bin/env node
/** حدود الجودة: طول النص، عناوين مكررة، فقرات مبتورة. */
import { loadKnowledgeItems, wordCount, sectionOf, fail, ok } from "./lib.mjs";

const MIN_WORDS = {
  prophets: 1800,
  nations: 1200,
  "quran-people": 20,
  history: 60,
  "intro-islam": 40,
  "discover-islam": 30,
  tafsir: 25,
  quiz: 4,
  default: 25,
};

const items = loadKnowledgeItems();
const issues = [];
const titles = new Map();

for (const it of items) {
  if (it.review_status !== "verified") continue;
  const sec = sectionOf(it);
  const min = MIN_WORDS[sec] || MIN_WORDS.default;
  const wc = wordCount(it.body);
  if (wc < min) issues.push(`${it.id}: ${wc} كلمة < الحد ${min} (${sec})`);
  const tKey = `${sec}::${String(it.title || "").trim()}`;
  if (titles.has(tKey)) issues.push(`عنوان مكرر verified: ${it.title} (${it.id}/${titles.get(tKey)})`);
  else titles.set(tKey, it.id);
  if (sec !== "quiz" && /\[\s*TODO|قيد الكتابة/i.test(it.body || "")) {
    issues.push(`${it.id}: فقرة مبتورة أو TODO`);
  }
}

if (issues.length) fail(`test:content-quality — ${issues.length} مخالفة`, issues);
ok(`test:content-quality — اجتياز (${items.filter((i) => i.review_status === "verified").length} verified)`);
