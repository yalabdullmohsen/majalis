#!/usr/bin/env node
/** رفض related يشير إلى id غير موجود في فهرس المعرفة. */
import { loadKnowledgeItems, fail, ok } from "./lib.mjs";

const items = loadKnowledgeItems();
const ids = new Set(items.map((i) => i.id));
const issues = [];
let checked = 0;
for (const it of items) {
  for (const r of it.related || []) {
    checked++;
    if (!ids.has(r)) issues.push(`${it.id} → related مفقود: ${r}`);
  }
}
if (issues.length) fail(`test:content-links — ${issues.length} رابطًا مكسورًا`, issues);
ok(`test:content-links — ${checked} رابطًا صالحًا`);
