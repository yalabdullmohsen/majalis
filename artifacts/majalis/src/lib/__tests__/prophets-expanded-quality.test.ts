/**
 * بوابة التوسعة الشرعية لقصص الأنبياء.
 * تشغيل: node --import tsx src/lib/__tests__/prophets-expanded-quality.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROPHETS, getProphet, resolveProphetSlug } from "../prophets-data.ts";
import {
  CAUTION_MARKERS,
  EXPANDED_PROPHET_STORIES,
  SOURCE_RELIABILITY_VALUES,
  allParagraphs,
  getExpandedProphetStory,
  publishableParagraphs,
  type ExpandedProphetStory,
} from "../prophets-expanded/index.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const FORBIDDEN = [
  "تُربط سيرته",
  "يُستحضر المآل",
  "الصبر على مقتضاه",
  "البلدفلسطين",
  "Esc للقائمة",
  "اختصارات:",
];

const EXPECTED = PROPHETS.map((p) => p.slug);
assert.equal(PROPHETS.length, 25);
assert.equal(Object.keys(EXPANDED_PROPHET_STORIES).length, 25);

function hasCaution(text: string): boolean {
  return CAUTION_MARKERS.some((m) => text.includes(m));
}

function assertStory(story: ExpandedProphetStory) {
  assert.ok(story.title.trim(), `${story.slug}: عنوان فارغ`);
  assert.ok(story.brief.trim().length >= 40, `${story.slug}: نبذة قصيرة`);
  const paras = allParagraphs(story);
  assert.ok(paras.length >= 6, `${story.slug}: توسعة ناقصة`);

  for (const para of paras) {
    assert.ok(para.text?.trim(), `${story.slug}: فقرة بلا نص`);
    assert.ok(
      (SOURCE_RELIABILITY_VALUES as readonly string[]).includes(para.sourceReliability),
      `${story.slug}: sourceReliability غير صالح: ${para.sourceReliability}`,
    );
    if (para.sourceReliability === "sahih_hadith") {
      assert.ok(para.sourceNote?.trim(), `${story.slug}: حديث بلا مصدر/تخريج`);
      assert.ok(
        /البخاري|مسلم|السنن|أبو داود|الترمذي|النسائي|ابن ماجه/i.test(para.sourceNote),
        `${story.slug}: تخريج غير معروف: ${para.sourceNote}`,
      );
    }
    if (para.sourceReliability === "historical_report" || para.sourceReliability === "uncertain") {
      assert.ok(
        hasCaution(para.text),
        `${story.slug}: تقرير تاريخي/غير قطعي بلا تنبيه احترازي: ${para.text.slice(0, 60)}`,
      );
    }
    for (const bad of FORBIDDEN) {
      assert.ok(!para.text.includes(bad), `${story.slug}: حشو محظور: ${bad}`);
    }
  }

  const published = publishableParagraphs(paras);
  assert.ok(
    published.every((p) => p.sourceReliability !== "israiliyyat_avoid"),
    `${story.slug}: إسرائيليات منشورة`,
  );

  // لا تكرار آلي لنصف النبذة
  const half = Math.floor(story.brief.length / 2);
  if (half > 60) {
    assert.notEqual(story.brief.slice(0, half).trim(), story.brief.slice(half).trim());
  }
}

for (const slug of EXPECTED) {
  const story = getExpandedProphetStory(slug);
  assert.ok(story, `قصة موسّعة ناقصة: ${slug}`);
  assert.equal(story!.slug, slug);
  assertStory(story!);
  assert.ok(getProphet(slug), `سجل PROPHETS ناقص: ${slug}`);
}

// إصلاحات محددة
assert.notEqual(getProphet("adam")?.quranTitle, "صفيّ الله");
assert.notEqual(getProphet("adam")?.title, "صفيّ الله");
assert.notEqual(getProphet("nuh")?.title, "نجيّ الله");
assert.ok(getProphet("shuayb")?.briefBio.includes("يُذكر") || getProphet("shuayb")?.briefBio.includes("بعض أهل العلم"));
assert.ok(getProphet("dhul-kifl")?.briefBio.includes("خلاف"));

const isa = getExpandedProphetStory("isa")!;
const isaText = [isa.brief, ...allParagraphs(isa).map((p) => p.text)].join("\n");
const raiseHits = isaText.match(/رفعه الله إليه/g) ?? [];
assert.ok(raiseHits.length <= 2, `عيسى: تكرار مفرط لعبارة الرفع (${raiseHits.length})`);
assert.ok(!isaText.includes("رفعه الله إليه ولم يُقتل"));

// redirect زكريا
assert.equal(resolveProphetSlug("zakariya"), "zakariyya");
assert.equal(resolveProphetSlug("zakaria"), "zakariyya");
assert.equal(getProphet("zakariya")?.slug, "zakariyya");

const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
assert.match(app, /path="\/prophets\/zakariya"><Redirect\s+to="\/prophets\/zakariyya"/);
assert.match(app, /path="\/prophets\/zakaria"><Redirect\s+to="\/prophets\/zakariyya"/);

const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");
assert.match(
  vercel,
  /"source"\s*:\s*"\/prophets\/zakariya"[\s\S]{0,160}"destination"\s*:\s*"\/prophets\/zakariyya"/,
);

console.log(`prophets-expanded-quality: OK — ${EXPECTED.length} قصة موسّعة موثّقة`);
