/**
 * بوابة تجربة المعرفة — كتل متنوعة + layouts + بلا عائم.
 * تشغيل: node --import tsx src/lib/__tests__/knowledge-experience-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.ok(existsSync(resolve(root, "src/styles/knowledge-experience.css")));
const css = read("src/styles/knowledge-experience.css");
const main = read("src/main.tsx");
const blocks = read("src/components/knowledge/KnowledgeBlocks.tsx");
const layout = read("src/components/knowledge/KnowledgeLayout.tsx");
const index = read("src/components/knowledge/index.ts");
const fab = read("src/components/FloatingBackButton.tsx");
const fiqh = read("src/pages/fiqh/ui/FiqhLessonView.tsx");
const filters = read("src/components/filters/UnifiedPrimaryFilters.tsx");
const rsc = read("src/components/content/ReadingSectionCard.tsx");

assert.match(layout, /knowledge-experience\.css/, "KnowledgeLayout يحمّل CSS المعرفة");
assert.ok(
  /knowledge-experience\.css/.test(main) || /knowledge-experience\.css/.test(layout) || /knowledge-experience\.css/.test(index),
  "knowledge-experience.css محمّل",
);

const blockKinds = [
  "definition", "outcomes", "evidence", "sources", "warning", "notes",
  "faq", "timeline", "concepts", "related", "summary", "ruling",
] as const;

for (const kind of blockKinds) {
  assert.match(css, new RegExp(`kx-block--${kind}`), `نمط كتلة ${kind}`);
}

for (const name of [
  "DefinitionBlock", "LearningOutcomesBlock", "EvidenceBlock", "SourceReferencesBlock", "KnowledgeNotesBlock", "WarningNoticeBlock", "FaqSectionBlock", "TimelineBlock", "KeyConceptsBlock", "RelatedTopicsBlock", "SummaryBlock", "RulingBlock",
]) {
  assert.match(blocks, new RegExp(name));
  assert.match(index, new RegExp(name));
}

for (const L of ["reader", "knowledge", "library", "timeline", "hadith", "fiqh", "biography"]) {
  assert.match(layout, new RegExp(`"${L}"`));
  assert.match(css, new RegExp(`kx-layout--${L}`));
}

assert.match(layout, /KnowledgeHero/);
assert.match(layout, /KnowledgeLibraryCard/);
assert.match(css, /kx-library-card/);
assert.match(css, /kx-hero--hadith/);
assert.match(index, /KnowledgeLayout/);

assert.match(fab, /return null/, "السهم العائم ملغى");
assert.match(fab, /FLOATING_BACK_DISABLED/);

assert.match(fiqh, /data-kx-kind/, "درس الفقه يميّز أنواع الأقسام");
assert.match(fiqh, /AppBackButton/, "درس الفقه برجوع مضمّن");
assert.match(fiqh, /kx-layout--fiqh|KnowledgeLayout[\s\S]*kind="fiqh"/);

const hadith = read("src/pages/hadith/ui/HadithView.tsx");
assert.match(hadith, /UnifiedPrimaryFilters/, "فلاتر الحديث الموحّدة");
assert.match(hadith, /KnowledgeLayout/, "تخطيط الحديث");
assert.match(hadith, /kind="hadith"/);

const tawhid = read("src/views/TawhidPage.tsx");
assert.match(tawhid, /KnowledgeLibraryCard/, "بطاقات مكتبة العقيدة");
assert.match(tawhid, /KnowledgeLayout/, "تخطيط العقيدة");

const seerah = read("src/views/SeerahPage.tsx");
assert.match(seerah, /KnowledgeLayout/, "تخطيط السيرة");
assert.match(seerah, /kind="biography"/);
assert.match(seerah, /WarningNoticeBlock|SourceReferencesBlock|RelatedTopicsBlock/, "كتل معرفة في السيرة");

const miracles = read("src/views/MiraclesPage.tsx");
assert.match(miracles, /KnowledgeLayout/, "تخطيط الإعجاز");
assert.match(miracles, /kind="library"/);
assert.match(miracles, /kind="reader"/);

const ulum = read("src/pages/quran/ui/UlumQuranView.tsx");
assert.match(ulum, /KnowledgeLayout/, "تخطيط علوم القرآن");
assert.match(ulum, /kind="knowledge"/);
assert.match(ulum, /data-kx-kind/, "علوم القرآن تميّز أنواع الكتل");

const fiqhHub = read("src/pages/fiqh/ui/FiqhView.tsx");
assert.match(fiqhHub, /KnowledgeLayout/, "تخطيط الفقه");
assert.match(fiqhHub, /kind="fiqh"/);
assert.match(fiqhHub, /UnifiedPrimaryFilters/, "فلاتر الفقه الموحّدة");

const tarikhHub = read("src/views/TarikhIslamiPage.tsx");
assert.match(tarikhHub, /KnowledgeLayout/, "تخطيط التاريخ");
assert.match(tarikhHub, /kind="timeline"/);

const tarikh = read("src/views/TarikhIslamiDetailPage.tsx");
assert.match(tarikh, /kind="timeline"/);
assert.match(tarikh, /variant="notes"/);

assert.match(filters, /UnifiedPrimaryFilters/);
assert.match(filters, /onOpenMore/);
assert.match(css, /kx-filter-row/);

assert.match(rsc, /"warning"/);
assert.match(rsc, /"outcomes"/);
assert.match(rsc, /"ruling"/);
assert.match(rsc, /data-kx-block/);

const polish = read("src/styles/sections-calm-polish.css");
assert.match(polish, /display:\s*none\s*!important/, "إخفاء السهم العائم في CSS الحرج");


const hadithScience = read("src/pages/hadith/ui/HadithScienceView.tsx");
assert.match(hadithScience, /KnowledgeLayout/, "علوم الحديث بتخطيط معرفة");
assert.match(hadithScience, /UnifiedPrimaryFilters/, "فلاتر مصطلح الحديث الموحّدة");
assert.match(hadithScience, /kind="hadith"/);

const hadithClassGuide = read("src/pages/hadith/ui/HadithClassGuide.tsx");
assert.match(hadithClassGuide, /KnowledgeLayout/, "دليل أصناف الحديث");

const hadithBooks = read("src/pages/hadith/ui/HadithBooksView.tsx");
assert.match(hadithBooks, /KnowledgeLayout/, "كتب الحديث");

const arbaeen = read("src/pages/hadith/ui/ArbaeenNawawiView.tsx");
assert.match(arbaeen, /KnowledgeLayout/, "الأربعون النووية");

const fiqhBook = read("src/pages/fiqh/ui/FiqhBookView.tsx");
assert.match(fiqhBook, /KnowledgeLayout/, "كتاب الفقه");

const fiqhChapter = read("src/pages/fiqh/ui/FiqhChapterView.tsx");
assert.match(fiqhChapter, /KnowledgeLayout/, "باب الفقه");

const fiqhUsul = read("src/pages/fiqh/ui/FiqhUsulView.tsx");
assert.match(fiqhUsul, /KnowledgeLayout/, "أصول الفقه");
assert.match(fiqhUsul, /data-kx-kind/, "أصول الفقه بأنواع كتل");

const fiqhQawaid = read("src/pages/fiqh/ui/FiqhQawaidView.tsx");
assert.match(fiqhQawaid, /KnowledgeLayout/, "القواعد الفقهية");
assert.match(fiqhQawaid, /data-kx-kind/, "القواعد بأنواع كتل");

console.log("knowledge-experience-gate.test.ts: ok");
