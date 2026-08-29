import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const app = readFileSync(resolve(root, "App.tsx"), "utf8") + "\n" + readFileSync(resolve(root, "AppRoutes.tsx"), "utf8");
const archivePage = readFileSync(resolve(root, "pages/lessons/LessonsArchivePage.tsx"), "utf8");
const lessonsPage = readFileSync(resolve(root, "pages/lessons/ui/LessonsView.tsx"), "utf8");

assert.match(app, /path="\/lessons\/archive"/, "مسار الأرشيف مسجّل");
const archiveIdx = app.indexOf('path="/lessons/archive"');
const detailIdx = app.indexOf('path="/lessons/:id"');
assert.ok(archiveIdx > 0 && archiveIdx < detailIdx, "الأرشيف قبل :id حتى لا يُلتقط كمعرّف");
assert.match(archivePage, /getUnifiedLessonsSplit/, "الأرشيف يحمّل التقسيم الموحّد");
assert.match(lessonsPage, /\/lessons\/archive/, "صفحة الدروس تربط بالأرشيف");
assert.doesNotMatch(lessonsPage, /renderGrid\(filteredArchived/, "لا شبكة مؤرشفة مضمّنة في /lessons");
console.log("lessons-archive-route.test.ts: ok");
