/**
 * مسارات المشايخ المعاصرين: /teachers و/teachers/:slug — منفصلة عن /scholars.
 * التشغيل: npx tsx src/lib/__tests__/teachers-routes.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hrefScholars, hrefTeachers } from "../content-href";
import {
  buildTeachersFromLessons,
  decodeTeacherSlug,
  findTeacherBySlug,
  sheikhNameToSlug,
  teacherSlugMatchesName,
} from "../teachers-index";
import type { KuwaitLessonRecord } from "../kuwait-lessons";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

function lessonStub(sheikhName: string, id: string): KuwaitLessonRecord {
  return {
    id,
    title: `درس ${id}`,
    sheikhName,
    governorate: "العاصمة",
    region: "الشرق",
    mosque: "مسجد",
    day: "الجمعة",
    time: "بعد المغرب",
    category: "عقيدة",
    sortKey: 1,
    nextOccurrenceMs: Date.now() + 86_400_000,
    activityType: "درس",
  };
}

assert.equal(hrefTeachers(), "/teachers");
assert.equal(hrefTeachers("سالم الطويل"), "/teachers/%D8%B3%D8%A7%D9%84%D9%85%20%D8%A7%D9%84%D8%B7%D9%88%D9%8A%D9%84");
assert.notEqual(hrefTeachers(), hrefScholars());
assert.notEqual(hrefTeachers("سالم الطويل"), hrefScholars("ibn-taymiyyah"));

assert.equal(sheikhNameToSlug("الشيخ: سالم الطويل"), encodeURIComponent("سالم الطويل"));
assert.equal(decodeTeacherSlug(encodeURIComponent("سالم الطويل")), "سالم الطويل");
assert.equal(teacherSlugMatchesName(encodeURIComponent("سالم الطويل"), "الشيخ سالم الطويل"), true);

const teachers = buildTeachersFromLessons([
  lessonStub("الشيخ: سالم الطويل", "a"),
  lessonStub("سالم الطويل", "b"),
  lessonStub("منصور الخالدي", "c"),
]);
assert.equal(teachers.length, 2, "اسم واحد بعد التطبيع");
assert.equal(findTeacherBySlug(teachers, sheikhNameToSlug("سالم الطويل"))?.lessonCount, 2);

const appSrc = readFileSync(resolve(appRoot, "src/App.tsx"), "utf8") + "\n" + readFileSync(resolve(appRoot, "src/AppRoutes.tsx"), "utf8");
assert.match(appSrc, /path="\/teachers\/:slug"/);
assert.match(appSrc, /path="\/teachers"/);
assert.match(appSrc, /TeachersIndexPage/);
assert.match(appSrc, /TeacherDetailPage/);
assert.equal(appSrc.includes('path="/teachers/:slug"><SafeLazyRoute component={IslamicScholarsPage}'), false);

const footer = readFileSync(resolve(appRoot, "src/lib/site-footer-nav.ts"), "utf8");
assert.match(footer, /href: "\/teachers"/);

console.log("teachers-routes.test.ts: ok");
