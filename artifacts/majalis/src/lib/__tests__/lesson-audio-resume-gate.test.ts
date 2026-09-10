/**
 * بوابة: استئناف تسجيل الدرس + مسح عند الخروج.
 * تشغيل: node --import tsx src/lib/__tests__/lesson-audio-resume-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const resume = readFileSync(resolve(root, "src/lib/lesson-audio-resume.ts"), "utf8");
const player = readFileSync(resolve(root, "src/components/lessons/LessonRecordingPlayer.tsx"), "utf8");
const audio = readFileSync(resolve(root, "src/lib/quran-audio-resume.ts"), "utf8");
const courses = readFileSync(resolve(root, "src/components/home/HomeUpcomingCourses.tsx"), "utf8");
const teachers = readFileSync(resolve(root, "src/pages/lessons/TeachersIndexPage.tsx"), "utf8");

assert.match(resume, /saveLessonAudioResume/);
assert.match(resume, /loadLessonAudioResume/);
assert.match(resume, /clearAllLessonAudioResume/);
assert.match(player, /loadLessonAudioResume/);
assert.match(player, /saveLessonAudioResume/);
assert.match(audio, /clearAudioResumeState/);
assert.match(courses, /beginAbortScope/);
assert.match(courses, /RequestManager\.cancel/);
assert.match(courses, /state=\{state\}/);
assert.doesNotMatch(courses, /return null/);
assert.match(teachers, /beginAbortScope/);
assert.match(teachers, /RequestManager\.cancel/);

console.log("lesson-audio-resume-gate.test.ts: ok");
