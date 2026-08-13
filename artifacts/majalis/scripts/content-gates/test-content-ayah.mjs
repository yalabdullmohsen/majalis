#!/usr/bin/env node
/** مطابقة كل نص آية في evidences من نوع ayah مع المصحف المحلي حرفًا بحرف (بعد تطبيع التشكيل). */
import { loadKnowledgeItems, ayahExactMatch, fail, ok } from "./lib.mjs";

const items = loadKnowledgeItems();
const issues = [];
let checked = 0;
for (const it of items) {
  for (const e of it.evidences || []) {
    if (e.type !== "ayah") continue;
    checked++;
    const r = ayahExactMatch(e.text);
    if (!r.ok) issues.push(`${it.__file}#${it.id} ref=${e.ref} «${String(e.text).slice(0, 50)}»`);
  }
}
if (issues.length) fail(`test:content-ayah — ${issues.length}/${checked} غير مطابقة`, issues);
ok(`test:content-ayah — ${checked} آية مطابقة`);
