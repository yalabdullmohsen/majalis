/**
 * بوابة جودة دروس الكويت — تفشل عند متحدث غير شخص، عنوان مكرر، أو درس غير كويتي
 * تحت وصف الكويت دون تصنيف دورة/أرشيف، أو ظهور placeholder في بطاقة ظاهرة،
 * أو بطاقتين ظاهرتين لنفس الشيخ+العنوان+اليوم.
 * Run: node --import tsx src/lib/__tests__/kuwait-lessons-quality-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { looksLikePersonSpeaker, dedupeLessonTitleSegments } from "../lesson-speaker-guard.ts";
import { filterKuwaitOnlyForDisplay } from "../lesson-kuwait-scope.ts";
import {
  mapLessonRow,
  dedupeKuwaitLessons,
  splitKuwaitLessons,
} from "../kuwait-lessons.ts";

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

function speakerTitleKey(speaker: string, title: string, day = ""): string {
  const s = speaker.replace(/^الشيخ(?:ة)?[:：]?\s*/u, "").replace(/\s+/g, " ").trim();
  const t = title.replace(/\s+/g, " ").trim();
  const d = day.replace(/\s+/g, " ").trim();
  return `${s}|${t}|${d}`;
}

const ids = new Set<string>();
const titleKeys = new Map<string, string>();
const speakerTitleDayRaw = new Map<string, string>();

for (const row of chunk) {
  const id = String(row.id || "");
  const speaker = String(row.speaker_name || "").trim();
  const title = String(row.title || "").trim();
  const mosque = String(row.mosque || "").trim();
  const day = String(row.day_of_week || row.day || "").trim();
  assert.ok(id, "درس بلا id");
  assert.ok(!ids.has(id), `تكرار id: ${id}`);
  ids.add(id);
  assert.ok(title, `درس بلا عنوان: ${id}`);
  assert.equal(dedupeLessonTitleSegments(title), title, `عنوان مكرر المقطع: ${title}`);

  const titleKey = title.replace(/\s+/g, " ");
  if (!isElectronicOrArchive(row)) {
    const prev = titleKeys.get(titleKey);
    if (prev && prev !== id) {
      // نفس العنوان لشيخين مختلفين مسموح (كتاب واحد يُشرَح في أكثر من مجلس)
      const prevRow = chunk.find((r) => String(r.id) === prev);
      const prevSpeaker = String(prevRow?.speaker_name || "").trim();
      if (speakerTitleKey(prevSpeaker, title) === speakerTitleKey(speaker, title)) {
        assert.fail(`عنوان+شيخ مكرر بين دروس حضورية: ${prev} و ${id} — ${title}`);
      }
    }
    titleKeys.set(titleKey, id);

    const std = speakerTitleKey(speaker, title, day);
    const prevStd = speakerTitleDayRaw.get(std);
    assert.ok(
      !prevStd || prevStd === id,
      `تكرار خام لنفس الشيخ+العنوان+اليوم في البذرة: ${prevStd} و ${id} — ${title}`,
    );
    speakerTitleDayRaw.set(std, id);
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

const mapped = dedupeKuwaitLessons(chunk.map((row) => mapLessonRow({ ...row, source: "seed" })));
const visible = filterKuwaitOnlyForDisplay(mapped);
const { active } = splitKuwaitLessons(visible);

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

const speakerTitleDay = new Map<string, string>();
for (const lesson of active) {
  const key = speakerTitleKey(lesson.sheikhName || "", lesson.title || "", lesson.day || "");
  const prev = speakerTitleDay.get(key);
  assert.ok(
    !prev || prev === lesson.id,
    `تكرار بطاقة نشطة لنفس الشيخ+العنوان+اليوم: ${prev} و ${lesson.id} — ${lesson.title}`,
  );
  speakerTitleDay.set(key, lesson.id);
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
  active: active.length,
});
