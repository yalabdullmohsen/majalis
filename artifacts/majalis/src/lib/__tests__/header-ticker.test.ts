/**
 * اختبار Regression للشريط المتحرك أعلى الهيدر (HeaderTicker، 2026-07-24):
 * - عناصر المحتوى المعتمد المُعاد استخدامها من daily-content.ts (نفس مصدر
 *   «مجلس اليوم») تُرجع دومًا نصًا حرفيًا غير فارغ مع مصدره — لا نص فارغ
 *   ولا محتوى بلا إسناد يمكن أن يظهر في الشريط.
 * - عدّاد الصلاة يُعاد استخدامه من @/lib/prayer-times (نفس PrayerChip)،
 *   لا نظام موازٍ جديد.
 * - زر/مربع البحث القديم أُزيل فعليًا من مصدر NavBar.tsx، والمسار البديل
 *   (البحث الشامل + Ctrl/Cmd+K) لا يزال مسجَّلاً.
 *
 * تُشغَّل عبر: npx tsx src/lib/__tests__/header-ticker.test.ts
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

console.log("\n=== محتوى معتمد بمصدر — نفس مصدر مجلس اليوم، بلا نظام موازٍ ===");
{
  const dhikr = getDailyDhikr();
  assert(!!dhikr.text && dhikr.text.trim().length > 0, "getDailyDhikr() يُرجع نصًا غير فارغ");
  assert(!!dhikr.source, `الذكر له مصدر موثَّق (الفعلي: ${dhikr.source})`);

  const hadith = getDailyHadith();
  assert(!!hadith.text && hadith.text.trim().length > 0, "getDailyHadith() يُرجع نصًا غير فارغ");
  assert(!!hadith.source && !!hadith.narrator, `الحديث له راوٍ ومصدر (${hadith.narrator} — ${hadith.source})`);

  const faida = getDailyFaida();
  assert(!!faida.text && faida.text.trim().length > 0, "getDailyFaida() يُرجع نصًا غير فارغ");

  // ثبات القيمة لنفس اليوم — لا عشوائية، تدوير حتمي فقط
  const dhikr2 = getDailyDhikr();
  assert(dhikr.id === dhikr2.id, "نفس اليوم يُعيد نفس العنصر بالضبط (حتمي لا عشوائي)");
}

console.log("\n=== NavBar.tsx / App.tsx — نقطة دخول البحث موحّدة بلا سحب للأسفل ===");
{
  const navBarSrc = readFileSync(resolve(appRoot, "src/components/NavBar.tsx"), "utf-8");
  assert(navBarSrc.includes("navbar-search-toggle"), "زر بحث واضح موجود في الهيدر");
  assert(!navBarSrc.includes("SearchBox"), "لا مربع بحث مضمّن قديم متبقٍّ في مصدر الهيدر");
  assert(navBarSrc.includes("HeaderTicker"), "الشريط المتحرك مُدرَج فعليًا في الهيدر");

  const appSrc = readFileSync(resolve(appRoot, "src/App.tsx"), "utf-8");
  assert(
    appSrc.includes('e.key.toLowerCase() === "k"') || appSrc.includes('e.key === "k"'),
    "اختصار Ctrl/Cmd+K لفتح البحث الشامل ما زال مسجَّلاً في App.tsx",
  );
  assert(appSrc.includes("global-search-open"), "مستمع حدث فتح البحث الشامل ما زال مسجَّلاً في App.tsx (قناة بديلة متاحة لأي مُطلِق مستقبلي)");
  assert(
    appSrc.includes('e.key.toLowerCase() === "r"') && appSrc.includes("/my-learning#flashcards"),
    "اختصار Ctrl/Cmd+Shift+R يفتح البطاقات عبر حسابي",
  );
  assert(!appSrc.includes("pullTouchRef"), "أزيل منطق pull-to-search بالكامل من App.tsx");
  assert(!appSrc.includes("onTouchStart={onTouchStart}"), "سحب الصفحة لا يفتح البحث من جذر التطبيق");

  const sideNavSrc = readFileSync(resolve(appRoot, "src/components/SideNavDrawer.tsx"), "utf-8");
  assert(sideNavSrc.includes("/search") || sideNavSrc.includes("البحث"), "البحث متاح من التنقل أو المزيد");
  assert(sideNavSrc.includes("/my-learning") && sideNavSrc.includes("البطاقات المراجعة"), "البطاقات داخل حسابي في الجانبية");

  const gsmSrc = readFileSync(resolve(appRoot, "src/components/GlobalSearchModal.tsx"), "utf-8");
  assert(gsmSrc.includes("/flashcards") || gsmSrc.includes("/my-learning"), "رابط مراجعة من البحث الشامل");

  const flashSrc = readFileSync(resolve(appRoot, "src/views/FlashCardsPage.tsx"), "utf-8");
  assert(flashSrc.includes("Numpad1"), "جلسة المراجعة تدعم لوحة الأرقام للتقييم");
  assert(flashSrc.includes('e.key === "Enter"'), "Enter يكشف البطاقة");
  assert(flashSrc.includes('e.key === "Escape"'), "Escape يخفي الإجابة");

  const cssSrc = readFileSync(resolve(appRoot, "src/styles/final-release.css"), "utf-8");
  assert(
    cssSrc.includes(".navbar-theme-toggle.navbar-search-toggle") && cssSrc.includes("display: inline-flex"),
    "زر البحث يبقى ظاهرًا على الجوال رغم إخفاء زر الوضع الليلي",
  );
  assert(cssSrc.includes("header-ticker-marquee"), "حركة الماركي المستمرّة معرَّفة في CSS");
  assert(cssSrc.includes(".header-ticker--marquee") || cssSrc.includes("header-ticker__track"), "مسار الشريط المتحرّك موجود");
  assert(
    !/\.header-ticker__text\s*\{[^}]*text-overflow:\s*ellipsis/s.test(cssSrc),
    "نص الشريط لا يُقصّ بـ ellipsis — يُعرض كاملًا",
  );
  assert(
    !/\.header-ticker__item\s*\{[^}]*max-width:\s*min\(72vw/s.test(cssSrc),
    "عنصر الشريط بلا max-width يقصّ الحديث الطويل",
  );

  const tickerSrc = readFileSync(resolve(appRoot, "src/components/HeaderTicker.tsx"), "utf-8");
  assert(tickerSrc.includes("header-ticker--marquee"), "المكوّن يستخدم وضع الماركي المتحرّك");
  assert(tickerSrc.includes("Megaphone") || tickerSrc.includes("promo"), "يدعم عناصر ترويج الأقسام/المميزات");
  assert(tickerSrc.includes("header-ticker__source") && tickerSrc.includes("item.source"), "يعرض مصدر الحديث/الذكر مع النص");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
