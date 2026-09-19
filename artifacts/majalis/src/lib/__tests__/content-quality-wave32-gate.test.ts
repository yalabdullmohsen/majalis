/**
 * Wave 32 — فراغات/أخطاء عامة عالية الاستخدام + SEO القصير (≥65 بلا auth/callback).
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave32-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const topic = read("src/components/topic/TopicPage.tsx");
assert.match(topic, /EMPTY\.data/);
assert.match(topic, /EMPTY\.offline/);
assert.match(topic, /STATUS\.loadError/);
assert.match(topic, /ACTION\.retry/);
assert.doesNotMatch(topic, /لا محتوى في هذا القسم حالياً/);
assert.doesNotMatch(topic, /أنت غير متصل بالإنترنت\. اتصل بالشبكة/);

const lazy = read("src/components/LazySectionAccordionPage.tsx");
assert.match(lazy, /STATUS\.loadError/);
assert.match(lazy, /STATUS\.contentLoading/);
assert.doesNotMatch(lazy, /تعذّر تحميل الفهرس/);

const schedule = read("src/components/lessons/LessonScheduleGroup.tsx");
assert.match(schedule, /EMPTY\.search/);
assert.doesNotMatch(schedule, /لا توجد دروس مطابقة/);

const qa = read("src/components/quiz-game/DirectQaCard.tsx");
assert.match(qa, /EMPTY\.generic/);
assert.doesNotMatch(qa, /تعذّر العثور على هذا السؤال/);

const map = read("src/components/landmarks/LandmarksMap.tsx");
assert.match(map, /EMPTY\.search/);
assert.match(map, /STATUS\.loadError/);
assert.match(map, /ACTION\.retry/);
assert.doesNotMatch(map, /تعذّر تحميل بلاط الخريطة/);

const assess = read("src/components/learning/AssessmentModal.tsx");
assert.match(assess, /STATUS\.loadError/);
assert.match(assess, /STATUS\.networkError/);
assert.match(assess, /EMPTY\.data/);
assert.doesNotMatch(assess, /تعذّر تحميل التقييم/);

const mushafSearch = read("src/features/mushaf-madinah/MushafSearchSheet.tsx");
assert.match(mushafSearch, /EMPTY\.searchShort/);
assert.match(mushafSearch, /STATUS\.loadError/);
assert.doesNotMatch(mushafSearch, /setError\("لا نتائج"\)/);

const dock = read("src/features/mushaf-madinah/MushafAudioDock.tsx");
assert.match(dock, /EMPTY\.searchShort/);
assert.doesNotMatch(dock, /لا نتائج — جرّب اسمًا آخر/);

const family = read("src/views/FamilyModePage.tsx");
assert.match(family, /EMPTY\.data/);
assert.doesNotMatch(family, /لا يوجد أبناء مرتبطون بعد/);

const homeLessons = read("src/components/home/HomeUpcomingLessons.tsx");
assert.match(homeLessons, /STATUS\.loadError/);
assert.doesNotMatch(homeLessons, /تعذّر تحميل دروس اليوم/);

const seo = JSON.parse(read("src/lib/seo-routes.json")) as {
  routes: Array<{ path: string; description?: string }>;
};
for (const r of seo.routes) {
  if (!r.description || (r.path || "").includes("/auth/")) continue;
  assert.ok(
    r.description.length >= 65,
    `${r.path} description too short (${r.description.length}): ${r.description}`,
  );
}
assert.match(read("src/lib/seo-routes.json"), /أذكار الصباح والمساء والنوم والسفر مع المصدر والحكم عند الحاجة — لورد يومي واضح/);
assert.match(read("src/lib/seo-routes.json"), /اختيار القرّاء والاستماع عبر مصحف المدينة برواية حفص عن عاصم في تجربة واحدة/);

console.log("content-quality-wave32-gate.test.ts: ok");
