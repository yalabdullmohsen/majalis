#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const card = await readFile(resolve(root, "src/components/lessons/UnifiedLessonCard.tsx"), "utf8");
const lessonsPage = await readFile(resolve(root, "src/pages/lessons/ui/LessonsView.tsx"), "utf8");
const homeLessons = await readFile(resolve(root, "src/components/home/HomeUpcomingLessons.tsx"), "utf8");
const homeCourses = await readFile(resolve(root, "src/components/home/HomeUpcomingCourses.tsx"), "utf8");
const detailPage = await readFile(resolve(root, "src/pages/lessons/ui/LessonDetailView.tsx"), "utf8");

const failures = [];
if (/<img\b|SheikhAvatar|lessonImage|posterUrl|qrCodeUrl|__poster|__media|__qr|__top/.test(card)) {
  failures.push("UnifiedLessonCard must not contain an image or an image slot");
}
for (const [name, source, pattern] of [
  ["LessonsPage", lessonsPage, /CompactLessonRow|UnifiedLessonCard/],
  ["HomeUpcomingLessons", homeLessons, /UnifiedLessonCard/],
  ["HomeUpcomingCourses", homeCourses, /UnifiedLessonCard/],
]) {
  if (!pattern.test(source)) failures.push(`${name} must use compact or unified lesson card`);
}
if (!/lesson\.image_url|lesson\.poster_image_url/.test(detailPage)) {
  failures.push("LessonDetailPage must retain lesson content imagery");
}

if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  process.exit(1);
}
console.log("✓ lesson lists use poster-free cards while detail content imagery remains available");
