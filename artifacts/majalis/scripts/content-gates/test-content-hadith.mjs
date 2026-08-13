#!/usr/bin/env node
/** رفض أي حديث بلا ref أو grade أو graded_by؛ ورفض الضعيف/الموضوع في المعرفة المعروضة كـ verified. */
import { loadKnowledgeItems, fail, ok } from "./lib.mjs";

const WEAK = /ضعيف|موضوع|منكر|متروك|لا أصل|أُدرج خطأ/i;
const items = loadKnowledgeItems();
const issues = [];
let checked = 0;
for (const it of items) {
  for (const e of it.evidences || []) {
    if (e.type !== "hadith") continue;
    checked++;
    if (!e.ref) issues.push(`${it.id}: hadith missing ref`);
    if (!e.grade) issues.push(`${it.id}: hadith missing grade`);
    if (!e.graded_by) issues.push(`${it.id}: hadith missing graded_by`);
    if (it.review_status === "verified" && WEAK.test(String(e.grade))) {
      issues.push(`${it.id}: weak/mawdu‘ hadith in verified item (${e.grade})`);
    }
  }
}
if (issues.length) fail(`test:content-hadith — ${issues.length} مخالفة`, issues);
ok(`test:content-hadith — ${checked} حديثًا مفحوصًا`);
