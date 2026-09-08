/**
 * بوابة جودة دروس الكويت — تفشل عند متحدث غير شخص، عنوان مكرر، أو درس غير كويتي
 * تحت وصف الكويت دون تصنيف دورة/أرشيف، أو ظهور placeholder في بطاقة ظاهرة.
 * Run: node --import tsx src/lib/__tests__/kuwait-lessons-quality-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { looksLikePersonSpeaker, dedupeLessonTitleSegments } from "../lesson-speaker-guard.ts";
import {
  filterKuwaitOnlyForDisplay,
  type KuwaitLessonRecord,
} from "../lesson-kuwait-scope.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const chunk = JSON.parse(
  readFileSync(resolve(root, "public/data/lessons/chunk-000.json"), "utf8"),
) as Array<Record<string, unknown>>;

assert.ok(Array.isArray(chunk) && chunk.length > 0, "chunk-000 دروس موجود");

const KUWAIT_HINT =
  /الكويت|حولي|الفروانية|الجهراء|الأحمدي|مبارك|العاصمة|السالمية|خيطان|بيان|سلوى|العديلية|الروضة|كيفان|الصباحية|الفردوس|الجابرية|القادسية|الشامية|الدسمة|اليرموك|قرطبة|صباح السالم|الفنيطيس|الصليبيخات|سعد العبدالله|العدلية|الفنطاس|العدان|الرميثية|السلام|الشهداء|النهضة|الواحة|المسيلة|أبو فطيرة/u;

const PLACEHOLDER_SPEAKER =
  /^(يُعلن لاحقًا|يعلن لاحقا|يُعلن لاحقاً|يُذكر عند التسجيل|يذكر عند التسجيل|الشيخ غير محدد)$/u;

function isElectronicOrArchive(row: Record<string, unknown>): boolean {
  const activity = String(row.activity_type || "");
  const title = String(row.title || "");
  const region = String(row.region || "");
  return (
    Boolean(row.is_course) ||
    /دورة\s*إلكترونية|إلكترون|أونلاين|عن\s*بعد/u.test(activity) ||
    /دورة\s*إلكترونية|أرشيف/u.test(title) ||
    /أرشيف|أونلاين/u.test(activity) ||
    /أونلاين/u.test(region)
  );
}

function hasKuwaitLocation(row: Record<string, unknown>): boolean {
  const blob = [row.city, row.region, row.mosque, row.governorate].map((x) => String(x || "")).join(" ");
  return KUWAIT_HINT.test(blob);
}

const ids = new Set<string>();
const titleKeys = new Map<string, string>();

for (const row of chunk) {
  const id = String(row.id || "");
  const speaker = String(row.speaker_name || "").trim();
  const title = String(row.title || "").trim();
  const mosque = String(row.mosque || "").trim();
  assert.ok(id, "درس بلا id");
  assert.ok(!ids.has(id), `تكرار id: ${id}`);
  ids.add(id);
  assert.ok(title, `درس بلا عنوان: ${id}`);
  assert.equal(dedupeLessonTitleSegments(title), title, `عنوان مكرر المقطع: ${title}`);

  const titleKey = title.replace(/\s+/g, " ");
  if (!isElectronicOrArchive(row)) {
    const prev = titleKeys.get(titleKey);
    if (prev && prev !== id) {
      assert.fail(`عنوان مكرر بين دروس حضورية: ${prev} و ${id} — ${title}`);
    }
    titleKeys.set(titleKey, id);
  }

  assert.ok(speaker, `متحدث فارغ: ${id} / ${title}`);

  const kuwaitInPerson = hasKuwaitLocation(row) && !isElectronicOrArchive(row);
  if (kuwaitInPerson) {
    assert.ok(
      looksLikePersonSpeaker(speaker) && !PLACEHOLDER_SPEAKER.test(speaker),
      `درس كويتي حضوري بلا شيخ موثّق «${speaker}»: ${id}`,
    );
    assert.ok(mosque, `درس كويتي حضوري بلا مسجد/مكان: ${id}`);
  } else {
    assert.ok(
      looksLikePersonSpeaker(speaker) || PLACEHOLDER_SPEAKER.test(speaker) || isElectronicOrArchive(row),
      `متحدث غير صالح «${speaker}» في ${title}`,
    );
  }

  if (!hasKuwaitLocation(row) && !isElectronicOrArchive(row)) {
    assert.fail(`درس غير كويتي دون تصنيف دورة/أرشيف: ${id} / ${title}`);
  }
}

/** البطاقات الظاهرة في /lessons لا تعرض placeholder أو شيخًا غير شخص */
const asKuwaitRecords = chunk.map((row) => ({
  id: String(row.id || ""),
  title: String(row.title || ""),
  sheikhName: String(row.speaker_name || ""),
  mosque: String(row.mosque || ""),
  region: String(row.region || ""),
  governorate: String(row.city || row.governorate || ""),
  note: "",
  description: String(row.description || ""),
  day: "",
  time: "",
  category: "",
  sortKey: 0,
  nextOccurrenceMs: 0,
  activityType: "درس" as const,
}));

const visible = filterKuwaitOnlyForDisplay(asKuwaitRecords as KuwaitLessonRecord[]);
for (const lesson of visible) {
  assert.ok(
    looksLikePersonSpeaker(lesson.sheikhName || ""),
    `بطاقة ظاهرة بشيخ غير موثّق: ${lesson.id} / ${lesson.sheikhName}`,
  );
  assert.ok(
    !PLACEHOLDER_SPEAKER.test(String(lesson.sheikhName || "").trim()),
    `بطاقة ظاهرة فيها placeholder: ${lesson.id}`,
  );
}

const searchIdxPath = resolve(root, "public/data/search/index.json");
try {
  const search = readFileSync(searchIdxPath, "utf8");
  assert.doesNotMatch(search, /المكتبة العلمية/);
  assert.doesNotMatch(search, /"\/library"/);
  assert.doesNotMatch(search, /"\/more"/);
} catch {
  // الفهرس يُولَّد أثناء البناء
}

console.log("kuwait-lessons-quality-gate: ok", {
  lessons: chunk.length,
  visible: visible.length,
});
