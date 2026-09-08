#!/usr/bin/env node
/**
 * بوابة: بطاقات وقائمة وتفاصيل الدروس/الدورات بلا صور غلاف أو صور محاضر.
 * تشغيل: node scripts/test-lesson-card-posters.mjs
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const card = await readFile(resolve(root, "src/components/lessons/UnifiedLessonCard.tsx"), "utf8");
const lessonsPage = await readFile(resolve(root, "src/pages/lessons/ui/LessonsView.tsx"), "utf8");
const homeLessons = await readFile(resolve(root, "src/components/home/HomeUpcomingLessons.tsx"), "utf8");
const homeCourses = await readFile(resolve(root, "src/components/home/HomeUpcomingCourses.tsx"), "utf8");
const detailPage = await readFile(resolve(root, "src/pages/lessons/ui/LessonDetailView.tsx"), "utf8");
const teachers = await readFile(resolve(root, "src/pages/lessons/TeachersIndexPage.tsx"), "utf8");

const IMAGE_MARKERS =
  /<img\b|OptimizedImage|OptimizedSheikhImage|SheikhAvatar|lesson-detail-poster|lessonImage|posterUrl|poster_image_url|qrCodeUrl|__poster|__media|__qr|__top/;

const failures = [];
if (IMAGE_MARKERS.test(card)) {
  failures.push("UnifiedLessonCard must not contain an image or an image slot");
}
if (IMAGE_MARKERS.test(detailPage)) {
  failures.push("LessonDetailView must not render lesson/course posters, sheikh photos, or QR images");
}
if (/<img\b|photoUrl|tch-card__photo/.test(teachers)) {
  failures.push("TeachersIndexPage must not show teacher photos in lesson context");
}
for (const [name, source, pattern] of [
  ["LessonsPage", lessonsPage, /CompactLessonRow|UnifiedLessonCard/],
  ["HomeUpcomingLessons", homeLessons, /UnifiedLessonCard/],
  ["HomeUpcomingCourses", homeCourses, /UnifiedLessonCard/],
]) {
  if (!pattern.test(source)) failures.push(`${name} must use compact or unified lesson card`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  process.exit(1);
}
console.log("✓ lesson/course UI is poster-free (cards + detail + teachers index)");
