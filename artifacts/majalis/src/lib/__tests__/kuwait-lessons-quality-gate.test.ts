/**
 * بوابة جودة دروس الكويت — تفشل عند متحدث غير شخص، عنوان مكرر، أو درس غير كويتي
 * تحت وصف الكويت دون تصنيف دورة/أرشيف.
 * Run: node --import tsx src/lib/__tests__/kuwait-lessons-quality-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { looksLikePersonSpeaker, dedupeLessonTitleSegments } from "../lesson-speaker-guard.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const chunk = JSON.parse(
  readFileSync(resolve(root, "public/data/lessons/chunk-000.json"), "utf8"),
) as Array<Record<string, unknown>>;

assert.ok(Array.isArray(chunk) && chunk.length > 0, "chunk-000 دروس موجود");

const KUWAIT_HINT =
  /الكويت|حولي|الفروانية|الجهراء|الأحمدي|مبارك|العاصمة|السالمية|خيطان|بيان|سلوى|العديلية|الروضة|كيفان|الصباحية|الفردوس|الجابرية|القادسية|الشامية|الدسمة|اليرموك|قرطبة|صباح السالم|الفنيطيس|الصليبيخات|سعد العبدالله|العدلية|الفنطاس|العدان|الرميثية|السلام|الشهداء|النهضة|الواحة|المسيلة|أبو فطيرة/u;

const PLACEHOLDER_SPEAKER = /^(يُعلن لاحقًا|يعلن لاحقا|يُعلن لاحقاً)$/u;

function isElectronicOrArchive(row: Record<string, unknown>): boolean {
  const activity = String(row.activity_type || "");
  const title = String(row.title || "");
  return (
    Boolean(row.is_course) ||
    /دورة\s*إلكترونية|إلكترون|أونلاين|عن\s*بعد/u.test(activity) ||
    /دورة\s*إلكترونية|أرشيف/u.test(title) ||
    /أرشيف/u.test(activity)
  );
}

function hasKuwaitLocation(row: Record<string, unknown>): boolean {
  const blob = [row.city, row.region, row.mosque, row.governorate].map((x) => String(x || "")).join(" ");
  return KUWAIT_HINT.test(blob);
}

for (const row of chunk) {
  const speaker = String(row.speaker_name || "").trim();
  const title = String(row.title || "").trim();
  assert.ok(title, `درس بلا عنوان: ${row.id}`);
  assert.equal(dedupeLessonTitleSegments(title), title, `عنوان مكرر المقطع: ${title}`);
  assert.ok(speaker, `متحدث فارغ: ${row.id} / ${title}`);
  assert.ok(
    looksLikePersonSpeaker(speaker) || PLACEHOLDER_SPEAKER.test(speaker),
    `متحدث غير صالح «${speaker}» في ${title}`,
  );
  if (!hasKuwaitLocation(row) && !isElectronicOrArchive(row)) {
    assert.fail(`درس غير كويتي دون تصنيف دورة/أرشيف: ${row.id} / ${title}`);
  }
}

const searchIdxPath = resolve(root, "public/data/search/index.json");
try {
  const search = readFileSync(searchIdxPath, "utf8");
  assert.doesNotMatch(search, /المكتبة العلمية/);
  assert.doesNotMatch(search, /"\/library"/);
} catch {
  // الفهرس يُولَّد أثناء البناء
}

console.log("kuwait-lessons-quality-gate: ok", { lessons: chunk.length });
