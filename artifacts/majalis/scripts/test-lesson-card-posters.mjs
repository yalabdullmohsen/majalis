#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const card = await readFile(resolve(root, "src/components/lessons/UnifiedLessonCard.tsx"), "utf8");
const lessonsPage = await readFile(resolve(root, "src/views/LessonsPage.tsx"), "utf8");
const homeLessons = await readFile(resolve(root, "src/components/home/HomeUpcomingLessons.tsx"), "utf8");
const homeCourses = await readFile(resolve(root, "src/components/home/HomeUpcomingCourses.tsx"), "utf8");
const detailPage = await readFile(resolve(root, "src/views/LessonDetailPage.tsx"), "utf8");

const failures = [];
if (/lessonImage|posterUrl|__poster|__media/.test(card)) {
  failures.push("UnifiedLessonCard must not render lesson poster images");
}
for (const [name, source] of [
  ["LessonsPage", lessonsPage],
  ["HomeUpcomingLessons", homeLessons],
  ["HomeUpcomingCourses", homeCourses],
]) {
  if (!/UnifiedLessonCard/.test(source)) failures.push(`${name} must use UnifiedLessonCard`);
}
if (!/lesson\.image_url|lesson\.poster_image_url/.test(detailPage)) {
  failures.push("LessonDetailPage must retain lesson content imagery");
}

if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  process.exit(1);
}
console.log("✓ lesson lists use poster-free cards while detail content imagery remains available");
