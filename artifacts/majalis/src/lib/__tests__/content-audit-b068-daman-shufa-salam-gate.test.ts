/**
 * بوابة b068: توسيع ضمان/شفعة/سلم بفهرس كلاسيكي + تحويل روابط العلماء للبحث.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b068-daman-shufa-salam-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFiqhDoorSummaries } from "../fiqh/fiqhNormalize";
import { getAllFiqhBooks, listPublishedLessons } from "../fiqh-books";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const TARGET_BOOKS = ["daman", "shufa", "salam"] as const;
const NEW_IDS = [
  "daman-shurut-fihris",
  "daman-ma-yasih-fihris",
  "shufa-man-tathbut-fihris",
  "shufa-talab-fihris",
  "salam-shurut-fihris",
  "salam-qabd-fihris",
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
assert.ok(muamalat!.issueCount >= 28, `المعاملات ≥28 (الآن ${muamalat!.issueCount})`);

const buyu = buildFiqhDoorSummaries().find((d) => d.id === "buyu");
assert.ok(buyu, "باب البيوع");
assert.ok(buyu!.issueCount >= 10, `البيوع ≥10 (الآن ${buyu!.issueCount})`);

const byId = new Map(listPublishedLessons().map((h) => [h.lesson.id, h.lesson]));
for (const id of NEW_IDS) {
  const lesson = byId.get(id);
  assert.ok(lesson, `درس ${id}`);
  assert.equal(lesson!.status, "published", `${id}: منشور`);
  assert.match(lesson!.summary, /فهرس هيكلي/, `${id}: ملخص فهرسي`);
  assert.match(lesson!.evidence, /إحالة فهرسية/, `${id}: دليل إحالة`);
  assert.match(lesson!.preferred, /بطاقة فهرس|لا راجح محرَّر/, `${id}: بلا راجح مخترع`);
  assert.doesNotMatch(lesson!.summary, /مدخل إلى|يتناول هذا المبحث/, `${id}: بلا stub`);
  assert.ok((lesson!.sources?.length || 0) >= 2, `${id}: مصادر ≥2`);
}

const scholarLinks = readFileSync(resolve(appRoot, "src/lib/scholar-library-links.ts"), "utf8");
assert.match(scholarLinks, /\/search\?q=\$\{encodeURIComponent/, "روابط العلماء → بحث");
assert.doesNotMatch(scholarLinks, /href:\s*`\/library\//, "scholar-library-links بلا /library/");

const updates = readFileSync(resolve(appRoot, "src/lib/updates-seed.ts"), "utf8");
assert.match(updates, /فهرس الأدعية الشرعية/, "تحديث الأدعية بلا مكتبة");
assert.doesNotMatch(updates, /مكتبة الأدعية/, "updates-seed بلا مكتبة الأدعية");

const stats = readFileSync(resolve(appRoot, "src/views/UserStatsPage.tsx"), "utf8");
assert.match(stats, /library:\s*"المراجع"/, "شارات المراجع بدل المكتبة");

console.log("content-audit-b068-daman-shufa-salam-gate: ok");
