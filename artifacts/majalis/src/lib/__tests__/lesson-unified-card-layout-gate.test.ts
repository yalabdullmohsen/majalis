/**
 * بوابة: بطاقة الدرس الموحّدة حاوية صلبة بأزرار داخلها.
 * تشغيل: node --import tsx src/lib/__tests__/lesson-unified-card-layout-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const card = readFileSync(resolve(root, "src/components/lessons/UnifiedLessonCard.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/pages/lessons.css"), "utf8");
const m2030 = readFileSync(resolve(root, "src/styles/m2030/pages.css"), "utf8");
const detail = readFileSync(resolve(root, "src/pages/lessons/ui/LessonDetailView.tsx"), "utf8");

assert.match(card, /lesson-unified-card__facts/, "حقائق الدرس داخل البطاقة");
assert.match(card, /أضف للتقويم/, "زر التقويم داخل البطاقة");
assert.match(card, /FavoriteButton/, "زر الحفظ داخل البطاقة");
assert.match(card, /التفاصيل/, "زر التفاصيل داخل البطاقة");
assert.doesNotMatch(card, /showEmpty\s*=\s*true/, "لا تُعرض خلايا فارغة");
assert.match(css, /border-radius:\s*var\(--radius-card,\s*24px\)/, "حواف بطاقة 24px");
assert.match(css, /lesson-unified-card__facts/, "أنماط facts في lessons.css");
assert.match(css, /lesson-detail-actions-panel/, "لوحة أزرار التفاصيل");
assert.match(
  css,
  /padding-bottom:\s*calc\(\s*var\(--bottom-nav-height[^)]*\)\s*\+\s*var\(--inset-bottom/,
  "حجز القائمة السفلية",
);
assert.match(m2030, /\.lesson-unified-card\s*\{[\s\S]*padding:\s*0\s*!important/, "m2030 لا يكسر الحاوية");
assert.match(detail, /lesson-detail-actions-panel/, "أزرار التفاصيل داخل لوحة");
assert.match(detail, /UnifiedLessonCard/, "الدروس المقترحة عبر البطاقة الموحّدة");

console.log("lesson-unified-card-layout-gate.test.ts: ok");
