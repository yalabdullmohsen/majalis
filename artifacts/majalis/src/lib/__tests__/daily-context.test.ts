/**
 * اختبارات وحدة — resolveDailyContext
 * تُشغَّل عبر: node --loader ts-node/esm src/lib/__tests__/daily-context.test.ts
 * أو: npx tsx src/lib/__tests__/daily-context.test.ts
 */

import { resolveTimeOfDay, resolveDailyContext, toHijri } from "../daily-context";

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

function makeDate(hour: number, minute = 0): Date {
  const d = new Date(2025, 0, 17, hour, minute); // جمعة ثابتة
  return d;
}

// ── الحالات الخمس للوقت ──────────────────────────────────────────────────────
console.log("\n=== resolveTimeOfDay ===");

assert(resolveTimeOfDay(4.0)  === "fajr",    "04:00 → فجر");
assert(resolveTimeOfDay(5.0)  === "fajr",    "05:00 → فجر");
assert(resolveTimeOfDay(6.0)  === "duha",    "06:00 → ضحى");
assert(resolveTimeOfDay(12.0) === "zuhr",    "12:00 → ظهر");
assert(resolveTimeOfDay(15.0) === "asr",     "15:00 → عصر");
assert(resolveTimeOfDay(17.5) === "maghrib", "17:30 → مغرب");
assert(resolveTimeOfDay(19.0) === "isha",    "19:00 → عشاء");
assert(resolveTimeOfDay(22.0) === "layl",    "22:00 → ليل");
assert(resolveTimeOfDay(1.0)  === "layl",    "01:00 → ليل");

// ── التحيات تحتوي على كلمات إسلامية لا علمانية ─────────────────────────────
console.log("\n=== التحيات الإسلامية ===");

const morningCtx = resolveDailyContext(makeDate(8, 0));
assert(morningCtx.greeting.includes("صبَّحك"), "تحية الصباح تبدأ بـ صبَّحك");
assert(!morningCtx.greeting.includes("صباح الخير"), "لا تحتوي على (صباح الخير)");

const eveningCtx = resolveDailyContext(makeDate(19, 0));
assert(eveningCtx.greeting.includes("مسَّاك"), "تحية المساء تبدأ بـ مسَّاك");
assert(!eveningCtx.greeting.includes("مساء الخير"), "لا تحتوي على (مساء الخير)");

// ── الجمعة تُنتج حدثاً خاصاً ────────────────────────────────────────────────
console.log("\n=== أحداث الأيام ===");

// 2025-01-17 كانت يوم جمعة
const fridayCtx = resolveDailyContext(new Date(2025, 0, 17, 12, 0));
assert(fridayCtx.event !== null, "الجمعة تُنتج حدثاً");
assert(fridayCtx.event!.includes("الجمعة"), "حدث الجمعة يذكر الجمعة");

// ── التحويل الهجري ─────────────────────────────────────────────────────────
console.log("\n=== toHijri ===");

// 2025-01-01 = 1 رجب 1446 (تقريباً)
const h = toHijri(new Date(2025, 0, 1));
assert(typeof h.day   === "number" && h.day   > 0,  "يوم هجري > 0");
assert(typeof h.month === "number" && h.month > 0 && h.month <= 12, "شهر هجري 1–12");
assert(typeof h.year  === "number" && h.year  > 1440, "سنة هجرية > 1440");

// ── العيد الهجري — 1 محرم ───────────────────────────────────────────────────
console.log("\n=== أحداث هجرية ===");

// نبحث عن يوم يقابل 1 محرم — نجرب عدة أيام قريبة من يوليو 2025
let foundNewYear = false;
for (let d = 0; d < 5; d++) {
  const dt = new Date(2025, 5, 26 + d); // حوالي 1 محرم 1447
  const ctx = resolveDailyContext(dt);
  if (ctx.event?.includes("السنة الهجرية")) { foundNewYear = true; break; }
}
assert(foundNewYear, "رأس السنة الهجرية مُكتشَف في النافذة الصحيحة");

// ── حقول السياق مكتملة ──────────────────────────────────────────────────────
console.log("\n=== اكتمال الحقول ===");

const ctx = resolveDailyContext(makeDate(10, 30));
assert(typeof ctx.greeting     === "string" && ctx.greeting.length > 0,     "greeting موجود");
assert(typeof ctx.subGreeting  === "string" && ctx.subGreeting.length > 0,  "subGreeting موجود");
assert(typeof ctx.suggestion   === "string" && ctx.suggestion.length > 0,   "suggestion موجود");
assert(typeof ctx.accentColor  === "string" && ctx.accentColor.startsWith("#"), "accentColor صحيح");
assert(["moon","sun","sunset","dawn"].includes(ctx.timeIcon),                "timeIcon من القائمة");

// ── hijriOffset يعمل ─────────────────────────────────────────────────────────
console.log("\n=== hijriOffset ===");

const base = resolveDailyContext(makeDate(10, 0), 0);
const plus1 = resolveDailyContext(makeDate(10, 0), 1);
assert(base.timeOfDay === plus1.timeOfDay, "hijriOffset لا يغيّر وقت اليوم");

// ── ملخص ────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
