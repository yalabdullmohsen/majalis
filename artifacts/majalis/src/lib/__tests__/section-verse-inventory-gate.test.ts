/**
 * بوابة PR-1: جرد آيات مقدمات الأقسام + تحقق المصدر المحلي.
 * تشغيل: node --import tsx src/lib/__tests__/section-verse-inventory-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const inventoryPath = resolve(repoRoot, "docs/content-quality/section-verse-inventory.json");
const reviewPath = resolve(repoRoot, "docs/content-quality/SECTION_VERSE_REVIEW.md");
const scriptPath = resolve(majalisRoot, "scripts/inventory-section-verses.mjs");

assert.ok(existsSync(scriptPath), "سكربت الجرد موجود");

const run = spawnSync(
  process.execPath,
  ["--import", "tsx", scriptPath],
  { cwd: majalisRoot, encoding: "utf8" },
);
assert.equal(run.status, 0, `فشل الجرد: ${run.stderr || run.stdout}`);

assert.ok(existsSync(inventoryPath), "section-verse-inventory.json");
assert.ok(existsSync(reviewPath), "SECTION_VERSE_REVIEW.md");

const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
assert.equal(inventory.policy, "no_ai_rewrite_no_memory_correction");
assert.ok(inventory.ayahCount >= 20, "جرد يغطي عشرات المواضع القرآنية في ROUTE_QUOTE");
assert.ok(Array.isArray(inventory.rows), "rows");

const ayahs = inventory.rows.filter((r) => r.type === "ayah");
assert.equal(ayahs.length, inventory.ayahCount);

for (const row of ayahs) {
  assert.ok(row.route, "route");
  assert.ok(row.sectionId, "sectionId");
  assert.ok(row.textIntegrityStatus, "textIntegrityStatus");
  assert.ok(row.finalDecision, "finalDecision");
  assert.ok(
    ["VERIFIED_EXACT", "TEXT_MISMATCH", "INVALID_REFERENCE"].includes(row.textIntegrityStatus),
    `حالة نزاهة معروفة: ${row.route} → ${row.textIntegrityStatus}`,
  );
  if (row.textIntegrityStatus === "TEXT_MISMATCH") {
    assert.equal(row.releaseBlocker, true, `TEXT_MISMATCH يجب أن يكون blocker: ${row.route}`);
  }
}

const quiz = ayahs.find((r) => r.route === "/quiz");
assert.ok(quiz, "/quiz في الجرد");
assert.equal(quiz.finalDecision, "REMOVE", "قرار المنتج: حذف آية تحدي الأسئلة");
assert.equal(quiz.recommendedAction, "REMOVE");

const review = readFileSync(reviewPath, "utf8");
assert.match(review, /RELEASE_BLOCKER_CRITICAL/);
assert.match(review, /\/quiz/);
assert.match(review, /\*\*REMOVE\*\*/);
assert.match(review, /لا يُعاد كتابة النص القرآني/);
assert.match(review, /REPLACE_AFTER_REVIEW.*محظور|محظور.*REPLACE_AFTER_REVIEW/);

const scriptSrc = readFileSync(scriptPath, "utf8");
assert.match(scriptSrc, /no_ai_rewrite|لا تصحيح آلي/);
assert.doesNotMatch(scriptSrc, /normalizeDiacritics|stripTashkeel|removeTashkeel/);

console.log(
  `section-verse-inventory-gate.test.ts: ok (ayahs=${ayahs.length} exact=${inventory.exactCount} mismatch=${inventory.mismatchCount})`,
);
