/**
 * اختبار Regression — إلغاء «محتوى اليوم» المتفرق (2026-07-24):
 * - لا يبقى أي مكوّن/منطق "Xod-card" أو "todaysX()" محلي متفرق داخل أي
 *   صفحة قسم (كانت موزّعة على 30+ صفحة: عالم/حكمة/سنة/فضيلة/أدب/مصطلح
 *   /علامة/ملَك/وصية/رقيقة/مرحلة سيرة/معجزة/موضوع طب/مسألة توحيد اليوم...).
 * - «مجلس اليوم» (HomeMajlisToday) يبقى المكوّن الموحّد الوحيد، ويظهر في
 *   الصفحة الرئيسية فقط — لا تكرار في أي قسم آخر.
 * - المحتوى العلمي الأصلي (بيانات السور/الأحاديث/الحكم نفسها) لم يُحذف —
 *   الاختبار يتحقق من حذف "طريقة العرض اليومية" فقط، لا البيانات.
 *
 * تُشغَّل عبر: npx tsx src/lib/__tests__/daily-content-consolidation.test.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getDailyDhikr, getDailyHadith, getDailyFaida } from "../daily-content";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ FAIL: ${label}`); failed++; }
}

function readSrc(relPath: string): string {
  return readFileSync(resolve(appRoot, relPath), "utf-8");
}

console.log("\n=== لا منطق تدوير يومي متفرق متبقٍّ في صفحات الأقسام ===");
{
  // استثناءان مقصودان (ليسا خطأً): ArbaeenNawawiPage.tsx يُبقي getDayOfYear()
  // فقط لتمييز "isToday" داخل قائمة الـ40 حديثًا الكاملة الظاهرة أصلاً (لا
  // بطاقة منفصلة حصرية) — وMawarithPage.tsx يُبقي className="mwod-card" على
  // رابط دائم لحاسبة المواريث (إعادة استخدام تصميم البطاقة، لا محتوى يومي).
  const pagesWithFormerDailyWidgets = [
    "src/views/IslamicScholarsPage.tsx",
    "src/views/HikamSalafPage.tsx",
    "src/views/HadithSciencePage.tsx",
    "src/views/QuranTajweedPage.tsx",
    "src/views/AkhlaqPage.tsx",
    "src/views/ArkanIslamPage.tsx",
    "src/views/ArkanImanPage.tsx",
    "src/views/MadhahibPage.tsx",
    "src/views/SunanYawmiyyaPage.tsx",
    "src/views/ZakatPage.tsx",
    "src/views/SawmPage.tsx",
    "src/views/TaharaPage.tsx",
    "src/views/FadailAamalPage.tsx",
    "src/views/JanazaPage.tsx",
    "src/views/JannaNaarPage.tsx",
    "src/views/SahabahPage.tsx",
    "src/views/UlumQuranPage.tsx",
    "src/views/DuasQuranPage.tsx",
    "src/views/FiqhQawaidPage.tsx",
    "src/views/ShimaelPage.tsx",
    "src/views/IslamicGlossaryPage.tsx",
    "src/views/AdabTalabIlmPage.tsx",
    "src/views/AlamatSaahPage.tsx",
    "src/views/MalaikaPage.tsx",
    "src/views/IslamicSectsPage.tsx",
    "src/views/PrayerRanksPage.tsx",
    "src/views/WasayaNabawiyyaPage.tsx",
    "src/views/RaqaiqPage.tsx",
    "src/views/SeerahPage.tsx",
    "src/views/ProphetStoriesPage.tsx",
    "src/views/PropheticMedicinePage.tsx",
    "src/views/TawhidPage.tsx",
  ];
  const dailyPattern = /function\s+todays[A-Z]\w*\s*\(|getDayOfYear\(\)\s*%|className="[a-z]+od-card"/;
  for (const rel of pagesWithFormerDailyWidgets) {
    const src = readSrc(rel);
    assert(!dailyPattern.test(src), `${rel.split("/").pop()} خالٍ من منطق "X اليوم" المتفرق`);
  }

  // الاستثناءان: تحقّق من أن ما تبقّى هو فقط الاستخدام المشروع الموثَّق أعلاه،
  // لا بطاقة "حديث اليوم"/"مسألة الميراث اليوم" منفصلة عادت خطأً.
  const arbaeenSrc = readSrc("src/views/ArbaeenNawawiPage.tsx");
  assert(!arbaeenSrc.includes("an-today"), "ArbaeenNawawiPage: قسم بطاقة \"حديث اليوم\" المنفصل لم يعُد");
  assert(!arbaeenSrc.includes("حديث اليوم"), "ArbaeenNawawiPage: لا نص \"حديث اليوم\" متبقٍّ كعنوان قسم");

  const mawarithSrc = readSrc("src/views/MawarithPage.tsx");
  assert(!mawarithSrc.includes("mwod-card__badge") && !mawarithSrc.includes("mwod-card__formula"),
    "MawarithPage: عناصر بطاقة \"مسألة الميراث اليوم\" المنفصلة (badge/formula) لم تعُد");
  assert(!mawarithSrc.includes("مسألة الميراث اليوم"), "MawarithPage: لا نص \"مسألة الميراث اليوم\" متبقٍّ");
}

console.log("\n=== لا مكوّنات يتيمة متبقية من الميزة المُلغاة ===");
{
  const navBarLikeFiles = ["src/views/HomePage.tsx"];
  for (const rel of navBarLikeFiles) {
    const src = readSrc(rel);
    assert(!src.includes("HomeDailyQuestion"), `${rel} لا يستورد HomeDailyQuestion (مكوّن مُحذوف)`);
  }
  const dailyContentSrc = readSrc("src/lib/daily-content.ts");
  assert(!dailyContentSrc.includes("getDailyQa"), "getDailyQa (خاص بسؤال اليوم المُلغى) أُزيل من daily-content.ts");
}

console.log("\n=== «مجلس اليوم» — مكوّن موحّد وحيد، الصفحة الرئيسية فقط ===");
{
  const homePageSrc = readSrc("src/views/HomePage.tsx");
  const homeMajlisTodaySrc = readSrc("src/components/home/HomeMajlisToday.tsx");
  assert(homePageSrc.includes("HomeMajlisToday"), "الصفحة الرئيسية تستورد/تستخدم HomeMajlisToday");
  assert(homeMajlisTodaySrc.length > 0, "مكوّن مجلس اليوم موجود وله محتوى فعلي");

  // لا صفحة قسم أخرى (من القائمة أعلاه) تستورد HomeMajlisToday — التفرّد مضمون
  const pagesToCheck = [
    "src/views/HikamSalafPage.tsx",
    "src/views/SahabahPage.tsx",
    "src/views/ArbaeenNawawiPage.tsx",
  ];
  for (const rel of pagesToCheck) {
    assert(!readSrc(rel).includes("HomeMajlisToday"), `${rel} لا يستورد HomeMajlisToday (لا تكرار خارج الرئيسية)`);
  }
}

console.log("\n=== المحتوى العلمي الأصلي لم يُحذف — فقط طريقة عرضه اليومية ===");
{
  // البيانات (المصفوفات نفسها) يجب أن تبقى مستخدَمة في القوائم الكاملة
  const hikamSrc = readSrc("src/views/HikamSalafPage.tsx");
  assert(hikamSrc.includes("HIKAM"), "بيانات حكم السلف (HIKAM) ما زالت موجودة ومستخدَمة في القائمة الكاملة");
  const sahabahSrc = readSrc("src/views/SahabahPage.tsx");
  assert(sahabahSrc.includes("SAHABAH"), "بيانات الصحابة (SAHABAH) ما زالت موجودة ومستخدَمة في القائمة الكاملة");
  const arbaeenSrc = readSrc("src/views/ArbaeenNawawiPage.tsx");
  assert(arbaeenSrc.includes("ARBAEEN_NAWAWI"), "بيانات الأربعين النووية ما زالت موجودة ومستخدَمة في القائمة الكاملة");
}

console.log("\n=== دوال daily-content.ts المتبقية (لمجلس اليوم فقط) تعمل بلا كسر ===");
{
  const dhikr = getDailyDhikr();
  assert(!!dhikr.text, "getDailyDhikr() ما زالت تعمل (تخدم مجلس اليوم فقط الآن)");
  const hadith = getDailyHadith();
  assert(!!hadith.text, "getDailyHadith() ما زالت تعمل");
  const faida = getDailyFaida();
  assert(!!faida.text, "getDailyFaida() ما زالت تعمل");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
