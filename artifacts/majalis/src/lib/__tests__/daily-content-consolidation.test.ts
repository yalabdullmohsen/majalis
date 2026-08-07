/**
 * اختبار Regression — إلغاء بطاقات «X اليوم» (2026-07-27):
 * - لا يبقى أي مكوّن/منطق "Xod-card" أو "todaysX()" أو «دعاء/اسم/واجب اليوم»
 *   داخل صفحات الأقسام أو الرئيسية.
 * - «مجلس اليوم» وودجت «اسم الله اليومي» أُلغيا بالكامل من الرئيسية.
 * - المحتوى العلمي الأصلي (بيانات السور/الأحاديث/الحكم نفسها) لم يُحذف —
 *   الاختبار يتحقق من حذف "طريقة العرض اليومية" فقط، لا البيانات.
 * - daily-content.ts يبقى لشريط الإعلان العلوي (ticker) فقط.
 *
 * تُشغَّل عبر: npx tsx src/lib/__tests__/daily-content-consolidation.test.ts
 */
import { readFileSync, existsSync } from "node:fs";
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
  // MawarithPage.tsx يُبقي className="mwod-card" على رابط دائم لحاسبة المواريث
  // (إعادة استخدام تصميم البطاقة، لا محتوى يومي).
  // ArbaeenNawawiPage يُبقي getDayOfYear() لشارة "اليوم" داخل القائمة الكاملة فقط.
  const pagesWithFormerDailyWidgets = [
    "src/pages/library/ui/IslamicScholarsView.tsx",
    "src/views/HikamSalafPage.tsx",
    "src/pages/hadith/ui/HadithScienceView.tsx",
    "src/pages/quran/ui/QuranTajweedView.tsx",
    "src/views/AkhlaqPage.tsx",
    "src/views/ArkanIslamPage.tsx",
    "src/views/ArkanImanPage.tsx",
    "src/views/MadhahibPage.tsx",
    "src/views/SunanYawmiyyaPage.tsx",
    "src/pages/fiqh/ui/ZakatView.tsx",
    "src/views/SawmPage.tsx",
    "src/views/TaharaPage.tsx",
    "src/views/FadailAamalPage.tsx",
    "src/pages/fiqh/ui/JanazaView.tsx",
    "src/views/JannaNaarPage.tsx",
    "src/views/SahabahPage.tsx",
    "src/pages/quran/ui/UlumQuranView.tsx",
    "src/pages/quran/ui/DuasQuranView.tsx",
    "src/pages/fiqh/ui/FiqhQawaidView.tsx",
    "src/views/ShimaelPage.tsx",
    "src/views/IslamicGlossaryPage.tsx",
    "src/views/AdabTalabIlmPage.tsx",
    "src/views/AlamatSaahPage.tsx",
    "src/views/MalaikaPage.tsx",
    "src/views/IslamicSectsPage.tsx",
    "src/pages/worship/ui/PrayerRanksView.tsx",
    "src/views/WasayaNabawiyyaPage.tsx",
    "src/views/RaqaiqPage.tsx",
    "src/views/SeerahPage.tsx",
    "src/views/ProphetStoriesPage.tsx",
    "src/views/PropheticMedicinePage.tsx",
    "src/views/TawhidPage.tsx",
    "src/pages/fiqh/ui/SalahGuideView.tsx",
    "src/views/TawbaPage.tsx",
    "src/pages/fiqh/ui/HajjView.tsx",
    "src/pages/worship/ui/DuasView.tsx",
    "src/views/AsmaaHusnaPage.tsx",
  ];
  const dailyPattern = /function\s+todays[A-Z]\w*\s*\(|getDayOfYear\(\)\s*%|className="[a-z]+od-card"|واجب الصلاة اليوم|ذكر التوبة اليوم|ركن الحج اليوم|دعاء اليوم|اسم اليوم|حديث اليوم|فائدة اليوم/;
  for (const rel of pagesWithFormerDailyWidgets) {
    const src = readSrc(rel);
    assert(!dailyPattern.test(src), `${rel.split("/").pop()} خالٍ من منطق "X اليوم" المتفرق`);
  }

  const arbaeenSrc = readSrc("src/pages/hadith/ui/ArbaeenNawawiView.tsx");
  assert(!arbaeenSrc.includes("an-today"), "ArbaeenNawawiPage: قسم بطاقة \"حديث اليوم\" المنفصل لم يعُد");
  assert(!arbaeenSrc.includes("حديث اليوم"), "ArbaeenNawawiPage: لا نص \"حديث اليوم\" متبقٍّ كعنوان قسم");

  const mawarithSrc = readSrc("src/pages/fiqh/ui/MawarithView.tsx");
  assert(!mawarithSrc.includes("mwod-card__badge") && !mawarithSrc.includes("mwod-card__formula"),
    "MawarithPage: عناصر بطاقة \"مسألة الميراث اليوم\" المنفصلة (badge/formula) لم تعُد");
  assert(!mawarithSrc.includes("مسألة الميراث اليوم"), "MawarithPage: لا نص \"مسألة الميراث اليوم\" متبقٍّ");
}

console.log("\n=== الرئيسية بلا مجلس اليوم / اسم الله اليومي ===");
{
  const homePageSrc = readSrc("src/pages/account/ui/HomeView.tsx");
  assert(!homePageSrc.includes("HomeMajlisToday"), "HomePage لا يستورد مجلس اليوم");
  assert(!homePageSrc.includes("HomeAsmaCard"), "HomePage لا يستورد اسم الله اليومي");
  assert(!homePageSrc.includes("حديث اليوم"), "HomePage بلا نص حديث اليوم");
  assert(!/مجلس اليوم/.test(homePageSrc), "HomePage بلا عنوان مجلس اليوم");

  const layoutSrc = readSrc("src/lib/homepage-layout.ts");
  assert(!layoutSrc.includes('id: "asma"'), "homepage-layout أزال ودجت asma");
  assert(!layoutSrc.includes("اسم الله اليومي"), "homepage-layout بلا تسمية اسم الله اليومي");
  assert(!existsSync(resolve(appRoot, "src/components/home/HomeMajlisToday.tsx")),
    "ملف HomeMajlisToday.tsx حُذف");
  assert(!existsSync(resolve(appRoot, "src/components/home/HomeAsmaCard.tsx")),
    "ملف HomeAsmaCard.tsx حُذف");
}

console.log("\n=== لا مكوّنات يتيمة متبقية من الميزة المُلغاة ===");
{
  const homePageSrc = readSrc("src/pages/account/ui/HomeView.tsx");
  assert(!homePageSrc.includes("HomeDailyQuestion"), "HomePage لا يستورد HomeDailyQuestion (مكوّن مُحذوف)");
  const dailyContentSrc = readSrc("src/lib/daily-content.ts");
  assert(!dailyContentSrc.includes("getDailyQa"), "getDailyQa (خاص بسؤال اليوم المُلغى) أُزيل من daily-content.ts");
}

console.log("\n=== المحتوى العلمي الأصلي لم يُحذف — فقط طريقة عرضه اليومية ===");
{
  const hikamSrc = readSrc("src/views/HikamSalafPage.tsx");
  assert(hikamSrc.includes("HIKAM"), "بيانات حكم السلف (HIKAM) ما زالت موجودة ومستخدَمة في القائمة الكاملة");
  const sahabahSrc = readSrc("src/views/SahabahPage.tsx");
  assert(sahabahSrc.includes("SAHABAH"), "بيانات الصحابة (SAHABAH) ما زالت موجودة ومستخدَمة في القائمة الكاملة");
  const arbaeenSrc = readSrc("src/pages/hadith/ui/ArbaeenNawawiView.tsx");
  assert(arbaeenSrc.includes("ARBAEEN_NAWAWI"), "بيانات الأربعين النووية ما زالت موجودة ومستخدَمة في القائمة الكاملة");
  const salahSrc = readSrc("src/pages/fiqh/ui/SalahGuideView.tsx");
  assert(salahSrc.includes("WAJIBAAT"), "واجبات الصلاة ما زالت في التبويب الكامل");
}

console.log("\n=== دوال daily-content.ts المتبقية (للشريط العلوي) تعمل بلا كسر ===");
{
  const dhikr = getDailyDhikr();
  assert(!!dhikr.text, "getDailyDhikr() ما زالت تعمل (تخدم الشريط العلوي)");
  const hadith = getDailyHadith();
  assert(!!hadith.text, "getDailyHadith() ما زالت تعمل");
  const faida = getDailyFaida();
  assert(!!faida.text, "getDailyFaida() ما زالت تعمل");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
