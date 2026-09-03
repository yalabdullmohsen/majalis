/**
 * بوابة قالب القسم التسعة (مرجع العقيدة).
 * تفشل إن غاب عنصر أو اختلف الترتيب أو ظهر حقل بحث محلي في هب القسم.
 * تشغيل: node --import tsx src/lib/__tests__/section-template-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getSectionAccent, SECTIONS } from "@/config/sections.registry";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const ANATOMY_HERO = [
  "data-section-crumb",
  "data-section-hero",
  "data-section-eyebrow",
  "data-section-title",
  "data-section-sub",
  "data-section-quote",
] as const;

const ANATOMY_PAGE = ["data-section-group-title"] as const;

const HUB_PAGES: Array<[string, string]> = [
  ["الحديث", "src/pages/hadith/ui/HadithView.tsx"],
  ["القرآن وعلومه", "src/pages/quran/QuranKnowledgeHubPage.tsx"],
  ["التفسير", "src/pages/quran/ui/TafsirView.tsx"],
  ["التجويد", "src/pages/quran/ui/QuranTajweedView.tsx"],
  ["القراءات", "src/pages/quran/ui/QuranQiraatView.tsx"],
  ["علوم القرآن", "src/pages/quran/ui/UlumQuranView.tsx"],
  ["قصص القرآن", "src/pages/quran/ui/SurahStoriesView.tsx"],
  ["المذكورون في القرآن", "src/pages/quran/ui/QuranPeopleView.tsx"],
  ["السيرة", "src/views/SeerahPage.tsx"],
  ["الأمم السابقة", "src/views/NationsPage.tsx"],
  ["الرسائل", "src/views/AcademicResearchPage.tsx"],
  ["مفاهيم شرعية", "src/pages/account/ui/IslamicGlossaryView.tsx"],
  ["دليل الجامعات", "src/views/UniversitiesPage.tsx"],
  ["اكتشف الإسلام", "src/views/DiscoverIslamPage.tsx"],
];

const HUB_SLICE: Record<string, { start: string; end?: string }> = {
  "src/pages/hadith/ui/HadithView.tsx": { start: "export default function HadithPage" },
  "src/pages/quran/ui/QuranTajweedView.tsx": { start: "export default function QuranTajweedHubView" },
  "src/pages/quran/ui/SurahStoriesView.tsx": {
    start: "export default function SurahStoriesPage",
    end: "export function SurahStoryDetailPage",
  },
};

const TEMPLATE = /SectionTemplatePage|TopicPage|MergedSectionHubPage|SectionAccordionLayout|sectionRoute=/;
const LOCAL_SEARCH = /type=["']search["']/;

function hubSource(rel: string, src: string): string {
  const spec = HUB_SLICE[rel];
  if (!spec) return src;
  const i = src.indexOf(spec.start);
  if (i < 0) return src;
  const body = src.slice(i);
  if (!spec.end) return body;
  const j = body.indexOf(spec.end);
  return j >= 0 ? body.slice(0, j) : body;
}

console.log("=== تشريح TopicPage التسعة ===");
const topic = read("src/components/topic/TopicPage.tsx");
const sectionHero = read("src/components/topic/SectionHero.tsx");
let last = -1;
for (const marker of ANATOMY_HERO) {
  const idx = sectionHero.indexOf(marker);
  assert.ok(idx >= 0, `SectionHero يحتوي ${marker}`);
  assert.ok(idx > last, `ترتيب ${marker} بعد السابق`);
  last = idx;
}
for (const marker of ANATOMY_PAGE) {
  assert.ok(topic.includes(marker), `TopicPage يحتوي ${marker}`);
}
assert.match(topic, /data-section-template/);
assert.match(topic, /SectionHero/);
assert.match(topic, /getSectionAccent/);
assert.match(topic, /--section-accent/);
assert.doesNotMatch(topic, LOCAL_SEARCH);

const css = read("src/styles/components/topic-page.css");
assert.match(css, /overflow-x:\s*clip/);
assert.match(css, /--section-accent/);
assert.match(css, /padding:\s*max\(\s*1\.75rem,\s*28px\)|padding:\s*2(?:\.25|)\s*rem/);
assert.match(css, /background-color:\s*var\(--topic-hero-from\)/, "لافتة القسم بلون صلب لقياس التباين");
assert.match(css, /background-image:\s*linear-gradient/, "تدرّج فوق اللون الصلب");
assert.match(css, /border-inline-end/);
assert.doesNotMatch(css, /text-align:\s*(left|right)/);

const indexCss = read("src/index.css");
assert.match(indexCss, /overflow-x:\s*clip/);

const registry = read("src/config/sections.registry.ts");
assert.match(registry, /SECTION_GROUP_ACCENT/);
assert.match(registry, /getSectionAccent/);
assert.match(registry, /accent:/);
assert.ok(SECTIONS.every((s) => Boolean(s.accent)), "كل قسم في السجل له accent");
assert.equal(getSectionAccent("/hadith"), "#0E7A5F");
assert.equal(getSectionAccent("/tafsir"), "#2A7A6E");
assert.equal(getSectionAccent("/fiqh"), "#1F6B4A");
assert.equal(getSectionAccent("/fiqh/usul"), "#8B7A3A");

const chrome = read("src/config/section-template.ts");
assert.match(chrome, /sectionTemplateChrome/);
assert.match(chrome, /groupTitle/);

console.log("=== هبات الأقسام على القالب بلا بحث محلي ===");
for (const [label, rel] of HUB_PAGES) {
  const src = read(rel);
  const hub = hubSource(rel, src);
  assert.match(hub, TEMPLATE, `${label}: يستهلك قالب القسم`);
  assert.doesNotMatch(hub, LOCAL_SEARCH, `${label}: بلا type=search في الهب`);
  assert.doesNotMatch(hub, /hadith-hub-search/, `${label}: بلا محرك بحث ثانٍ`);
  assert.doesNotMatch(hub, /autoFocus/, `${label}: بلا autoFocus`);
}

{
  const tarikh = read("src/views/TarikhIslamiPage.tsx");
  assert.match(tarikh, /tarikh-hero/, "التاريخ: واجهة مخصصة");
  assert.match(tarikh, /SectionHero/, "التاريخ: يستعمل SectionHero");
  assert.match(tarikh, /ISLAMIC_HISTORY_ITEMS/, "التاريخ: بيانات موحدة");
  assert.match(tarikh, /type=["']search["']/, "التاريخ: بحث داخلي مقصود");
  assert.doesNotMatch(tarikh, /SectionAccordionLayout/, "التاريخ: بلا أكورديون قديم");
}

const prayer = read("src/pages/worship/ui/PrayerTimesView.tsx");
assert.doesNotMatch(prayer, /SectionTemplatePage/, "الصلاة مستثناة من قالب العقيدة");

{
  const library = read("src/pages/library/ui/LibraryView.tsx");
  assert.match(library, /library-hub--compact/, "المكتبة: واجهة وظيفية مدمجة");
  assert.match(library, /المكتبة العلمية/, "المكتبة: عنوان واضح");
  assert.match(library, /SearchField/, "المكتبة: حقل بحث داخلي");
  assert.doesNotMatch(library, /SectionTemplatePage|sectionRoute=/, "المكتبة: بلا لافتة قسم طويلة");
}

{
  const contrast = read("scripts/verify-color-contrast-gate.mjs");
  assert.match(contrast, /route: "\/hadith"[\s\S]*topic-page__title/, "تباين الحديث على لافتة القالب");
  assert.match(contrast, /route: "\/hadith"[\s\S]*hub-card__title/, "تباين بطاقات الحديث HubCard");
  assert.match(contrast, /route: "\/quran-knowledge"[\s\S]*topic-page__title/, "تباين علوم القرآن على لافتة القالب");
  assert.match(contrast, /route: "\/quran-knowledge"[\s\S]*hub-card__title/, "تباين بطاقات علوم القرآن HubCard");
  assert.doesNotMatch(
    contrast,
    /route: "\/hadith", selector: "\.page-hero-mj/,
    "لا محدّد بطل قديم على /hadith",
  );
  assert.doesNotMatch(
    contrast,
    /route: "\/quran-knowledge", selector: "\.section-lobby/,
    "لا محدّد لوبي قديم على /quran-knowledge",
  );
}

console.log("section-template-gate.test.ts: ok");
