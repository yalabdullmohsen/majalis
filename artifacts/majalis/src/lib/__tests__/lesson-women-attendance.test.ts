/**
 * تصنيف حضور النساء + فلاتر الدروس — بلا تخمين
 * تشغيل: node --import tsx src/lib/__tests__/lesson-women-attendance.test.ts
 */
import assert from "node:assert/strict";
import {
  classifyWomenAttendance,
  isMenOnlyVenue,
  isWomenFriendlyLesson,
} from "../lesson-women-attendance";
import { mapLessonRow, type KuwaitLessonRecord } from "../kuwait-lessons";

console.log("=== explicit women place ===");
const explicit = classifyWomenAttendance(
  "درس فقه بعد العصر. يوجد مكان للنساء — للاستفسار 99999999",
);
assert.equal(explicit.womenAttendance, "متاح");
assert.match(explicit.womenAttendanceNote || "", /يوجد مكان للنساء/u);

const bothGenders = classifyWomenAttendance("مجلس علمي للرجال والنساء في المسجد");
assert.equal(bothGenders.womenAttendance, "متاح");

console.log("=== diwan without explicit women text ===");
const diwan = classifyWomenAttendance({
  title: "شرح كتاب التوحيد",
  mosque: "ديوان فلان الفلاني",
  description: "بعد المغرب",
});
assert.equal(diwan.womenAttendance, "men_only");
assert.equal(isMenOnlyVenue("ديوان فلان"), true);

const diwanWithWomen = classifyWomenAttendance({
  mosque: "ديوان فلان",
  description: "يوجد مصلى نساء",
});
assert.equal(diwanWithWomen.womenAttendance, "متاح");

console.log("=== no women mention — no guessing from keyword «نساء» ===");
const noGuess = classifyWomenAttendance({
  title: "حلقة تحفيظ",
  description: "حضوري في المسجد — درس أسبوعي",
  keywords: ["نساء"],
});
assert.equal(noGuess.womenAttendance, "men_only");

const womenOnlyLabel = classifyWomenAttendance("حلقة للنساء فقط");
assert.equal(womenOnlyLabel.womenAttendance, "men_only");

console.log("=== mapLessonRow integration ===");
const rowExplicit = mapLessonRow({
  id: "test-1",
  title: "تفسير",
  speaker_name: "فلان",
  mosque: "مسجد X",
  day_of_week: "السبت",
  lesson_time: "8:00 م",
  description: "يوجد قسم مخصص للنساء",
  category: "تفسير",
  city: "العاصمة",
});
assert.equal(rowExplicit.womenAttendance, "متاح");
assert.equal(rowExplicit.hasWomenSection, true);

const rowDiwan = mapLessonRow({
  id: "test-2",
  title: "درس عقيدة",
  speaker_name: "فلان",
  mosque: "ديوانية أهل العلم",
  day_of_week: "الأحد",
  lesson_time: "9:00 م",
  description: "بعد العشاء",
  category: "عقيدة",
  city: "العاصمة",
});
assert.equal(rowDiwan.womenAttendance, "men_only");
assert.equal(rowDiwan.hasWomenSection, false);

const rowSilent = mapLessonRow({
  id: "test-3",
  title: "شرح حديث",
  speaker_name: "فلان",
  mosque: "مسجد Y",
  day_of_week: "الاثنين",
  lesson_time: "7:30 م",
  category: "حديث",
  city: "حولي",
});
assert.equal(rowSilent.womenAttendance, "men_only");

console.log("=== tab filters ===");
const lessons: KuwaitLessonRecord[] = [rowExplicit, rowDiwan, rowSilent];
const womenTab = lessons.filter((l) => isWomenFriendlyLesson(l));
const menTab = lessons.filter((l) => !isWomenFriendlyLesson(l));
assert.equal(womenTab.length, 1);
assert.equal(womenTab[0]?.id, "test-1");
assert.equal(menTab.length, 2);

console.log("lesson-women-attendance.test.ts: ok");
