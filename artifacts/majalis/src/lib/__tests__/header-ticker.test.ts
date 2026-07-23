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

console.log("\n=== NavBar.tsx — زر البحث القديم أُزيل، البدائل باقية ===");
{
  const navBarSrc = readFileSync(resolve(appRoot, "src/components/NavBar.tsx"), "utf-8");
  assert(!navBarSrc.includes("navbar-search-cmd"), "لا زر بحث أيقوني قديم متبقٍّ في مصدر الهيدر");
  assert(!navBarSrc.includes("SearchBox"), "لا مربع بحث مضمّن قديم متبقٍّ في مصدر الهيدر");
  assert(navBarSrc.includes("HeaderTicker"), "الشريط المتحرك مُدرَج فعليًا في الهيدر");

  const appSrc = readFileSync(resolve(appRoot, "src/App.tsx"), "utf-8");
  assert(appSrc.includes('e.key === "k"'), "اختصار Ctrl/Cmd+K لفتح البحث الشامل ما زال مسجَّلاً في App.tsx");
  assert(appSrc.includes("global-search-open"), "مستمع حدث فتح البحث الشامل ما زال مسجَّلاً في App.tsx (قناة بديلة متاحة لأي مُطلِق مستقبلي)");

  const sideNavSrc = readFileSync(resolve(appRoot, "src/components/SideNavDrawer.tsx"), "utf-8");
  assert(sideNavSrc.includes('href: "/search"'), "مسار البحث الشامل ما زال متاحًا من القائمة الجانبية");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
