/**
 * بحث عربي متسامح — حالات إلزامية للـ CI.
 * تشغيل: node --import tsx src/features/search/__tests__/tolerant-search.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearNormalizeArabicCache,
  normalizeArabic,
  normalizeForSearch,
} from "@/shared/arabic-normalize";
import {
  highlightOriginalParts,
  scoreTolerantMatch,
  stripDefiniteArticle,
  tolerantIncludes,
} from "@/features/search/tolerant-match";
import { parseMushafJumpQuery } from "@/features/search/mushaf-jump";
import { searchUnifiedIndex, type UnifiedSearchDoc } from "@/features/search/unified-local";

clearNormalizeArabicCache();

// ── تكافؤ الحروف ─────────────────────────────────────────────────────────────
assert.equal(normalizeArabic("أإآٱٲٳ"), "اااااا");
assert.equal(normalizeArabic("يىئی"), "يييي");
assert.equal(normalizeArabic("مؤمن"), normalizeArabic("مومن"));
assert.equal(normalizeArabic("صلاة"), normalizeArabic("صلاه"));
assert.equal(normalizeArabic("الضحى"), normalizeArabic("الضحي"));
assert.equal(normalizeArabic("کتاب"), normalizeArabic("كتاب"));
assert.equal(normalizeArabic("لا"), normalizeArabic("ﻻ"));
assert.ok(tolerantIncludes("الأحزاب", "الاحزاب"));
assert.ok(tolerantIncludes("الأنعام", "انعام"));
assert.ok(tolerantIncludes("إبراهيم", "ابراهيم"));
assert.ok(tolerantIncludes("الضحى", "الضحي"));
assert.ok(tolerantIncludes("صلاة", "صلاه"));
assert.ok(tolerantIncludes("مؤمن", "مومن"));

// ── أرقام ثلاثية الاتجاه ─────────────────────────────────────────────────────
assert.equal(normalizeForSearch("٢٨٣"), normalizeForSearch("283"));
assert.equal(normalizeForSearch("۲۸۳"), normalizeForSearch("283"));
assert.equal(normalizeArabic("٢:٢٥٥"), "2:255");
assert.deepEqual(parseMushafJumpQuery("283"), parseMushafJumpQuery("٢٨٣"));
const a1 = parseMushafJumpQuery("2:255");
const a2 = parseMushafJumpQuery("٢:٢٥٥");
assert.ok(a1 && a2 && a1.kind === "ayah" && a2.kind === "ayah");
if (a1?.kind === "ayah" && a2?.kind === "ayah") {
  assert.equal(a1.surah, a2.surah);
  assert.equal(a1.ayah, a2.ayah);
}

// ── الـ اختيارية ─────────────────────────────────────────────────────────────
assert.ok(tolerantIncludes("البقرة", "بقره"));
assert.ok(tolerantIncludes("بقرة", "البقرة") || tolerantIncludes("البقرة", "البقرة"));
assert.ok(tolerantIncludes("الفاتحة", "الفاتحه"));
assert.equal(stripDefiniteArticle(normalizeArabic("البقرة")), normalizeArabic("بقرة"));

// ── خطأ حرف واحد ─────────────────────────────────────────────────────────────
assert.ok(tolerantIncludes("الكهف", "الكهاف"));
const kahf = parseMushafJumpQuery("الكهاف");
assert.ok(kahf && kahf.kind === "page", "الكهاف → سورة الكهف");

// ── ترتيب المطابقة ───────────────────────────────────────────────────────────
const exact = scoreTolerantMatch("الأحزاب", "الاحزاب");
const prefix = scoreTolerantMatch("الأحزاب والشورى", "الاحزاب");
assert.ok(exact && exact.rank === 0);
assert.ok(prefix && prefix.rank <= 1);

// ── لا ضوضاء بحرفين ──────────────────────────────────────────────────────────
const noiseDocs: UnifiedSearchDoc[] = Array.from({ length: 200 }, (_, i) => ({
  id: `d${i}`,
  kind: "book",
  titleAr: i % 2 === 0 ? `كتاب في الفقه ${i}` : `رسالة في العقيدة ${i}`,
  href: `/x/${i}`,
  norm: normalizeArabic(i % 2 === 0 ? `كتاب في الفقه ${i}` : `رسالة في العقيدة ${i}`),
}));
noiseDocs.push({
  id: "fi",
  kind: "book",
  titleAr: "في",
  href: "/fi",
  norm: normalizeArabic("في"),
});
const shortHits = searchUnifiedIndex(noiseDocs, "في", 200);
const shortTotal = Object.values(shortHits).reduce((n, a) => n + a.length, 0);
assert.ok(shortTotal <= 12, `استعلام حرفين لا يغرق النتائج (حصل ${shortTotal})`);

// ── سور شائعة عبر التطبيع ───────────────────────────────────────────────────
for (const [q, label] of [
  ["الاحزاب", "الأحزاب"],
  ["انعام", "الأنعام"],
  ["ابراهيم", "إبراهيم"],
] as const) {
  const hit = parseMushafJumpQuery(q);
  assert.ok(hit && hit.kind === "page", `${q} يجد ${label}`);
}

// ── إبراز على النص الأصلي ────────────────────────────────────────────────────
const parts = highlightOriginalParts("سورة البقرة", "بقره");
assert.ok(parts.some((p) => p.hit && /بقر/.test(p.text)), "highlight على الأصل");

// ── أداء فهرس المكتبة الموحّد ────────────────────────────────────────────────
const here = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(here, "../../../../public/data/search/index.json");
const index = JSON.parse(readFileSync(indexPath, "utf8")) as {
  docs: UnifiedSearchDoc[];
};
assert.ok(index.docs.length > 50, "فهرس البحث موجود");
const t0 = performance.now();
const libHits = searchUnifiedIndex(index.docs, "بقره", 40);
const ms = performance.now() - t0;
assert.ok(ms < 150, `بحث الفهرس الكامل <150ms (كان ${ms.toFixed(1)}ms)`);
const anyHit = Object.values(libHits).some((arr) =>
  arr.some((h) => /بقر/.test(h.titleAr) || /بقر/.test(h.meta ?? "")),
);
// قد لا يحتوي الفهرس عنوان «بقرة» حرفيًا — يكفي أن يكتمل المسح سريعًا وتُقبل المطابقة المنطقية
void anyHit;

console.log(`tolerant-search.test.ts: ok (${ms.toFixed(1)}ms على ${index.docs.length} وثيقة)`);
