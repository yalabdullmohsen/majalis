/**
 * بوابة b067: توسيع رهن/حوالة/وكالة بفهرس كلاسيكي + تنظيف بقايا «مكتبة» العلنية.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b067-muamalat-fihris-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFiqhDoorSummaries } from "../fiqh/fiqhNormalize";
import { getAllFiqhBooks, listPublishedLessons } from "../fiqh-books";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const TARGET_BOOKS = ["rahn", "hawala", "wakala"] as const;
const NEW_IDS = [
  "rahn-shurut-fihris",
  "rahn-radd-fihris",
  "hawala-athar-fihris",
  "hawala-baraa-fihris",
  "wakala-ma-tasih-fihris",
  "wakala-tasarruf-fihris",
] as const;

for (const id of TARGET_BOOKS) {
  const book = getAllFiqhBooks().find((b) => b.id === id);
  assert.ok(book, `كتاب ${id}`);
  assert.ok(book!.chapters.length >= 4, `${id}: ≥4 أبواب (الآن ${book!.chapters.length})`);
  const lessons = book!.chapters.reduce((n, c) => n + c.lessons.length, 0);
  assert.ok(lessons >= 4, `${id}: ≥4 مسائل (الآن ${lessons})`);
}

const muamalat = buildFiqhDoorSummaries().find((d) => d.id === "muamalat");
assert.ok(muamalat, "باب المعاملات");
assert.ok(muamalat!.issueCount >= 24, `المعاملات ≥24 (الآن ${muamalat!.issueCount})`);

const byId = new Map(listPublishedLessons().map((h) => [h.lesson.id, h.lesson]));
for (const id of NEW_IDS) {
  const lesson = byId.get(id);
  assert.ok(lesson, `درس ${id}`);
  assert.equal(lesson!.status, "published", `${id}: منشور`);
  assert.match(lesson!.summary, /فهرس هيكلي/, `${id}: ملخص فهرسي`);
  assert.match(lesson!.evidence, /إحالة فهرسية/, `${id}: دليل إحالة`);
  assert.match(lesson!.preferred, /لا راجح محرَّر/, `${id}: بلا راجح مخترع`);
  assert.doesNotMatch(lesson!.summary, /مدخل إلى|يتناول هذا المبحث/, `${id}: بلا stub`);
  assert.ok((lesson!.sources?.length || 0) >= 2, `${id}: مصادر ≥2`);
}

const scrubTargets: Array<[string, RegExp]> = [
  ["src/lib/mind-maps-data.ts", /الدروس والمصادر/],
  ["src/lib/seo-routes.json", /مجموعة أحاديث مرتبة/],
  ["src/lib/seo-routes.json", /فهرس أكاديمي متخصص/],
  ["src/views/AcademicResearchPage.tsx", /فهرس أكاديمي متخصص/],
  ["src/views/admin/SettingsSection.tsx", /الدروس وفهرس المصادر/],
];

for (const [rel, re] of scrubTargets) {
  const src = readFileSync(resolve(appRoot, rel), "utf8");
  assert.match(src, re, `${rel}: تنظيف صياغة المكتبة`);
}

assert.doesNotMatch(
  readFileSync(resolve(appRoot, "src/lib/mind-maps-data.ts"), "utf8"),
  /الدروس والمكتبة/,
  "mind-maps بلا فئة المكتبة",
);
assert.doesNotMatch(
  readFileSync(resolve(appRoot, "src/views/AcademicResearchPage.tsx"), "utf8"),
  /مكتبة أكاديمية/,
  "AcademicResearch بلا مكتبة أكاديمية",
);

console.log("content-audit-b067-muamalat-fihris-gate: ok");
