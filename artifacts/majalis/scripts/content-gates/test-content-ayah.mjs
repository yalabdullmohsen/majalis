#!/usr/bin/env node
/**
 * مطابقة نصوص الآيات مع المصحف المحلي:
 * 1) evidences من نوع ayah
 * 2) اقتباسات الجسم بين ﴿ ﴾
 */
import { loadKnowledgeItems, ayahExactMatch, fail, ok } from "./lib.mjs";

const BODY_AYAH = /[﴿﴾]([^﴿﴾]{8,800})[﴿﴾]/g;

const items = loadKnowledgeItems();
const issues = [];
let checked = 0;

for (const it of items) {
  for (const e of it.evidences || []) {
    if (e.type !== "ayah") continue;
    checked++;
    const r = ayahExactMatch(e.text);
    if (!r.ok) issues.push(`${it.__file}#${it.id} evidence ref=${e.ref} «${String(e.text).slice(0, 50)}»`);
  }
  const body = String(it.body || "");
  BODY_AYAH.lastIndex = 0;
  let m;
  while ((m = BODY_AYAH.exec(body))) {
    checked++;
    const r = ayahExactMatch(m[1]);
    if (!r.ok) issues.push(`${it.__file}#${it.id} body-quote «${m[1].slice(0, 50)}»`);
  }
}

if (issues.length) fail(`test:content-ayah — ${issues.length}/${checked} غير مطابقة`, issues);
ok(`test:content-ayah — ${checked} آية مطابقة (evidences + اقتباسات الجسم)`);
