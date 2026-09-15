/**
 * قفل سلوك إزالة تكرار الدروس — يمنع عودة تضاعف نفس الجلسة باختلاف صياغة المكان.
 * Run: node --import tsx src/lib/__tests__/lesson-deduper.test.ts
 */
import assert from "node:assert/strict";
import {
  buildLessonDedupeKey,
  dedupeLessons,
  findDuplicateClusters,
} from "../lessons/lessonDeduper.ts";
import type { KuwaitLessonRecord } from "../kuwait-lessons.ts";

function stub(partial: Partial<KuwaitLessonRecord> & Pick<KuwaitLessonRecord, "id" | "title" | "sheikhName">): KuwaitLessonRecord {
  return {
    governorate: "الفروانية",
    region: "عبدالله المبارك",
    mosque: "",
    day: "الأحد",
    time: "9:00 م",
    category: "عقيدة",
    sortKey: 0,
    nextOccurrenceMs: 0,
    activityType: "درس",
    source: "seed",
    ...partial,
  } as KuwaitLessonRecord;
}

const a = stub({
  id: "kw-salem-altaweel-tawheed-bukhari-0",
  title: "شرح كتاب التوحيد من صحيح البخاري",
  sheikhName: "سالم بن سعد الطويل",
  mosque: "ديوان أحمد غربي الشمري",
  gregorianDate: "2026-09-20",
});
const b = stub({
  id: "sci-tawheed-saltaweel",
  title: "شرح كتاب التوحيد من صحيح البخاري",
  sheikhName: "الشيخ: سالم بن سعد الطويل",
  mosque: "ديوان: أحمد غربي الرمالي الشمري (أبو عبدالعزيز)",
  gregorianDate: "2026-09-20",
});

assert.equal(
  buildLessonDedupeKey(a),
  buildLessonDedupeKey(b),
  "اختلاف صياغة الديوان يجب ألا يغيّر مفتاح التكرار",
);

const deduped = dedupeLessons([a, b]);
assert.equal(deduped.length, 1);
assert.equal(deduped[0]?.id, "kw-salem-altaweel-tawheed-bukhari-0");

const clusters = findDuplicateClusters([a, b]);
assert.equal(clusters.length, 1);
assert.equal(clusters[0]?.lessons.length, 2);

console.log("lesson-deduper: ok");
