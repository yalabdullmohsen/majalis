/**
 * اختبارات regression لمنع ربط الهجرة بمحرّم واختراع المناسبات بلا توثيق.
 * التشغيل: npx tsx src/lib/__tests__/religious-content-validator.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ReligiousContentValidator,
  getVerifiedRecordById,
  getPublishableLearningSeasons,
  enrichOccasionForPublish,
  guardAiReligiousRewrite,
  validateReligiousRecord,
  clearValidationRejectionLog,
} from "../religious-content";
import { ISLAMIC_OCCASIONS } from "../islamic-occasions-seed";
import { loadIslamicOccasions } from "../islamic-occasions";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

clearValidationRejectionLog();

console.log("\n=== لا ربط للهجرة النبوية بشهر محرّم ===");
{
  const muharram = getVerifiedRecordById("month-muharram")!;
  assert(muharram.hijriMonth === 1, "بطاقة محرّم شهر 1");
  assert(
    !/الهجر[ةا]/.test(muharram.verifiedDescription) || /لا تُنسب الهجرة/.test(muharram.caveat ?? ""),
    "وصف محرّم لا يدّعي وقوع الهجرة فيه",
  );
  assert(
    muharram.verifiedDescription.includes("أول شهور السنة الهجرية"),
    "وصف محرّم: أول شهور السنة وأحد الأشهر الحرم",
  );
  assert(
    muharram.recommendedActions.some((a) => a.includes("عاشوراء")),
    "اقتراح محرّم يذكر عاشوراء",
  );

  const bad = {
    ...muharram,
    verifiedDescription: "محرّم شهر الهجرة النبوية واستحضار نعمة الهجرة",
    recommendedActions: ["استحضار نعمة الهجرة"],
  };
  const banned = validateReligiousRecord(bad);
  assert(!banned.publishable, "يرفض نصًا يربط محرّم بالهجرة");
  assert(
    banned.rejections.some((r) => r.rule.includes("muharram-hijra") || r.rule.includes("temporal")),
    "سبب الرفض: علاقة زمنية مضللة",
  );
}

console.log("\n=== قدوم النبي ﷺ المدينة في ربيع الأول ===");
{
  const hijra = getVerifiedRecordById("hijra-anniversary")!;
  assert(hijra.hijriMonth === 3, "الهجرة مسجّلة في ربيع الأول (شهر 3)");
  assert(hijra.allowedMonthLinks.includes(3), "allowedMonthLinks يتضمن 3 فقط للعلاقة");
  assert(!hijra.allowedMonthLinks.includes(1), "محرّم ليس من روابط الهجرة");
  assert(/ربيع الأول/.test(hijra.verifiedDescription), "الوصف يذكر ربيع الأول");
  assert(validateReligiousRecord(hijra).publishable, "سجل الهجرة المعتمد قابل للنشر");
}

console.log("\n=== فصل بداية التقويم عن وقت الهجرة ===");
{
  const newYear = getVerifiedRecordById("hijri-new-year")!;
  assert(newYear.hijriMonth === 1, "بداية السنة في محرّم");
  assert(newYear.eventType === "calendar_marker", "نوعها علامة تقويمية لا عبادة مخصوصة");
  assert(newYear.actionsAreRitualClaims === false, "لا تُعرض أفعالها كعبادة مخصوصة باليوم");
  assert(/ربيع الأول/.test(newYear.caveat ?? ""), "التحفظ يفصل التقويم عن قدوم المدينة");
}

console.log("\n=== مواسم التعلّم — محرّم مصحّح ===");
{
  const seasons = getPublishableLearningSeasons();
  const muharramSeason = seasons.find((s) => s.hijriMonth === 1)!;
  assert(!!muharramSeason, "موسم محرّم موجود من السجل الموثّق");
  assert(!/نعمة\s*الهجرة|الهجرة النبوية/.test(muharramSeason.description + muharramSeason.suggestion),
    "موسم محرّم لا يذكر الهجرة كواقعة/نعمة مربوطة بالشهر");
  assert(/عاشوراء|الصيام/.test(muharramSeason.suggestion), "اقتراح محرّم عن الصيام/عاشوراء");

  const seasonsSrc = readFileSync(
    resolve(appRoot, "src/components/home/HomeLearningSeasonsWidget.tsx"),
    "utf-8",
  );
  assert(!seasonsSrc.includes("استحضار نعمة الهجرة"), "أُزيل النص الخاطئ من المكوّن");
  assert(seasonsSrc.includes("getPublishableLearningSeasons"), "الموسم يُشتق من السجلات الموثّقة");
}

console.log("\n=== لا مناسبة مخترعة ولا معلومة بلا مصدر ===");
{
  assert(!ReligiousContentValidator.assertNoInventedOccasion("fake-occasion-xyz"), "مناسبة مخترعة مرفوضة");
  const orphan = enrichOccasionForPublish({
    id: "invented-occasion",
    name: "مناسبة مخترعة",
    hijriMonth: 1,
    hijriDay: 2,
    summary: "بلا دليل",
    deeds: ["عبادة بلا دليل"],
    evidence: "",
    recurring: true,
  });
  assert(orphan === null, "لا عرض لمناسبة بلا سجل موثّق");
}

console.log("\n=== لا عبادة مخصوصة بلا دليل في السجلات المعتمدة ===");
{
  for (const id of ["hijri-new-year", "learning-season-muharram", "month-safar"]) {
    const r = getVerifiedRecordById(id)!;
    if (r.contentKind === "personal_suggestion" || r.eventType === "calendar_marker") {
      assert(
        r.actionsAreRitualClaims === false,
        `${id}: لا يحوّل الاقتراح العام إلى سنة مخصوصة`,
      );
    }
  }
}

console.log("\n=== نص بعلاقة زمنية غير موجودة في القاعدة يُرفض ===");
{
  const result = ReligiousContentValidator.validateFreeText(
    "في محرّم وقعت الهجرة النبوية وعلينا استحضار نعمة الهجرة",
    "month-muharram",
  );
  assert(!result.publishable, "يرفض علاقة زمنية غير مسجّلة");
}

console.log("\n=== حارس إعادة صياغة AI ===");
{
  const src = getVerifiedRecordById("month-muharram")!;
  const badRewrite = guardAiReligiousRewrite(
    src,
    "محرّم شهر وقوع الهجرة النبوية ويجب تخصيص عبادة برأس السنة الهجرية في 1/1",
  );
  assert(!badRewrite.allowed, "AI لا يُسمح له بإضافة تاريخ/عبادة/ربط مضلل");
  const okRewrite = guardAiReligiousRewrite(
    src,
    "محرّم أول شهور السنة الهجرية وهو من الأشهر الحرم.",
  );
  assert(okRewrite.allowed, "إعادة صياغة أمينة مسموحة");
}

console.log("\n=== JSON-LD للهجرة يشير لربيع الأول ===");
{
  const page = readFileSync(resolve(appRoot, "src/views/OccasionsPage.tsx"), "utf-8");
  assert(
    page.includes('name: "ذكرى الهجرة النبوية", url: "https://www.majlisilm.com/occasions?month=3"'),
    "JSON-LD الهجرة → month=3",
  );
  assert(!page.includes('الهجرة النبوية", url: "https://www.majlisilm.com/occasions?month=1"'),
    "لا رابط JSON-LD للهجرة على month=1");
}

console.log("\n=== المناسبات المعروضة للعامة كلها موثّقة ===");
{
  const published = await loadIslamicOccasions();
  assert(published.length > 0, "توجد مناسبات قابلة للنشر");
  for (const o of published) {
    assert(o.publishable === true, `${o.id} قابل للنشر`);
    assert(!!o.sourceName, `${o.id} له مصدر`);
    assert(!!o.evidence, `${o.id} له دليل`);
  }
  const hijra = published.find((o) => o.id === "hijra-anniversary");
  assert(hijra?.hijriMonth === 3, "الهجرة المعروضة في ربيع الأول");
  const seedHijra = ISLAMIC_OCCASIONS.find((o) => o.id === "hijra-anniversary");
  assert(seedHijra?.hijriMonth === 3, "البذرة أيضًا على شهر 3");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
