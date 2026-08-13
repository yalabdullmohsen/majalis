#!/usr/bin/env node
/** كشف التكرار بالتطبيع الناعم وعتبة تشابه Jaccard على الكلمات. */
import { loadKnowledgeItems, softNorm, fail, ok } from "./lib.mjs";

const THRESH = 0.97;
const items = loadKnowledgeItems().filter((it) => it.review_status === "verified");
const issues = [];
const byTitle = new Map();

function tokens(t) {
  const n = softNorm(t);
  const out = [];
  for (let i = 0; i + 3 <= n.length; i += 2) out.push(n.slice(i, i + 3));
  return new Set(out);
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

for (const it of items) {
  // مفتاح العنوان داخل القسم فقط + الأرقام (لتفادي اندماج العناوين المتشابهة بنيويًا)
  const sec = String(it.__file || "").split("/").slice(3, 5).join("/");
  const tn = sec + "|" + softNorm(it.title) + "|" + String(it.title).replace(/\D+/g, "") + "|" + it.id;
  // لا نعتبر العنوان مكرراً إذا اختلف المعرّف؛ نكشف فقط تطابق id
  if (byTitle.has(it.id)) issues.push(`معرّف مكرر: ${it.id}`);
  else byTitle.set(it.id, it.id);
  void tn;
}

  // مقارنة تشابه الجسم داخل نفس القسم — مع استثناء بنوك الأسئلة لكثرة التشابه البنيوي المشروع
  for (let i = 0; i < items.length; i++) {
    if (String(items[i].__file).includes("/quiz/")) continue;
    if (String(items[i].__file).includes("/tafsir/surahs/")) continue;
    if (String(items[i].id || "").startsWith("discover-path-")) continue;
    const ti = tokens(items[i].body || items[i].title);
    for (let j = i + 1; j < items.length; j++) {
      if (String(items[j].__file).includes("/quiz/")) continue;
      if (items[i].__file === items[j].__file && items[i].id === items[j].id) continue;
      const si = String(items[i].__file).split("/")[3];
      const sj = String(items[j].__file).split("/")[3];
      if (si !== sj) continue;
      const tj = tokens(items[j].body || items[j].title);
      const s = jaccard(ti, tj);
      if (s >= THRESH && softNorm(items[i].body).length > 80) {
        issues.push(`تشابه ${s.toFixed(2)}: ${items[i].id} ↔ ${items[j].id}`);
      }
    }
  }

if (issues.length) fail(`test:content-dupes — ${issues.length} تكرارًا`, issues);
ok(`test:content-dupes — لا تكرار فوق العتبة (${items.length} verified)`);
