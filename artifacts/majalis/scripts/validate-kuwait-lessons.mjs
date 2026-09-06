#!/usr/bin/env node
/**
 * يفشل إذا ظهر متحدث فارغ/غير شخص، عنوان مكرر، أو درس غير كويتي
 * تحت وصف الكويت دون تصنيف دورة إلكترونية/أرشيف.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const chunk = JSON.parse(readFileSync(resolve(root, "public/data/lessons/chunk-000.json"), "utf8"));

const { looksLikePersonSpeaker, dedupeLessonTitleSegments } = await import(
  pathToFileURL(resolve(root, "src/lib/lesson-speaker-guard.ts")).href
);

const KUWAIT_HINT =
  /الكويت|حولي|الفروانية|الجهراء|الأحمدي|مبارك|العاصمة|السالمية|خيطان|بيان|سلوى|العديلية|الروضة|كيفان|الصباحية|الفردوس|الجابرية|القادسية|الشامية|الدسمة|اليرموك|قرطبة|صباح السالم|الفنيطيس|الصليبيخات|سعد العبدالله|العدلية|الفنطاس|العدان|الرميثية|السلام|الشهداء|النهضة|الواحة|المسيلة|أبو فطيرة/u;
const PLACEHOLDER = /^(يُعلن لاحقًا|يعلن لاحقا|يُعلن لاحقاً)$/u;

function isElectronicOrArchive(row) {
  const activity = String(row.activity_type || "");
  const title = String(row.title || "");
  return (
    Boolean(row.is_course) ||
    /دورة\s*إلكترونية|إلكترون|أونلاين|عن\s*بعد/u.test(activity) ||
    /دورة\s*إلكترونية|أرشيف/u.test(title) ||
    /أرشيف/u.test(activity)
  );
}

function hasKuwaitLocation(row) {
  const blob = [row.city, row.region, row.mosque, row.governorate].map((x) => String(x || "")).join(" ");
  return KUWAIT_HINT.test(blob);
}

const errors = [];
for (const row of chunk) {
  const sp = String(row.speaker_name || "").trim();
  const title = String(row.title || "").trim();
  if (!title) errors.push(`title_empty id=${row.id}`);
  if (title && dedupeLessonTitleSegments(title) !== title) {
    errors.push(`title_dup id=${row.id} title=${JSON.stringify(title)}`);
  }
  if (!sp) errors.push(`speaker_empty id=${row.id} title=${JSON.stringify(title)}`);
  else if (!looksLikePersonSpeaker(sp) && !PLACEHOLDER.test(sp)) {
    errors.push(`speaker_invalid id=${row.id} speaker=${JSON.stringify(sp)}`);
  }
  if (!hasKuwaitLocation(row) && !isElectronicOrArchive(row)) {
    errors.push(`non_kuwait_unclassified id=${row.id} title=${JSON.stringify(title)}`);
  }
}

if (errors.length) {
  console.error(`validate-kuwait-lessons: FAIL (${errors.length})`);
  for (const e of errors.slice(0, 40)) console.error(" -", e);
  process.exit(1);
}
console.log(`validate-kuwait-lessons: ok (${chunk.length} rows)`);
