import assert from "node:assert/strict";
import { formatLessonAppointmentLine } from "../lesson-time";

const line = formatLessonAppointmentLine({
  day: "الأحد",
  time: "بعد صلاة العصر",
  gregorianDate: "الأحد، 9 أغسطس 2026",
  hijriDate: "15 صفر 1448 هـ",
});
assert.match(line, /أغسطس 2026/);
assert.match(line, /صفر/);
assert.match(line, /توقيت الكويت/);
assert.doesNotMatch(line, /\d{1,2}\/\d{1,2}/, "لا صيغة مختصرة ملتبسة");

const uncertain = formatLessonAppointmentLine({ uncertain: true });
assert.equal(uncertain, "موعد غير مؤكد");

console.log("format-lesson-appointment.test.ts: ok");
