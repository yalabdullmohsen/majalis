/**
 * فلتر الدروس: شريط بحواف ناعمة، أهداف لمس ≥44px، بلا قصّ نص.
 * تشغيل: node --import tsx src/lib/__tests__/lessons-filter-chips-layout.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const filtersCss = readFileSync(resolve(appRoot, "src/styles/components/filters.css"), "utf8");
const lessonsCss = readFileSync(resolve(appRoot, "src/styles/pages/lessons.css"), "utf8");
const unifyCss = readFileSync(resolve(appRoot, "src/styles/visual-identity-unify.css"), "utf8");
const chipsTsx = readFileSync(resolve(appRoot, "src/components/ui/FilterChips.tsx"), "utf8");
const lessonsView = readFileSync(resolve(appRoot, "src/pages/lessons/ui/LessonsView.tsx"), "utf8");

assert.equal(/exclusive-choice/.test(chipsTsx), false, "بلا exclusive-choice يفرض شكلًا متضاربًا");
assert.match(chipsTsx, /SegmentedFilter/, "FilterChips يغلف النظام الموحّد");
assert.match(filtersCss, /\.mj-filter-chip\s*\{[\s\S]*?min-height:\s*44px/);
assert.match(filtersCss, /\.mj-filter-chip\.is-active\s*\{[\s\S]*?color:\s*#fff/);
assert.match(filtersCss, /\.mj-filter-fields\s+select[\s\S]*?border-radius:\s*var\(--radius-control/);
assert.match(lessonsCss, /\.lessons-page-v3/);
assert.match(
  lessonsCss,
  /\.lessons-v3-sticky\s*\{[^}]*border-radius:\s*var\(--radius-card/,
  "شريط فلتر الدروس بحواف ناعمة",
);
assert.match(
  unifyCss,
  /\.lessons-v3-sticky[\s\S]{0,220}border-radius:\s*var\(--radius-card/,
  "توحيد الهوية يبقي حواف شريط الفلتر ناعمة",
);
assert.match(lessonsView, /"الكل"/);
assert.match(lessonsView, /SectionLobby/);
assert.match(lessonsView, /useDebouncedValue/);
assert.match(lessonsView, /دروس اليوم/);
const lessonFilters = readFileSync(resolve(appRoot, "src/components/lessons/LessonFilters.tsx"), "utf8");
assert.match(lessonFilters, /اليوم/);
assert.match(lessonFilters, /هذا الأسبوع/);
assert.match(lessonFilters, /حضوري/);
assert.match(lessonFilters, /عن بعد/);
assert.match(lessonFilters, /أرشيف/);
assert.match(lessonFilters, /isSameKuwaitDay/);
assert.match(lessonFilters, /isSameKuwaitWeek/);
assert.match(lessonFilters, /is-active/);
assert.doesNotMatch(lessonFilters, /filter-chips__chip--active/);
assert.match(lessonsView, /listLessons/);
assert.match(lessonsView, /UnifiedLessonCard/);
assert.doesNotMatch(lessonsView, /LessonScheduleGroup/);
assert.doesNotMatch(lessonsView, /components\/lessons\/LessonCard/);
assert.doesNotMatch(lessonsView, /components\/lessons\/LessonCourseCard/);
assert.match(lessonsCss, /clip-path:\s*none/, "عنوان صفحة الدروس ظاهر على الجوال");
assert.match(lessonsCss, /\.lessons-v2-section--first[\s\S]*?padding-block-start:\s*0/);
assert.match(lessonsCss, /min-height:\s*2rem/, "شريط الفلاتر مضغوط لا يستهلك نصف الشاشة");
assert.equal(/الأكثر تداولاً/.test(lessonsView), false, "بلا قسم مميز مزدحم للأكثر تداولاً");

console.log("lessons-filter-chips-layout.test.ts: ok");
