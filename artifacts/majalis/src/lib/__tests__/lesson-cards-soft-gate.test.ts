/**
 * بوابة: بطاقات الدروس على soft-card بلا ui-card/mj-card حي.
 * node --import tsx src/lib/__tests__/lesson-cards-soft-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const unified = readFileSync(resolve(root, "src/components/lessons/UnifiedLessonCard.tsx"), "utf8");
const detail = readFileSync(resolve(root, "src/pages/lessons/ui/LessonDetailView.tsx"), "utf8");
const list = readFileSync(resolve(root, "src/pages/lessons/ui/LessonsView.tsx"), "utf8");
const annual = readFileSync(resolve(root, "src/pages/lessons/ui/AnnualCourseDetailView.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/pages/lessons.css"), "utf8");
const mur = readFileSync(resolve(root, "src/styles/modern-ui-refresh.css"), "utf8");

assert.match(unified, /lesson-unified-card soft-card soft-card--on-light/, "UnifiedLessonCard على soft-card");
assert.doesNotMatch(unified, /\bui-card\b/, "UnifiedLessonCard بلا ui-card");
assert.doesNotMatch(unified, /\bmj-card\b/, "UnifiedLessonCard بلا mj-card");

assert.match(detail, /lesson-detail-card soft-card soft-card--on-light/, "تفاصيل الدرس على soft-card");
assert.doesNotMatch(detail, /\bui-card\b/, "LessonDetailView بلا ui-card");
assert.doesNotMatch(detail, /\bmj-card\b/, "LessonDetailView بلا mj-card");

assert.match(list, /lessons-v2-filters soft-card soft-card--on-light/, "فلاتر الدروس على soft-card");
assert.doesNotMatch(list, /lessons-v2-filters[^"]*\bui-card\b/, "فلاتر بلا ui-card");

assert.match(annual, /content-detail-section soft-card soft-card--on-light/, "مسار سنوي على soft-card");
assert.doesNotMatch(annual, /\bui-card\b/, "AnnualCourseDetailView بلا ui-card");

assert.match(css, /\.lesson-unified-card\.soft-card/, "CSS تخطيط مربوط بـ soft-card");
assert.doesNotMatch(mur, /\.lesson-unified-card\s*,/, "modern-ui-refresh لا يفرض سطحًا منفصلًا");

console.log("lesson-cards-soft-gate.test.ts: ok");
