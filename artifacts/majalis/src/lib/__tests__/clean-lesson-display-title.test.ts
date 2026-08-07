/**
 * بند 35 — العنوان المعروض نظيف؛ الموعد/الجلسة خارج العنوان.
 */
import assert from "node:assert/strict";
import { cleanLessonDisplayTitle } from "../kuwait-lessons";

assert.equal(
  cleanLessonDisplayTitle("دورة الشيخ الأجراح العلمية — الثالثة"),
  "دورة الشيخ الأجراح العلمية — الثالثة",
  "جزء من العنوان الأصلي يبقى",
);

assert.equal(
  cleanLessonDisplayTitle("برنامج شرعي مبسط — المستوى الرابع", [
    "المستوى الرابع",
  ]),
  "برنامج شرعي مبسط",
  "لاحق مطابق لـ linked_titles يُزال",
);

assert.equal(
  cleanLessonDisplayTitle("مجلس أسبوعي — السبت بعد العصر"),
  "مجلس أسبوعي",
  "لاحق يوم/وقت يُزال",
);

assert.equal(
  cleanLessonDisplayTitle("تفسير جامع البيان — الطبري"),
  "تفسير جامع البيان — الطبري",
  "لاحق علمي غير جدولي يبقى",
);

console.log("clean-lesson-display-title.test.ts: ok");
