/**
 * بوابة: دروس/دورات الرئيسية + بث حي + الخلاصة + المشايخ — keep-previous عند فشل إعادة الجلب.
 * node --import tsx src/lib/__tests__/home-teachers-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const lessons = read("src/components/home/HomeUpcomingLessons.tsx");
assert.doesNotMatch(lessons, /setAllLessons\(\[\]\)/, "UpcomingLessons: لا تفرّغ عند الخطأ");

const courses = read("src/components/home/HomeUpcomingCourses.tsx");
assert.doesNotMatch(courses, /setCourses\(\[\]\)/, "UpcomingCourses: لا تفرّغ عند الخطأ");

const live = read("src/components/home/HomeLiveNowBanner.tsx");
assert.doesNotMatch(live, /setItems\(\[\]\)/, "LiveNow: لا تفرّغ عند الخطأ");

const harvest = read("src/components/lessons/HarvestFeedPanel.tsx");
assert.doesNotMatch(harvest, /setItems\(\[\]\)/, "Harvest: لا تفرّغ عند الخطأ");

const teachers = read("src/pages/lessons/TeachersIndexPage.tsx");
assert.doesNotMatch(teachers, /setTeachers\(\[\]\)/, "TeachersIndex: لا تفرّغ عند الخطأ");
assert.match(teachers, /loading\s*&&\s*teachers\.length\s*===\s*0/, "TeachersIndex: هيكل فقط بلا عناصر");
assert.match(teachers, /aria-busy=\{loading\}/, "TeachersIndex: aria-busy");

const detail = read("src/pages/lessons/TeacherDetailPage.tsx");
assert.doesNotMatch(detail, /setLessons\(\[\]\)/, "TeacherDetail: لا تفرّغ عند الخطأ");
assert.match(detail, /loading\s*&&\s*lessons\.length\s*===\s*0/, "TeacherDetail: هيكل فقط بلا عناصر");
assert.match(detail, /aria-busy=\{loading\}/, "TeacherDetail: aria-busy");

console.log("home-teachers-keep-previous-gate.test.ts: ok");
