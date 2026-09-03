import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseQuickNav } from "@/features/search/quick-nav";
import {
  clearUnifiedSearchIndexCache,
  primeUnifiedSearchIndex,
  searchUnifiedIndex,
  type UnifiedSearchDoc,
} from "@/features/search/unified-local";
import { runAppSearch } from "@/features/search/app-search";
import { normalizeArabic } from "@/shared/arabic-normalize";

const q1 = parseQuickNav("البقرة ٢٥٥");
assert.ok(q1?.href.includes("mushaf") || q1?.href.includes("ayah="), "آية البقرة → مصحف");
const q2 = parseQuickNav("صحيح البخاري 1");
assert.ok(q2?.href.includes("hadith"), "حديث البخاري");
assert.equal(parseQuickNav(""), null);

const docs: UnifiedSearchDoc[] = [
  {
    id: "history:pers-al-tabari",
    kind: "history",
    titleAr: "الطبري",
    href: "/tarikh-islami/pers-al-tabari",
    norm: "الطبري تاريخ",
  },
  {
    id: "book:x",
    kind: "book",
    titleAr: "الموطأ",
    href: "/library/x",
    norm: "الموطا مالك",
  },
];

const hits = searchUnifiedIndex(docs, "طبري");
assert.ok((hits.history?.length ?? 0) >= 1, "بحث تاريخ");
const hits2 = searchUnifiedIndex(docs, "الموطأ");
assert.ok((hits2.book?.length ?? 0) >= 1, "بحث كتاب");

const here = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(here, "../../../../public/data/search/index.json");
const index = JSON.parse(readFileSync(indexPath, "utf8")) as {
  version: number;
  docs: UnifiedSearchDoc[];
};
assert.ok(index.docs.length >= 1000, `فهرس شامل (${index.docs.length})`);

const kinds = new Set(index.docs.map((d) => d.kind));
for (const k of [
  "surah",
  "tafsir",
  "hadith",
  "qa",
  "lesson",
  "history",
  "adhkar",
  "nation",
  "story",
  "fiqh",
  "seerah",
  "prophet",
  "dua",
  "tajweed",
  "hifz",
  "settings",
  "ulum",
]) {
  assert.ok(kinds.has(k), `القسم ${k} موجود في الفهرس`);
}
assert.equal(kinds.has("book"), false, "فهرس الكتب (/library) أُزيل من البحث العلني");

// حالات التطبيع الإلزامية على الفهرس الحقيقي
for (const [q, needle] of [
  ["الاحزاب", "أحزاب"],
  ["انعام", "أنعام"],
  ["الضحي", "ضحى"],
  ["بقره", "بقر"],
  ["الكهاف", "كهف"],
] as const) {
  const found = searchUnifiedIndex(index.docs, q, 40);
  const flat = Object.values(found).flat();
  assert.ok(
    flat.some((h) => normalizeArabic(h.titleAr).includes(normalizeArabic(needle))),
    `${q} يجد ${needle} في الفهرس`,
  );
}

assert.ok(searchUnifiedIndex(index.docs, "صلاه", 20));
assert.ok(searchUnifiedIndex(index.docs, "مومن", 20));

// كل قسم يعيد نتيجة واحدة على الأقل لاستعلام معروف
const sectionProbes: Record<string, string> = {
  surah: "بقره",
  tafsir: "الميسّر",
  hadith: "البخاري",
  qa: "الصلاة",
  lesson: "درس",
  history: "التاريخ",
  adhkar: "الصباح",
  nation: "عاد",
  story: "قصة سورة",
  fiqh: "الفقه",
  seerah: "السيرة",
  prophet: "الأنبياء",
  dua: "أدعية",
  tajweed: "تجويد",
  hifz: "الحفظ",
  settings: "الأذان",
  ulum: "علوم",
};
for (const [kind, q] of Object.entries(sectionProbes)) {
  const g = searchUnifiedIndex(index.docs, q, 80);
  const n = g[kind]?.length ?? 0;
  assert.ok(n >= 1, `قسم ${kind} يعيد ≥1 لنتيجة «${q}» (حصل ${n})`);
}

clearUnifiedSearchIndexCache();
primeUnifiedSearchIndex(index);
const app = await runAppSearch("بقره", { limit: 20 });
assert.ok(app.results.length >= 1, "runAppSearch يعيد نتائج");
assert.equal(app.quickNavHref, undefined, "لا انتقال تلقائي — بلا quickNavHref");
assert.ok(app.responseMs < 150, `runAppSearch <150ms (${app.responseMs.toFixed(1)})`);

// اختصار مصحف يظهر كخيار أول دون إخفاء بقية النتائج
const appQuick = await runAppSearch("البقرة", { limit: 20 });
assert.ok(appQuick.results.length >= 1, "اسم سورة يعيد قائمة");
assert.equal(appQuick.quickNavHref, undefined, "اسم سورة لا يفرض انتقالاً تلقائياً");
assert.ok(
  appQuick.results.some((r) => r.href.includes("/mushaf")),
  "اختصار المصحف ضمن الخيارات",
);

console.log(`unified-search.test.ts: ok (${index.docs.length} docs, ${kinds.size} kinds)`);
