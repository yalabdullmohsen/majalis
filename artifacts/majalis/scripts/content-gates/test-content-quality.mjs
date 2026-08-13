#!/usr/bin/env node
/** حدود الجودة: طول النص، عناوين مكررة، فقرات مبتورة. */
import { loadKnowledgeItems, wordCount, fail, ok } from "./lib.mjs";

const MIN_WORDS = {
  prophet: 350,
  nation: 70,
  "quran-person": 20,
  history: 60,
  "intro-islam": 40,
  "discover-islam": 30,
  tafsir: 25,
  quiz: 4,
  default: 25,
};

function sectionOf(it) {
  const f = it.__file || "";
  if (f.includes("/prophets/")) return "prophet";
  if (f.includes("/nations/")) return "nation";
  if (f.includes("/quran-people/")) return "quran-person";
  if (f.includes("/history/")) return "history";
  if (f.includes("/intro-islam/")) return "intro-islam";
  if (f.includes("/discover-islam/")) return "discover-islam";
  if (f.includes("/tafsir/")) return "tafsir";
  if (f.includes("/quiz/")) return "quiz";
  return "default";
}

const items = loadKnowledgeItems();
const issues = [];
const titles = new Map();

for (const it of items) {
  if (it.review_status !== "verified") continue;
  const sec = sectionOf(it);
  const min = MIN_WORDS[sec] || MIN_WORDS.default;
  const wc = wordCount(it.body);
  if (wc < min) issues.push(`${it.id}: ${wc} كلمة < الحد ${min} (${sec})`);
  const tKey = `${sectionOf(it)}::${String(it.title || "").trim()}`;
  if (titles.has(tKey)) issues.push(`عنوان مكرر verified: ${it.title} (${it.id}/${titles.get(tKey)})`);
  else titles.set(tKey, it.id);
  if (sectionOf(it) !== "quiz" && /\[\s*TODO|قيد الكتابة/i.test(it.body || "")) {
    issues.push(`${it.id}: فقرة مبتورة أو TODO`);
  }
}

if (issues.length) fail(`test:content-quality — ${issues.length} مخالفة`, issues);
ok(`test:content-quality — اجتياز (${items.filter((i) => i.review_status === "verified").length} verified)`);
