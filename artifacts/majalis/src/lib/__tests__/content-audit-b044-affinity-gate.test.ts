/**
 * بوابة: ارتباط آية القسم + خلو مدخل الإسلام من الحشو المكرر + روابط خريطة الموقع.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b044-affinity-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const intro = JSON.parse(read("public/data/knowledge/intro-islam/topics.json")) as {
  items: Array<{ id: string; body: string; evidences?: Array<{ ref?: string }> }>;
};
for (const it of intro.items || []) {
  assert.equal(
    (it.body.match(/## تفصيل موجز/g) || []).length,
    0,
    `${it.id}: لا حشو «تفصيل موجز» مكرر`,
  );
  assert.ok((it.evidences || []).length >= 1, `${it.id}: يحتاج دليل آية`);
}

const history = JSON.parse(read("public/data/knowledge/history/timeline.json")) as {
  items: Array<{ id: string; title: string; evidences?: Array<{ ref?: string }> }>;
};
for (const it of history.items || []) {
  const refs = (it.evidences || []).map((e) => e.ref);
  if (/روم|بيزنط/.test(it.title || "")) continue;
  assert.ok(
    !refs.includes("30:2"),
    `${it.id}: آية الروم لا تُلصق بمحطة تاريخية غير مرتبطة`,
  );
}

const faq = JSON.parse(read("public/data/knowledge/discover-islam/path-and-faq.json")) as {
  items: Array<{ id: string; title: string; evidences?: Array<{ ref?: string }> }>;
};
const prayerFaq = (faq.items || []).find((i) => /كم صلاة/.test(i.title || ""));
assert.ok(prayerFaq, "سؤال عدد الصلوات موجود");
assert.equal(prayerFaq?.evidences?.[0]?.ref, "4:103", "آية الصلاة لسؤال عدد الصلوات");

const sitemap = read("src/pages/account/ui/SiteMapView.tsx");
assert.match(sitemap, /\/dalail-nubuwwah/, "خريطة الموقع تعرض دلائل النبوة");
assert.doesNotMatch(
  sitemap,
  /href: "\/flashcards"[\s\S]*href: "\/flashcards"/,
  "لا بطاقتان مكررتان لـ flashcards متتاليتان",
);

const masarat = read("src/lib/masarat-data.ts");
assert.doesNotMatch(masarat, /href:\s*"\/quran-studies"/, "المسارات لا تشير لمسار محوّل قديم");
assert.match(masarat, /href:\s*"\/asma-husna"/, "مسار الأسماء الحسنى صحيح");

console.log("content-audit-b044-affinity-gate: ok");
