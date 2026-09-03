/**
 * بوابة b070: إنزال الطوابير إلى المحتوى بعد تدقيق الوكيل بلا مراجعة بشرية معلّقة.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b070-queue-to-content-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT_CURRICULUM_ENABLED } from "../content-flags";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const repoRoot = resolve(appRoot, "../..");

assert.equal(CONTENT_CURRICULUM_ENABLED, true, "منهج الفقه منشور");

const flagsMjs = readFileSync(resolve(appRoot, "lib/content-flags.mjs"), "utf8");
assert.match(flagsMjs, /CONTENT_CURRICULUM_ENABLED = true/, "راية Node مطابقة");

const generator = readFileSync(
  resolve(appRoot, "scripts/generate-rulings-encyclopedia.mjs"),
  "utf8",
);
assert.match(
  generator,
  /content\/archive\/rulings-encyclopedia\/source\/curriculum-topics\.json/,
  "مولّد الأحكام يقرأ ملف المنهج الحي",
);

const topics = JSON.parse(
  readFileSync(
    resolve(appRoot, "content/archive/rulings-encyclopedia/source/curriculum-topics.json"),
    "utf8",
  ),
);
assert.equal(topics.length, 36, "36 موضوع منهج");
for (const t of topics) {
  assert.ok(t.summary?.trim().length >= 40, `${t.external_key}: ملخص`);
  assert.ok(
    (t.quran_evidence?.length || 0) + (t.sunnah_evidence?.length || 0) > 0,
    `${t.external_key}: دليل`,
  );
  assert.ok((t.references?.length || 0) >= 1, `${t.external_key}: مرجع`);
}

const seerah = readFileSync(resolve(appRoot, "src/views/SeerahPage.tsx"), "utf8");
assert.match(seerah, /بيعة العقبة الأولى/, "العقبة الأولى في السيرة");
assert.match(seerah, /غزوة تبوك/, "تبوك في السيرة");

const quiz = readFileSync(resolve(appRoot, "src/data/islamicQuizData.ts"), "utf8");
assert.doesNotMatch(quiz, /ذبح ابنه إسماعيل فاستسلم/, "المسابقة بلا جزم باسم الذبيح");

const closedQueues = [
  "docs/FIQH_REVIEW_QUEUE.md",
  "content/fiqh/FIQH_CONTENT_QUEUE.md",
  "docs/CONTENT_REVIEW_QUEUE.md",
  "docs/AHRUF_REVIEW_QUEUE.md",
];
for (const rel of closedQueues) {
  const src = readFileSync(resolve(appRoot, rel), "utf8");
  assert.doesNotMatch(src, /بانتظار تحرير بشري|لا يُدمَج قبل مراجعة المالك/, `${rel}: بلا انتظار بشري`);
  assert.doesNotMatch(src, /^- \[ \]/m, `${rel}: بلا بنود مفتوحة`);
}

const repoQueues = [
  "docs/curriculum-review-queue.md",
  "docs/reviews/SEERAH_REVIEW_QUEUE.md",
  "docs/reviews/PROPHET_TRIALS_REVIEW_QUEUE.md",
  "docs/reviews/PEOPLE_REVIEW_QUEUE.md",
];
for (const rel of repoQueues) {
  const src = readFileSync(resolve(repoRoot, rel), "utf8");
  assert.match(src, /b070|تدقيق الوكيل/, `${rel}: أُغلق بتدقيق الوكيل`);
  assert.doesNotMatch(src, /لا يُدمَج قبل مراجعة المالك/, `${rel}: بلا قفل المالك`);
}

console.log("content-audit-b070-queue-to-content-gate: ok");
