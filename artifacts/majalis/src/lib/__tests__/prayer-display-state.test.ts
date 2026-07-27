/**
 * اختبارات منطق عدّاد الصلاة بمرحلتين (مضى على الأذان / الوقت المتبقي).
 * التشغيل: npx tsx src/lib/__tests__/prayer-display-state.test.ts
 */
import {
  computePrayerDisplayState,
  formatElapsedMmSs,
  formatRemainingHms,
  PRAYER_ELAPSED_WINDOW_MS,
  zonedWallTimeToDate,
  type PrayerSlotLike,
} from "../prayer-display-state";
import { computePrayerCountdown } from "../prayer-times";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

function slot(key: string, name: string, minutes: number): PrayerSlotLike {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const time24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return {
    key,
    name,
    obligatory: true,
    time24,
    time: time24,
    minutes,
  };
}

/** مواقيت اختبار ثابتة (دقائق من منتصف الليل) */
const PRAYERS: PrayerSlotLike[] = [
  slot("Fajr", "الفجر", 5 * 60), // 05:00
  slot("Dhuhr", "الظهر", 12 * 60), // 12:00
  slot("Asr", "العصر", 15 * 60 + 30), // 15:30
  slot("Maghrib", "المغرب", 18 * 60), // 18:00
  slot("Isha", "العشاء", 19 * 60 + 30), // 19:30
];

const TZ = "Asia/Kuwait";

/** يبني Date ليوم 2026-07-27 في الكويت عند ساعة/دقيقة/ثانية معينة */
function atKuwait(h: number, m: number, s = 0, day = 27, month = 7, year = 2026): Date {
  return zonedWallTimeToDate(year, month, day, h, m, s, TZ);
}

console.log("\n=== تنسيق العداد ===");
{
  assert(formatElapsedMmSs(0) === "00:00", "elapsed 0 → 00:00");
  assert(formatElapsedMmSs(1000) === "00:01", "elapsed 1s → 00:01");
  assert(formatElapsedMmSs(60_000) === "01:00", "elapsed 60s → 01:00");
  assert(formatElapsedMmSs(7 * 60_000 + 24_000) === "07:24", "elapsed 7m24s → 07:24");
  assert(formatElapsedMmSs(35 * 60_000) === "35:00", "elapsed 35m → 35:00");
  assert(formatRemainingHms(3661_000) === "01:01:01", "remaining → HH:MM:SS");
  assert(formatRemainingHms(-500) === "00:00:00", "قيم سالبة تُقصّ إلى 00:00:00");
}

console.log("\n=== قبل الأذان بثوانٍ ===");
{
  const now = atKuwait(11, 59, 57); // قبل الظهر بـ3 ثوانٍ
  const st = computePrayerDisplayState(PRAYERS, now, TZ)!;
  assert(st.mode === "remaining", "قبل الأذان: وضع remaining");
  assert(st.displayedPrayer.key === "Dhuhr", "قبل الأذان: الظهر القادمة");
  assert(st.label === "الوقت المتبقي", "قبل الأذان: الوقت المتبقي");
  assert(st.counterText === "00:00:03", `قبل الأذان بـ3ث: ${st.counterText}`);
  assert(st.elapsedSinceAdhanMs == null, "قبل الأذان: لا elapsed");
  assert(!Number.isNaN(st.counterMs) && st.counterMs >= 0, "لا NaN ولا سالب");
}

console.log("\n=== لحظة دخول وقت الأذان ===");
{
  const now = atKuwait(12, 0, 0);
  const st = computePrayerDisplayState(PRAYERS, now, TZ)!;
  assert(st.mode === "elapsed", "عند الأذان: وضع elapsed");
  assert(st.displayedPrayer.key === "Dhuhr", "عند الأذان: الظهر الحالية");
  assert(st.label === "مضى على الأذان", "عند الأذان: مضى على الأذان");
  assert(st.counterText === "00:00", `عند الأذان: ${st.counterText}`);
  assert(st.elapsedSinceAdhanMs === 0, "elapsed = 0");
}

console.log("\n=== بعد الأذان بدقيقة ===");
{
  const now = atKuwait(12, 1, 0);
  const st = computePrayerDisplayState(PRAYERS, now, TZ)!;
  assert(st.mode === "elapsed", "بعد دقيقة: elapsed");
  assert(st.counterText === "01:00", `بعد دقيقة: ${st.counterText}`);
  assert(st.displayedPrayer.key === "Dhuhr", "بعد دقيقة: ما زالت الظهر");
}

console.log("\n=== عند 34:59 ===");
{
  const now = atKuwait(12, 34, 59);
  const st = computePrayerDisplayState(PRAYERS, now, TZ)!;
  assert(st.mode === "elapsed", "34:59 ما زال elapsed");
  assert(st.counterText === "34:59", `34:59 → ${st.counterText}`);
}

console.log("\n=== عند 35:00 بالضبط ===");
{
  const now = atKuwait(12, 35, 0);
  const st = computePrayerDisplayState(PRAYERS, now, TZ)!;
  assert(st.mode === "elapsed", "35:00 شامل في elapsed");
  assert(st.counterText === "35:00", `35:00 → ${st.counterText}`);
  assert(st.elapsedSinceAdhanMs === PRAYER_ELAPSED_WINDOW_MS, "elapsedMs = نافذة 35 دقيقة");
}

console.log("\n=== بعد 35 دقيقة وثانية ===");
{
  const now = atKuwait(12, 35, 1);
  const st = computePrayerDisplayState(PRAYERS, now, TZ)!;
  assert(st.mode === "remaining", "35:01 ينتقل إلى remaining");
  assert(st.displayedPrayer.key === "Asr", "بعد النافذة: العصر القادمة");
  assert(st.label === "الوقت المتبقي", "بعد النافذة: الوقت المتبقي");
  assert(st.elapsedSinceAdhanMs == null, "بعد النافذة: لا elapsed");
  // من 12:35:01 إلى 15:30:00 = 2س 54د 59ث
  assert(st.counterText === "02:54:59", `متبقي للعصر: ${st.counterText}`);
}

console.log("\n=== العشاء → فجر اليوم التالي ===");
{
  // العشاء 19:30، بعد 35 دقيقة = 20:05 ننتقل للفجر غدًا 05:00
  const duringIsha = atKuwait(19, 30, 5);
  const st1 = computePrayerDisplayState(PRAYERS, duringIsha, TZ)!;
  assert(st1.mode === "elapsed" && st1.displayedPrayer.key === "Isha", "بعد العشاء مباشرة: elapsed للعشاء");

  const afterGrace = atKuwait(20, 5, 1);
  const st2 = computePrayerDisplayState(PRAYERS, afterGrace, TZ)!;
  assert(st2.mode === "remaining", "بعد نافذة العشاء: remaining");
  assert(st2.displayedPrayer.key === "Fajr", "الصلاة التالية فجر الغد");
  assert(st2.nextPrayerAt.getTime() > afterGrace.getTime(), "فجر الغد في المستقبل");

  // ليلة متأخرة
  const late = atKuwait(23, 0, 0);
  const st3 = computePrayerDisplayState(PRAYERS, late, TZ)!;
  assert(st3.mode === "remaining" && st3.displayedPrayer.key === "Fajr", "الساعة 23: remaining للفجر");

  // بعد منتصف الليل وقبل الفجر
  const beforeFajr = atKuwait(3, 0, 0, 28);
  const st4 = computePrayerDisplayState(PRAYERS, beforeFajr, TZ)!;
  assert(st4.mode === "remaining" && st4.displayedPrayer.key === "Fajr", "03:00: remaining للفجر");
}

console.log("\n=== توافق computePrayerCountdown ===");
{
  const now = atKuwait(12, 7, 24);
  const cd = computePrayerCountdown(PRAYERS as any, now, TZ);
  assert(cd.displayMode === "elapsed", "countdown.displayMode = elapsed");
  assert(cd.displayLabel === "مضى على الأذان", "countdown.displayLabel");
  assert(cd.sinceHms === "07:24", `sinceHms MM:SS = ${cd.sinceHms}`);
  assert(cd.remainingHms === "00:00:00", "لا يعرض متبقيًا وهميًا أثناء elapsed");
  assert(cd.next?.key === "Dhuhr", "next أثناء elapsed = الصلاة الحالية");
  assert(cd.graceNextSlot?.key === "Asr", "graceNextSlot = الصلاة التالية الفعلية");
}

console.log("\n=== لا NaN عند مواقيت ناقصة ===");
{
  const st = computePrayerDisplayState([], atKuwait(12, 0, 0), TZ);
  assert(st === null, "مواقيت فارغة → null");
}

console.log("\n=== زر المزيد — مصدر الحالة من المسار لا من ضغط معلّق ===");
{
  const navSrc = readFileSync(resolve(appRoot, "src/components/BottomNavBar.tsx"), "utf-8");
  assert(navSrc.includes("isPrimaryTabPath"), "تحديد المزيد مشتق من المسار");
  assert(navSrc.includes("moreSelected"), "moreSelected من المسار/الورقة");
  assert(navSrc.includes("[location]"), "إغلاق الورقة عند تغيّر المسار");
  assert(navSrc.includes("clearStickyFocus") || navSrc.includes(".blur()"), "إزالة التركيز المعلّق بعد اللمس");
  assert(navSrc.includes("navLockRef"), "قفل ضد الضغط المتكرر السريع");
  assert(!navSrc.includes("onTouchStart"), "لا تداخل onTouchStart مكرر مع onClick");

  const cssSrc = readFileSync(resolve(appRoot, "src/styles/final-release.css"), "utf-8");
  assert(
    cssSrc.includes("(hover: hover) and (pointer: fine)") && cssSrc.includes("bottom-nav__tab:hover"),
    "hover مقيد بأجهزة المؤشر الدقيق فقط",
  );
  assert(cssSrc.includes(":focus:not(:focus-visible)"), "منع :focus المرئي بعد اللمس");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
