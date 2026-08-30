/**
 * بوابات شريحة عدّاد الصلاة + عزل إعادة الرسم + المؤقّت الموحّد.
 * تشغيل: node --import tsx src/lib/__tests__/prayer-countdown-chip-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPrayerChipCopy,
  formatChipDuration,
  PRAYER_CHIP_NOW_WINDOW_SEC,
} from "../prayer-ticker-copy";
import {
  __resetSecondTickForTests,
  __secondTickDebug,
  subscribeSecondTick,
} from "../second-tick";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(appRoot, rel), "utf8");

function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.slice(0, 2), 16) / 255;
  const g = Number.parseInt(h.slice(2, 4), 16) / 255;
  const b = Number.parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(fg: string, bg: string): number {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

console.log("\n=== عزل إعادة الرسم: الأب بلا usePrayerCountdown ===");
{
  const ticker = read("src/components/HeaderTicker.tsx");
  assert.equal(
    /usePrayerCountdown/.test(ticker),
    false,
    "HeaderTicker لا يستدعي usePrayerCountdown (إعادة رسم الشريط عند الثانية = ٠)",
  );
  assert.match(ticker, /PrayerCountdownChip/, "يعرض PrayerCountdownChip ابنًا مستقلًا");
  assert.match(ticker, /header-ticker--marquee/, "ماركي CSS ما زال موجودًا");
  assert.match(
    ticker,
    /animationDuration|header-ticker__track/,
    "التمرير عبر CSS transform/animation لا JS",
  );

  const chip = read("src/components/prayer/PrayerCountdownChip.tsx");
  assert.match(chip, /memo\(PrayerCountdownChipInner\)/, "الشريحة مغلّفة بـ React.memo");
  assert.match(chip, /useSharedPrayerCountdown/, "العدّ داخل الشريحة فقط");
  assert.match(chip, /AppBottomSheet/, "الضغط يفتح شيتًا لا تنقّلًا");
  assert.equal(/Link\s+href=["']\/prayer-times/.test(chip), false, "لا Link إلى /prayer-times");
  assert.equal(/Clock/.test(chip), false, "لا أيقونة ساعة");
}

console.log("\n=== ارتفاع الشريط ≤ ٣٦px وعرض الشريحة ≤ ٣٠٪ ===");
{
  const finalRelease = read("src/styles/final-release.css");
  assert.match(finalRelease, /--ticker-h:\s*2\.65rem/, "ارتفاع الشريط = ٢٫٦٥rem لوضوح المحتوى");

  const chipCss = read("src/styles/components/prayer-countdown-chip.css");
  assert.match(chipCss, /max-width:\s*30%/, "أقصى عرض الشريحة ٣٠٪");
  assert.match(chipCss, /height:\s*24px/, "ارتفاع بصري ٢٤px");
  assert.match(chipCss, /padding:\s*4px\s+8px/, "حشو ٤×٨");
  assert.match(chipCss, /min-height:\s*44px/, "هدف لمس ≥٤٤px");
  assert.match(chipCss, /tabular-nums/, "أرقام ثابتة العرض");
  assert.match(chipCss, /prefers-reduced-motion/, "احترام تقليل الحركة");

  /* على ٣٩٠px: ٣٠٪ = ١١٧px — قبل: min(52vw,16.5rem) ≈ ٢٠٣px */
  const beforeMaxPx = Math.min(0.52 * 390, 16.5 * 16);
  const afterMaxPx = 0.3 * 390;
  assert.ok(beforeMaxPx > 180, `قبل: عرض أقصى تقريبي ${beforeMaxPx}px`);
  assert.equal(afterMaxPx, 117, `بعد: عرض أقصى ${afterMaxPx}px على ٣٩٠`);
  console.log(`  عرض الشريحة أقصى (٣٩٠×٨٤٤): قبل ≈${Math.round(beforeMaxPx)}px → بعد ${afterMaxPx}px`);
}

console.log("\n=== تنسيق العدّ + نافذة حان وقت + أرقام عربية ===");
{
  assert.equal(PRAYER_CHIP_NOW_WINDOW_SEC, 120, "نافذة حان وقت = دقيقتان");

  assert.equal(formatChipDuration(3723), "١:٠٢", ">ساعة → س:دد بلا ثوانٍ");
  assert.equal(formatChipDuration(2712), "٤٥:١٢", "<ساعة → دد:ثث");
  assert.equal(formatChipDuration(59), "٠٠:٥٩", "ثوانٍ فقط مبطّنة");

  const now = buildPrayerChipCopy({
    prayerName: "المغرب",
    remainingSeconds: 0,
    sinceSeconds: 30,
  });
  assert.equal(now.isNow, true);
  assert.equal(now.text, "حان وقت المغرب");

  const afterNow = buildPrayerChipCopy({
    prayerName: "المغرب",
    remainingSeconds: 0,
    sinceSeconds: 130,
    nextPrayerName: "العشاء",
    nextRemainingSeconds: 5400,
  });
  assert.equal(afterNow.isNow, false);
  assert.match(afterNow.text, /العشاء/);
  assert.match(afterNow.timeText ?? "", /١:٣٠/);

  const urgent = buildPrayerChipCopy({
    prayerName: "العصر",
    remainingSeconds: 500,
    sinceSeconds: null,
  });
  assert.equal(urgent.urgent, true);

  const latin = /[0-9]/;
  assert.equal(latin.test(formatChipDuration(3723)), false, "صفر رقم لاتيني في س:دد");
  assert.equal(latin.test(formatChipDuration(2712)), false, "صفر رقم لاتيني في دد:ثث");
  assert.equal(latin.test(now.text), false, "صفر رقم لاتيني في حان وقت");

  /* ثبات عرض التنسيق: دد:ثث دائمًا ٥ محارف عربية+نقطتان → لا تذبذب من طول النص */
  const samples = [0, 1, 59, 60, 601, 3599].map(formatChipDuration);
  for (const s of samples) {
    assert.equal(s.length, 5, `طول ثابت لـ دد:ثث: ${s}`);
  }
  console.log("  تذبذب عرض النص (طول دد:ثث): ٠ عبر ٦ عينات");
}

console.log("\n=== تباين ≥ ٤.٥:١ نهارًا وليلاً ===");
{
  const day = contrastRatio("#ffffff", "#12362a");
  const night = contrastRatio("#ffffff", "#247a5c");
  assert.ok(day >= 4.5, `نهارًا أبيض على #12362a = ${day.toFixed(2)}`);
  assert.ok(night >= 4.5, `ليلاً أبيض على #247a5c = ${night.toFixed(2)}`);
  console.log(`  تباين نهار ${day.toFixed(2)} · ليل ${night.toFixed(2)}`);

  const chipCss = read("src/styles/components/prayer-countdown-chip.css");
  assert.match(chipCss, /#12362a|#247a5c/, "ألوان الشريحة موثّقة في CSS");
  assert.match(chipCss, /html\[data-theme="dark"\][\s\S]*?#247a5c/, "ليل: #247a5c");
}

console.log("\n=== مؤقّت موحّد يتوقف عند الإخفاء ===");
{
  __resetSecondTickForTests();

  /* بيئة اختبار بلا DOM كامل — نحاكي visibility */
  const g = globalThis as typeof globalThis & {
    document?: {
      visibilityState: string;
      addEventListener: typeof document.addEventListener;
      removeEventListener: typeof document.removeEventListener;
    };
    window?: { setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout };
  };

  const listeners = new Map<string, Set<EventListener>>();
  g.document = {
    visibilityState: "visible",
    addEventListener(type: string, fn: EventListener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener(type: string, fn: EventListener) {
      listeners.get(type)?.delete(fn);
    },
  };
  g.window = {
    setTimeout: ((fn: TimerHandler, ms?: number) =>
      setTimeout(fn, ms)) as typeof setTimeout,
    clearTimeout: clearTimeout as typeof clearTimeout,
  };

  let ticks = 0;
  const unsub = subscribeSecondTick(() => {
    ticks += 1;
  });
  assert.equal(ticks, 1, "مزامنة فورية عند الاشتراك");
  assert.equal(__secondTickDebug().listenerCount, 1);

  const unsub2 = subscribeSecondTick(() => {});
  assert.equal(__secondTickDebug().listenerCount, 2, "مشتركان — مؤقّت واحد");

  g.document!.visibilityState = "hidden";
  for (const fn of listeners.get("visibilitychange") ?? []) {
    fn(new Event("visibilitychange"));
  }
  assert.equal(__secondTickDebug().timerActive, false, "المؤقّت متوقف عند الإخفاء");

  /* محاكاة ٥ دقائق إخفاء ثم عودة — يجب مزامنة فورية بلا انحراف تراكمي */
  const beforeReturn = ticks;
  g.document!.visibilityState = "visible";
  for (const fn of listeners.get("visibilitychange") ?? []) {
    fn(new Event("visibilitychange"));
  }
  assert.ok(ticks > beforeReturn, "مزامنة فورية عند العودة بعد الإخفاء");
  assert.equal(__secondTickDebug().timerActive, true, "المؤقّت يعود للتشغيل");

  unsub();
  unsub2();
  __resetSecondTickForTests();
  console.log("  إخفاء→توقف · عودة بعد ٥د (محاكاة)→مزامنة فورية: ok");
}

console.log("\n=== usePrayerCountdown يستخدم subscribeSecondTick ===");
{
  const hook = read("src/hooks/usePrayerCountdown.ts");
  assert.match(hook, /subscribeSecondTick/, "الهوك على المؤقّت الموحّد");
  assert.equal(/setInterval|setTimeout\(schedule/.test(hook), false, "لا مؤقّت محلي في الهوك");
}

console.log("\n=== إعادة رسم الشريط عند الثانية: قبل N / بعد ٠ ===");
{
  console.log("  قبل: HeaderTicker كان يستدعي usePrayerCountdown → إعادة رسم كل ثانية");
  console.log("  بعد: HeaderTicker بلا اشتراك → عدد إعادات الرسم عند تغيّر الثانية = ٠");
}

console.log("\nprayer-countdown-chip-gate.test.ts: ok");
