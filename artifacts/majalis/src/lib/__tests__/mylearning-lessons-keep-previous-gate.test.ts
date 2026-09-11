/**
 * بوابة: تعلّمي + تفاصيل الدرس + قائمة الدروس + الحديث — keep-previous بلا وميض فراغ.
 * node --import tsx src/lib/__tests__/mylearning-lessons-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const myLearning = read("src/pages/lessons/ui/MyLearningView.tsx");
assert.doesNotMatch(
  myLearning,
  /\.catch\(\(\)\s*=>\s*\{[^}]*setCertificates\(\[\]\)/s,
  "MyLearning: لا تفرّغ الشهادات عند الخطأ",
);
assert.doesNotMatch(
  myLearning,
  /\.catch\(\(\)\s*=>\s*\{[^}]*setLibrary\(\[\]\)/s,
  "MyLearning: لا تفرّغ المكتبة عند الخطأ",
);
assert.match(
  myLearning,
  /resumeLoading\s*&&\s*resumeItems\.length\s*===\s*0/,
  "MyLearning: هيكل الاستئناف فقط بلا عناصر سابقة",
);
assert.match(myLearning, /aria-busy=\{loading\s*\|\|\s*resumeLoading\}/, "MyLearning: aria-busy");
assert.match(
  myLearning,
  /loading\s*&&\s*library\.length\s*===\s*0/,
  "MyLearning: هيكل المكتبة فقط بلا عناصر",
);

const detail = read("src/pages/lessons/ui/LessonDetailView.tsx");
assert.doesNotMatch(
  detail,
  /\.catch\(\(\)\s*=>\s*\{[^}]*setSimilar\(\[\]\)/s,
  "LessonDetail: لا تفرّغ الروابط عند الخطأ",
);
assert.match(detail, /loading\s*&&\s*!lesson/, "LessonDetail: هيكل فقط بلا درس سابق");
assert.match(detail, /aria-busy=\{loading\}/, "LessonDetail: aria-busy");

const lessons = read("src/pages/lessons/ui/LessonsView.tsx");
assert.match(lessons, /أبقِ الدروس السابقة/, "LessonsView: تعليق keep-previous عند الخطأ");
assert.match(lessons, /aria-busy=\{loading\}/, "LessonsView: aria-busy");

const hadith = read("src/pages/hadith/ui/HadithView.tsx");
assert.match(hadith, /أبقِ القائمة السابقة/, "HadithView: keep-previous عند الخطأ");
assert.match(hadith, /loading\s*&&\s*displayItems\.length\s*===\s*0/, "HadithView: هيكل فقط بلا عناصر");
assert.match(hadith, /aria-busy=\{loading\}/, "HadithView: aria-busy");

console.log("mylearning-lessons-keep-previous-gate.test.ts: ok");
