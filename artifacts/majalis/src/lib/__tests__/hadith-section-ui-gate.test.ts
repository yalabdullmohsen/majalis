/**
 * بوابة: توحيد واجهة قسم الحديث + أداء الدخول.
 * تشغيل: node --import tsx src/lib/__tests__/hadith-section-ui-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const hadithView = read("src/pages/hadith/ui/HadithView.tsx");
const hadithById = read("src/pages/hadith/ui/HadithByIdView.tsx");
const hubCard = read("src/components/ui/HubCard.tsx");
const prefetch = read("src/lib/prefetch-route.ts");
const hadithCss = read("src/styles/pages/hadith.css");

console.log("=== أداء hub الحديث — لا corpus مضمّن ===");
assert.doesNotMatch(
  hadithView,
  /<HadithSection[^>]*embedded/,
  "صفحة hub لا تحمّل HadithSection مضمّنة (corpus ثقيل)",
);
assert.match(hadithView, /SectionEntryCard/, "صفحة hub تستخدم SectionEntryCard");
assert.match(hadithView, /href="\/hadith\/sahih"/, "CTA/بطاقات تنتقل إلى /hadith/sahih");
assert.doesNotMatch(hadithView, /hadith-browse-cta/, "لا بطاقة CTA قديمة منفصلة");

console.log("=== prefetch مسارات الحديث ===");
assert.match(prefetch, /"\/hadith\/sahih"/);
assert.match(prefetch, /"\/arbaeen-nawawi"/);
assert.match(prefetch, /"\/hadith\/mawdu"/);
assert.match(hubCard, /prefetchRoute/);
assert.match(hubCard, /SectionEntryCard/);
assert.match(hubCard, /onPointerDown=\{warmRoute\}/);

console.log("=== تفاصيل الحديث داخل بطاقات ===");
assert.match(hadithById, /hadith-detail-card/);
assert.match(hadithById, /hadith-detail-card--matn/);
assert.doesNotMatch(hadithById, /hadith-by-id__nav/);
assert.match(hadithById, /HadithDetailSkeleton/);

console.log("=== تصميم ناعم — لا بطاقات حادة في hadith.css ===");
assert.match(hadithCss, /\.hadith-detail-card[\s\S]*border-radius:\s*var\(--radius-card/);
assert.match(hadithCss, /--bottom-nav-total/);
assert.match(
  hadithCss,
  /\.ds-filter-toggle[\s\S]{0,120}border-radius:\s*var\(--radius-md|border-radius:\s*var\(--radius-md[\s\S]{0,80}\.ds-filter-toggle/,
  "زر التصفية متوازن مع البحث (لا قرص ضخم)",
);
assert.doesNotMatch(
  hadithCss,
  /\.hadith-card[\s\S]{0,200}border-radius:\s*0\s*;/,
  "بطاقة hadith-card لا تستخدم radius صفر",
);

console.log("hadith-section-ui-gate.test.ts: ok");
