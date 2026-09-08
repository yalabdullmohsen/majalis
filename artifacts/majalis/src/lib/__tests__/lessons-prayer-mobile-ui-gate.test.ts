/**
 * بوابة جوال: فلاتر الدروس + حجز bottom-nav + تباين صفحة الصلاة.
 * تشغيل: node --import tsx src/lib/__tests__/lessons-prayer-mobile-ui-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const lessonsCss = read("src/styles/pages/lessons.css");
const filtersTsx = read("src/components/lessons/LessonFilters.tsx");
const cardTsx = read("src/components/lessons/UnifiedLessonCard.tsx");
const prayerCss = read("src/styles/pages/prayer-times.css");
const finalCss = read("src/styles/final-release.css");

assert.match(filtersTsx, /lesson-filters__chips/);
assert.match(filtersTsx, /الكل/);
assert.match(filtersTsx, /دروس/);
assert.match(filtersTsx, /دورات/);
assert.match(filtersTsx, /حضوري/);
assert.match(filtersTsx, /عن بعد/);
assert.match(filtersTsx, /اليوم/);
assert.match(filtersTsx, /أرشيف/);
/* الأدوات خارج صف الـchips القابل للتمرير */
const chipsOpen = filtersTsx.indexOf('className="lesson-filters__chips filter-chips"');
const chipsClose = filtersTsx.indexOf("</div>", chipsOpen);
assert.ok(chipsOpen >= 0 && chipsClose > chipsOpen, "صف chips موجود");
const chipsInner = filtersTsx.slice(chipsOpen, chipsClose);
assert.doesNotMatch(chipsInner, /searchSlot|filterSlot|hasTools/, "أدوات البحث خارج شريط الـchips");
assert.match(filtersTsx.slice(chipsClose), /lesson-filters__tools/, "tools بعد إغلاق صف chips");

assert.match(lessonsCss, /\.lesson-filters__chips\s*\{[\s\S]*?overflow-x:\s*auto/);
assert.match(lessonsCss, /\.lesson-filters__chips\s*\{[\s\S]*?flex-wrap:\s*nowrap/);
assert.match(lessonsCss, /\.lessons-page-v3\s*\{[\s\S]*?overflow-x:\s*clip/);
assert.match(
  lessonsCss,
  /\.lessons-page-v3\s*\{[\s\S]*?padding-bottom:\s*calc\(\s*var\(--bottom-nav-height/,
);
assert.match(cardTsx, /lesson-unified-card__actions-secondary/);
assert.match(cardTsx, /التفاصيل/);
assert.match(cardTsx, /التقويم/);

assert.match(prayerCss, /--pts-muted:\s*rgba\(250,\s*250,\s*248,\s*0\.9\)/);
assert.match(prayerCss, /--pts-card-bg:/);
assert.match(
  prayerCss,
  /\.pts-screen(?:\.pts-screen)?--with-nav[\s\S]*?padding-bottom:\s*calc\(\s*var\(--bottom-nav-height/,
);
assert.match(prayerCss, /\.pts-dock__item\s*\{[\s\S]*?min-height:\s*3rem/);
assert.match(prayerCss, /\.pts-ranks__num\s*\{[\s\S]*?color:\s*#F5E6C0/);
assert.match(prayerCss, /html\.pts-immersive\s+\.bottom-nav[\s\S]*?opacity:\s*1\s*!important/);
assert.match(prayerCss, /backdrop-filter:\s*none/);

assert.match(finalCss, /padding-bottom:\s*var\(--inset-bottom\)/);
assert.match(finalCss, /backdrop-filter:\s*none/);
assert.match(finalCss, /\.bottom-nav[\s\S]*?background-color:\s*var\(--surface-app/);

console.log("lessons-prayer-mobile-ui-gate.test.ts: ok");
