#!/usr/bin/env node
/**
 * تشخيص مواقيت الصلاة والجدولة — يطبع حقائق لا تخمينات.
 * تشغيل من جذر المستودع أو من artifacts/majalis:
 *   node --import tsx artifacts/majalis/scripts/diagnose-prayer-times.mjs
 *   pnpm --filter @workspace/majalis run diagnose:prayer-times
 *
 * يكتب docs/PRAYER_TIME_DIAGNOSIS.md عند الجذر.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const majalisRoot = resolve(__dirname, "..");
const repoRoot = resolve(majalisRoot, "../..");
const require = createRequire(import.meta.url);

const TZ = "Asia/Kuwait";
const CAPITAL = { lat: 29.3697, lon: 47.9783, label: "الكويت · العاصمة" };

/** مرجع خارجي موثّق ليوم الشاهد (17 أغسطس 2026) — TimesPrayer / طريقة Kuwait Fajr18° Isha17.5° */
const OFFICIAL_FIXTURE_2026_08_17 = {
  source: "TimesPrayer Kuwait method (Fajr 18°, Isha 17.5°) — عاصمة الكويت 2026-08-17",
  Fajr: "03:52",
  Sunrise: "05:17",
  Dhuhr: "11:52",
  Asr: "15:28",
  Maghrib: "18:27",
  Isha: "19:49",
};

function zoneParts(date, timeZone = TZ) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    h: Number(get("hour")),
    min: Number(get("minute")),
    s: Number(get("second")),
  };
}

function dateKeyInZone(date = new Date(), timeZone = TZ) {
  const p = zoneParts(date, timeZone);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

function toZoneHm(date, timeZone = TZ) {
  const p = zoneParts(date, timeZone);
  return `${String(p.h).padStart(2, "0")}:${String(p.min).padStart(2, "0")}`;
}

function parseHm(hm) {
  const m = String(hm).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** تاريخ «ظهر ذلك اليوم» في Asia/Kuwait دون الاعتماد على المنطقة المحلية للجهاز */
function kuwaitCalendarNoon(dateISO) {
  const [y, mo, d] = dateISO.split("-").map(Number);
  // UTC+3 ثابت للكويت — ظهر محلي = 09:00 UTC
  return new Date(Date.UTC(y, mo - 1, d, 9, 0, 0));
}

/** ما يفعله الكود الحالي غالباً: new Date() ثم setHours محلياً أو تاريخ الجهاز كما هو */
function deviceLocalNoon(dateISO) {
  const [y, mo, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, mo - 1, d, 12, 0, 0, 0);
  return dt;
}

async function computeViaAdhan(date, methodFactoryName = "Kuwait") {
  const adhan = await import("adhan");
  const coordinates = new adhan.Coordinates(CAPITAL.lat, CAPITAL.lon);
  const factory =
    adhan.CalculationMethod[methodFactoryName] ?? adhan.CalculationMethod.Kuwait;
  const params = factory();
  params.madhab = adhan.Madhab.Shafi;
  const pt = new adhan.PrayerTimes(coordinates, date, params);
  return {
    Fajr: toZoneHm(pt.fajr),
    Sunrise: toZoneHm(pt.sunrise),
    Dhuhr: toZoneHm(pt.dhuhr),
    Asr: toZoneHm(pt.asr),
    Maghrib: toZoneHm(pt.maghrib),
    Isha: toZoneHm(pt.isha),
    fajrEpoch: pt.fajr.getTime(),
    maghribEpoch: pt.maghrib.getTime(),
  };
}

async function fetchAlAdhan(dateISO) {
  const [y, mo, d] = dateISO.split("-");
  const dateParam = `${d}-${mo}-${y}`;
  const url =
    `https://api.aladhan.com/v1/timings/${dateParam}` +
    `?latitude=${CAPITAL.lat}&longitude=${CAPITAL.lon}` +
    `&method=9&school=0&timezonestring=Asia%2FKuwait`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const json = await res.json();
    const t = json?.data?.timings;
    if (!t) return { error: "no timings" };
    const pick = (k) => String(t[k]).slice(0, 5);
    return {
      Fajr: pick("Fajr"),
      Sunrise: pick("Sunrise"),
      Dhuhr: pick("Dhuhr"),
      Asr: pick("Asr"),
      Maghrib: pick("Maghrib"),
      Isha: pick("Isha"),
      metaMethod: json?.data?.meta?.method?.name,
    };
  } catch (e) {
    return { error: String(e?.message || e) };
  }
}

function staticFallbackSummer() {
  return {
    Fajr: "04:00",
    Sunrise: "05:30",
    Dhuhr: "12:05",
    Asr: "16:35",
    Maghrib: "19:10",
    Isha: "20:35",
  };
}

/**
 * محاكاة epochForSlot كما في prayer-alert-scheduler.ts
 * (اعتماد kuwait wall-clock + Date.now).
 */
function simulateEpochForSlot(slotMinutes, now = new Date()) {
  const p = zoneParts(now);
  const nowMs = (p.h * 3600 + p.min * 60 + p.s) * 1000;
  const slotMs = slotMinutes * 60_000;
  let delay = slotMs - nowMs;
  if (delay < 0) delay += 24 * 3600_000;
  return now.getTime() + delay;
}

function simulateAdvanceBugWrap(slotMinutes, advMin, now = new Date()) {
  const p = zoneParts(now);
  const nowMs = (p.h * 3600 + p.min * 60 + p.s) * 1000;
  const slotMs = slotMinutes * 60_000;
  let advDelay = slotMs - nowMs - advMin * 60_000;
  const wrapped = advDelay < 0;
  if (advDelay < 0) advDelay += 24 * 3600_000;
  return {
    wrapped,
    fireAt: new Date(now.getTime() + advDelay),
    delayMs: advDelay,
  };
}

function diffMinutes(a, b) {
  const am = parseHm(a);
  const bm = parseHm(b);
  if (am == null || bm == null) return null;
  return bm - am;
}

function tableRow(name, row) {
  if (row.error) return `| ${name} | خطأ: ${row.error} | | | | | |`;
  return `| ${name} | ${row.Fajr} | ${row.Sunrise} | ${row.Dhuhr} | ${row.Asr} | ${row.Maghrib} | ${row.Isha} |`;
}

async function main() {
  const now = new Date();
  const todayKey = dateKeyInZone(now);
  const incidentKey = "2026-08-17";
  const keys = [...new Set([todayKey, incidentKey])];

  const tzResolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetMin = now.getTimezoneOffset();

  const lines = [];
  const push = (s = "") => lines.push(s);

  push("# تشخيص مواقيت الصلاة والإشعارات");
  push("");
  push(`تاريخ التقرير (UTC): ${now.toISOString()}`);
  push(`اليوم في Asia/Kuwait: **${todayKey}**`);
  push("");
  push("## 0 — البيئة");
  push("");
  push("```");
  push(`Intl timeZone (الجهاز): ${tzResolved}`);
  push(`getTimezoneOffset(): ${offsetMin} (دقائق؛ سالب = شرق UTC)`);
  push(`Asia/Kuwait الآن: ${toZoneHm(now)}:${String(zoneParts(now).s).padStart(2, "0")}`);
  push("```");
  push("");
  push("> ملاحظة: `LocalNotifications.getPending()` لا يعمل في Node — يُنفَّذ على الجهاز.");
  push("> هنا نحاكي ما يبنيه `prayer-alert-scheduler` / `prayer-local-notifications` / `adhan-scheduler`.");
  push("");

  for (const dateISO of keys) {
    push(`## 1 — مواقيت ${dateISO} جنباً إلى جنب`);
    push("");
    push("| المصدر | الفجر | الشروق | الظهر | العصر | المغرب | العشاء |");
    push("|---|---|---|---|---|---|---|");

    const kuwaitNoon = kuwaitCalendarNoon(dateISO);
    const deviceNoon = deviceLocalNoon(dateISO);
    const viaKuwaitNoon = await computeViaAdhan(kuwaitNoon);
    const viaDeviceNoon = await computeViaAdhan(deviceNoon);
    const viaNowDate = dateISO === todayKey ? await computeViaAdhan(now) : null;
    const aladhan = await fetchAlAdhan(dateISO);
    const fallback = staticFallbackSummer();

    push(tableRow("adhan-js · ظهر تقويمي Kuwait (UTC+3)", viaKuwaitNoon));
    push(tableRow("adhan-js · ظهر الجهاز المحلي (new Date y,m,d,12)", viaDeviceNoon));
    if (viaNowDate) push(tableRow("adhan-js · new Date() الآن (مسار العدّاد الحالي)", viaNowDate));
    push(tableRow("AlAdhan API method=9 school=0", aladhan));
    if (dateISO === incidentKey) {
      push(
        tableRow(
          "مرجع خارجي (تجهيزة رسمية تقريبية)",
          OFFICIAL_FIXTURE_2026_08_17,
        ),
      );
    }
    push(tableRow("staticPrayerFallback (صيفي)", fallback));
    push("");

    const magDiffDevice = diffMinutes(viaKuwaitNoon.Maghrib, viaDeviceNoon.Maghrib);
    const magDiffAl =
      !aladhan.error && diffMinutes(viaKuwaitNoon.Maghrib, aladhan.Maghrib);
    const magDiffFb = diffMinutes(viaKuwaitNoon.Maghrib, fallback.Maghrib);

    push("### فروقات المغرب (دقيقة؛ موجب = المصدر أبطأ من ظهر Kuwait)");
    push("");
    push(`- جهاز محلي مقابل ظهر Kuwait: **${magDiffDevice}**`);
    push(`- AlAdhan مقابل ظهر Kuwait: **${magDiffAl ?? "N/A"}**`);
    push(`- fallback صيفي مقابل ظهر Kuwait: **${magDiffFb}**`);
    if (dateISO === incidentKey) {
      const vsOfficial = diffMinutes(
        OFFICIAL_FIXTURE_2026_08_17.Maghrib,
        viaKuwaitNoon.Maghrib,
      );
      push(`- adhan ظهر Kuwait مقابل التجهيزة الرسمية: **${vsOfficial}**`);
    }
    push("");

    const sourcesDiffer =
      viaKuwaitNoon.Maghrib !== viaDeviceNoon.Maghrib ||
      (viaNowDate && viaNowDate.Maghrib !== viaKuwaitNoon.Maghrib) ||
      (!aladhan.error && aladhan.Maghrib !== viaKuwaitNoon.Maghrib) ||
      fallback.Maghrib !== viaKuwaitNoon.Maghrib;

    push(
      sourcesDiffer
        ? "**العطل (ب) ثابت في هذا اليوم:** صفّان أو أكثر يختلفان."
        : "لا اختلاف ظاهر بين المسارات المحسوبة لهذا اليوم (ما عدا fallback إن وُجد).",
    );
    push("");

    // محاكاة الجدولة
    const magMin = parseHm(viaKuwaitNoon.Maghrib);
    const preMin = 15;
    const prayerEpoch = simulateEpochForSlot(magMin, now);
    const correctPre = prayerEpoch - preMin * 60_000;
    const wrongSignPre = prayerEpoch + preMin * 60_000;
    const advWrap = simulateAdvanceBugWrap(magMin, preMin, now);

    push(`## 2 — محاكاة إشعار المغرب (${dateISO})`);
    push("");
    push("```");
    push(`مغرب محسوب (ظهر Kuwait): ${viaKuwaitNoon.Maghrib}`);
    push(`epochForSlot(مغرب) ≈ ${new Date(prayerEpoch).toISOString()} (Asia/Kuwait ${toZoneHm(new Date(prayerEpoch))})`);
    push(`pre الصحيح (−15): ${new Date(correctPre).toISOString()} → ${toZoneHm(new Date(correctPre))}`);
    push(`pre بإشارة خاطئة (+15): ${new Date(wrongSignPre).toISOString()} → ${toZoneHm(new Date(wrongSignPre))}`);
    push(`adhan-scheduler wrap عند advDelay<0: wrapped=${advWrap.wrapped} fireAt=${advWrap.fireAt.toISOString()} (${toZoneHm(advWrap.fireAt)})`);
    push("```");
    push("");
    push("### قراءة الإشارة");
    push("");
    push("- في `prayer-local-notifications.ts` الإشارة **سالبة** اليوم: `prayerTimeEpochMs - preAlertMinutes`.");
    push("- في `adhan-scheduler.ts` عند `advDelay < 0` يُلفّ إلى **+24 ساعة** بدل تخطي نافذة اليوم — إن فُتحت النافذة بعد وقت التنبيه المسبق يُجدول لغدٍ.");
    push("- نص «باقي ربع ساعة» **ثابت** في القوالب (`pre-15`) ولا يُشتق من الفارق الفعلي عند الإطلاق.");
    push("");

    if (dateISO === incidentKey) {
      const officialMag = parseHm(OFFICIAL_FIXTURE_2026_08_17.Maghrib);
      const scheduledMag = magMin;
      const deltaSchedVsOfficial = scheduledMag - officialMag;
      push("### سيناريو الشاهد (إشعار بعد المغرب ~١٥ د)");
      push("");
      push(`- إن كان المغرب المجدول = الرسمي + ${deltaSchedVsOfficial} د، فالتنبيه المسبق (−١٥) يقع عند الرسمي + ${deltaSchedVsOfficial - 15} د.`);
      push(
        `- إن كان المجدول مطابقاً والرسمي ${OFFICIAL_FIXTURE_2026_08_17.Maghrib} والتنبيه وصل ~${toZoneHm(new Date(wrongSignPre))} فهذا يطابق **إشارة +١٥** لا −١٥.`,
      );
      push(
        `- إن استُخدم fallback الصيفي (مغرب 19:10): التنبيه المسبق عند 18:55 — أي **بعد** مغرب 18:27 بـ~٢٨ د (قريب من وصف المستخدم).`,
      );
      push("");
    }
  }

  push("## 3 — مسارات الحساب في الشيفرة (جرد)");
  push("");
  push("| المسار | الملف | المستهلك |");
  push("|---|---|---|");
  push("| `computePrayerTimesForDate` / `fetchPrayerTimes` (adhan-js + كاش) | `prayer-times.ts` | العدّاد، اللوبي، المجدول، الإمساكية السنوية |");
  push("| `refreshPrayerTimesInBackground` → Supabase / `/api/prayer-times` / AlAdhan | `prayer-times.ts` | قد **يستبدل الكاش** بأرقام مختلفة دون إعادة جدولة فورية |");
  push("| `staticPrayerFallback` | `prayer-times.ts` | عند فشل الحساب — مغرب صيفي 19:10 |");
  push("| `startPrayerAlertScheduler` → Capacitor LocalNotifications | `prayer-alert-scheduler.ts` | إشعارات أصلية |");
  push("| `startAdhanScheduler` → مؤقّتات JS + SW | `adhan-scheduler.ts` | أذان + تنبيه مسبق ويب |");
  push("");

  push("## 4 — آخر جدولة (من التخزين — إن وُجد في بيئة المتصفح فقط)");
  push("");
  push("مفتاح `majalis-prayer-schedule-status-v1` عبر `prayer-schedule-status.ts`.");
  push("في Node: غير متاح. على الجهاز اطبع `loadPrayerScheduleStatus()` والمحافظة وطريقة الحساب.");
  push("");

  push("## 5 — خلاصة قبل الإصلاح (حقائق)");
  push("");
  push("1. يوجد أكثر من مصدر مواقيت قابل للاختلاف (adhan محلي، AlAdhan، Supabase، fallback) — **العطل (ب) ممكن ومُلاحَظ بين fallback/AlAdhan والجهاز.**");
  push("2. بناء `Date` لـ adhan-js من مكوّنات الجهاز المحلي يختلف عن ظهر تقويمي Kuwait عندما تختلف منطقة الجهاز — مرشّح جذري لـ(ب).");
  push("3. إشارة التنبيه المسبق في المسار الأصلي **سالبة** في الشيفرة الحالية؛ إن طابق الشاهد +١٥ فالمصدر إمّا مسار آخر/نسخة قديمة، أو مواقيت مجدولة متأخرة عن الرسمي، أو fallback.");
  push("4. لفّ `advDelay < 0` إلى الغد في `adhan-scheduler` عطل مستقل يُسقط تنبيه اليوم داخل النافذة.");
  push("5. النص الثابت «باقي ربع ساعة» يخفي أي انحراف عند الإطلاق.");
  push("");
  push("---");
  push("");
  push("*وُلِّد آلياً بواسطة `artifacts/majalis/scripts/diagnose-prayer-times.mjs` — لا تعديل مواقيت يدوي في هذا الملف.*");

  const outPath = join(repoRoot, "docs/PRAYER_TIME_DIAGNOSIS.md");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  console.log(lines.join("\n"));
  console.log(`\n✓ كُتب ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
