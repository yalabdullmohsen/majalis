#!/usr/bin/env node
/** فحص إملاء عربي شائع وعلامات ترقيم ومسافات مزدوجة. */
import { loadKnowledgeItems, fail, ok } from "./lib.mjs";

const BAD = [
  [/ {2,}/g, "مسافات مزدوجة"],
  [/\t/g, "تاب"],
  [/اال/g, "اال"],
  [/ههذا|هاذا/g, "هذا"],
  [/اللذي |اللتي /g, "الذي/التي"],
  [/انشاء الله|إن شاءالله/g, "إن شاء الله"],
  [/\?\?\?|\!\!\!/g, "ترقيم مبالغ"],
  [/لاكن /g, "لكن"],
  [/أنتي |أنتا /g, "أنتِ/أنتَ"],
  [/عليكي |عليكا /g, "عليكِ/عليكَ"],
  [/\[\s*TODO\s*\]/i, "TODO"],
  [/lorem ipsum/i, "نص وهمي"],
];

const items = loadKnowledgeItems();
const issues = [];
for (const it of items) {
  const text = `${it.title}\n${it.body}`;
  for (const [re, label] of BAD) {
    if (re.test(text)) issues.push(`${it.id}: ${label}`);
  }
}
if (issues.length) fail(`test:content-lang — ${issues.length} مخالفة`, issues);
ok(`test:content-lang — ${items.length} عنصرًا`);
