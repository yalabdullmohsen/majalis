/**
 * بوابة ترتيب الدروس: الأقرب أولًا + تمييز درس اليوم.
 * Run: node --import tsx src/lib/__tests__/lessons-nearest-first-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sortKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { prominenceClass } from "@/lib/unified-lesson-card";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

function baseLesson(
  partial: Partial<KuwaitLessonRecord> & Pick<KuwaitLessonRecord, "id" | "day" | "time">,
): KuwaitLessonRecord {
  return {
    title: partial.title ?? `درس ${partial.id}`,
    sheikhName: partial.sheikhName ?? "شيخ اختبار",
    mosque: partial.mosque ?? "مسجد الاختبار",
    governorate: partial.governorate ?? "العاصمة",
    category: partial.category ?? "تفسير",
    activityType: partial.activityType ?? "درس",
    region: partial.region ?? "الكويت",
    recurring: true,
    sortKey: partial.sortKey ?? 0,
    nextOccurrenceMs: partial.nextOccurrenceMs ?? 0,
    ...partial,
  } as KuwaitLessonRecord;
}

const now = new Date();
const weekdayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const todayName = weekdayNames[now.getDay()] ?? "الأحد";
const tomorrowName = weekdayNames[(now.getDay() + 1) % 7] ?? "الإثنين";
const farName = weekdayNames[(now.getDay() + 4) % 7] ?? "الخميس";

const sorted = sortKuwaitLessons([
  baseLesson({ id: "far", day: farName, time: "20:00", title: "بعيد" }),
  baseLesson({ id: "mid", day: tomorrowName, time: "16:00", title: "متوسط" }),
  baseLesson({ id: "nearish", day: todayName, time: "23:59", title: "اليوم أو أقرب دورة" }),
]);

assert.equal(sorted.length, 3, "ثلاثة دروس بعد الترتيب");
for (let i = 1; i < sorted.length; i++) {
  assert.ok(
    (sorted[i - 1]?.nextOccurrenceMs ?? 0) <= (sorted[i]?.nextOccurrenceMs ?? 0),
    `الترتيب تصاعدي حسب الأقرب: idx ${i - 1} <= ${i}`,
  );
}
assert.ok(
  (sorted[0]?.nextOccurrenceMs ?? Infinity) <= (sorted[2]?.nextOccurrenceMs ?? 0),
  "الأقرب أولًا والأبعد آخرًا",
);

const todayMs = Date.now();
assert.equal(prominenceClass(todayMs, false), "lesson-unified-card--today");
assert.equal(prominenceClass(todayMs + 48 * 60 * 60 * 1000, false), "");
assert.equal(prominenceClass(todayMs, true), "lesson-unified-card--archived");
{
  // «قريب» فقط إذا ليس نفس اليوم الكويتي وخلال 24 ساعة (مساءً→صباح الغد)
  const withinDay = todayMs + 20 * 60 * 60 * 1000;
  const cls = prominenceClass(withinDay, false);
  assert.ok(
    cls === "lesson-unified-card--soon" || cls === "lesson-unified-card--today",
    `خلال 20 ساعة: soon أو today حسب حدّ اليوم (الفعلي: ${cls})`,
  );
}

const card = read("src/components/lessons/UnifiedLessonCard.tsx");
assert.match(card, /lesson-unified-card--today/);
assert.match(card, /prominenceClass/);

const view = read("src/pages/lessons/ui/LessonsView.tsx");
assert.match(view, /sortKuwaitLessons/);

console.log("lessons-nearest-first-gate: ok");
