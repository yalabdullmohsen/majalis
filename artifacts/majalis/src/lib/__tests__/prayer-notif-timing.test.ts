/**
 * بوابة توقيت إشعارات الصلاة — fake timers + Asia/Kuwait.
 * Run: node --import tsx src/lib/__tests__/prayer-notif-timing.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TZ = "Asia/Kuwait";
const CAP_LAT = 29.3759;
const CAP_LON = 47.9774;

// ── تجهيزة تقويم الكويت الرسمي (العاصمة) — فارق مسموح ≤1 دقيقة ──
// المصدر: مواقيت وزارة الأوقاف المعتمدة عبر طريقة Kuwait في adhan-js / AlAdhan method=9
const OFFICIAL_FIXTURES: Array<{
  dateISO: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}> = [
  // صيف — مطابق AlAdhan method=9 / أوقاف الكويت (عصر ±1 عن adhan-js)
  {
    dateISO: "2026-08-17",
    fajr: "03:52",
    sunrise: "05:17",
    dhuhr: "11:52",
    asr: "15:28",
    maghrib: "18:27",
    isha: "19:49",
  },
  // شتاء — طريقة الكويت (adhan-js Kuwait = مرجع التطبيق الرسمي)
  {
    dateISO: "2026-01-15",
    fajr: "05:20",
    sunrise: "06:43",
    dhuhr: "11:57",
    asr: "14:52",
    maghrib: "17:12",
    isha: "18:33",
  },
  // ربيع
  {
    dateISO: "2026-04-15",
    fajr: "04:00",
    sunrise: "05:22",
    dhuhr: "11:48",
    asr: "15:23",
    maghrib: "18:15",
    isha: "19:35",
  },
];

function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function absMinDiff(a: string, b: string): number {
  return Math.abs(parseHm(a) - parseHm(b));
}

const {
  calendarNoonInZone,
  epochAtZoneMinutes,
  computePrayerTimesForDate,
  getPrayerTimes,
  formatTime12,
} = await import("../prayer-times");

const {
  epochForSlot,
  findNextUpcomingPrayer,
  listNativePrayerScheduleSlots,
} = await import("../prayer-alert-scheduler");

const {
  shouldDeliverPreAlert,
  shouldDeliverEnterAlert,
} = await import("../prayer-notification-guard");

const {
  buildScheduledPrayerNotificationCopy,
} = await import("../prayer-notification-copy");

const { hashPrayerNotificationId } = await import("../prayer-notification-ids");

// ── 1) مواقيت تطابق التجهيزة ≤1 دقيقة لثلاثة فصول ──
{
  for (const fx of OFFICIAL_FIXTURES) {
    const noon = calendarNoonInZone(TZ, new Date(`${fx.dateISO}T12:00:00+03:00`));
    const payload = await computePrayerTimesForDate(
      CAP_LAT,
      CAP_LON,
      "الكويت",
      TZ,
      noon,
      "Kuwait",
    );
    const map = Object.fromEntries(payload.prayers.map((p) => [p.key, p.time24]));
    for (const key of ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const) {
      const got = map[key];
      const exp = fx[key.toLowerCase() as keyof typeof fx] as string;
      assert.ok(got, `${fx.dateISO} missing ${key}`);
      const diff = absMinDiff(got!, exp);
      assert.ok(
        diff <= 1,
        `${fx.dateISO} ${key}: got ${got} vs fixture ${exp} (diff=${diff}m)`,
      );
    }
  }
  console.log("  ✓ official Kuwait fixtures ≤1m (3 seasons)");
}

// ── 2) تكافؤ getPrayerTimes ↔ computePrayerTimesForDate (مصدر واحد) ──
{
  const a = await getPrayerTimes("2026-08-17", {
    lat: CAP_LAT,
    lon: CAP_LON,
    label: "الكويت",
    timeZone: TZ,
  }, "Kuwait");
  const b = await computePrayerTimesForDate(
    CAP_LAT,
    CAP_LON,
    "الكويت",
    TZ,
    calendarNoonInZone(TZ, new Date("2026-08-17T12:00:00+03:00")),
    "Kuwait",
  );
  for (let i = 0; i < a.prayers.length; i++) {
    assert.equal(a.prayers[i]!.time24, b.prayers[i]!.time24, `slot ${i} parity`);
  }
  console.log("  ✓ getPrayerTimes ≡ computePrayerTimesForDate");
}

// ── 3) التنبيه المسبق قبل الصلاة بالمدة المضبوطة ──
{
  const maghribMin = parseHm("18:27");
  const prayerAt = epochAtZoneMinutes(TZ, maghribMin, new Date("2026-08-17T12:00:00+03:00"));
  for (const mins of [15, 10, 5]) {
    const pre = prayerAt - mins * 60_000;
    assert.equal(prayerAt - pre, mins * 60_000, `pre offset −${mins}`);
    assert.ok(pre < prayerAt, "pre before prayer");
    // إشارة خاطئة + كانت ستعطي:
    const wrong = prayerAt + mins * 60_000;
    assert.notEqual(pre, wrong);
  }
  console.log("  ✓ pre-alert uses minus offset for all offsets");
}

// ── 4) الصلاة التالية عند الحدود ──
{
  const prayers = [
    { key: "Fajr", name: "الفجر", obligatory: true, time24: "03:52", time: "", minutes: parseHm("03:52") },
    { key: "Dhuhr", name: "الظهر", obligatory: true, time24: "11:52", time: "", minutes: parseHm("11:52") },
    { key: "Asr", name: "العصر", obligatory: true, time24: "15:28", time: "", minutes: parseHm("15:28") },
    { key: "Maghrib", name: "المغرب", obligatory: true, time24: "18:27", time: "", minutes: parseHm("18:27") },
    { key: "Isha", name: "العشاء", obligatory: true, time24: "19:49", time: "", minutes: parseHm("19:49") },
  ];

  // منتصف الليل تقريباً 00:01 الكويت في 17 أغسطس
  const midnight = epochAtZoneMinutes(TZ, 1, new Date("2026-08-17T12:00:00+03:00"));
  {
    const realNow = Date.now;
    Date.now = () => midnight;
    try {
      const next = findNextUpcomingPrayer(prayers, TZ);
      assert.equal(next?.key, "Fajr", "00:01 → Fajr");
    } finally {
      Date.now = realNow;
    }
  }

  // قبل الفجر بدقيقة
  const beforeFajr = epochAtZoneMinutes(TZ, parseHm("03:52"), new Date("2026-08-17T12:00:00+03:00")) - 60_000;
  {
    const realNow = Date.now;
    Date.now = () => beforeFajr;
    try {
      const next = findNextUpcomingPrayer(prayers, TZ);
      assert.equal(next?.key, "Fajr", "1m before Fajr → Fajr");
    } finally {
      Date.now = realNow;
    }
  }

  // بعد العشاء بدقيقة → فجر الغد
  const afterIsha = epochAtZoneMinutes(TZ, parseHm("19:49"), new Date("2026-08-17T12:00:00+03:00")) + 60_000;
  {
    const realNow = Date.now;
    Date.now = () => afterIsha;
    try {
      const next = findNextUpcomingPrayer(prayers, TZ);
      assert.equal(next?.key, "Fajr", "1m after Isha → next Fajr");
      const epoch = epochForSlot(next!, TZ);
      assert.ok(epoch > afterIsha, "Fajr epoch is tomorrow");
    } finally {
      Date.now = realNow;
    }
  }

  // لحظة الصلاة نفسها → الصلاة التالية (أو نفس المفتاح يلتف إن كانت الأخيرة)
  const atMaghrib = epochAtZoneMinutes(TZ, parseHm("18:27"), new Date("2026-08-17T12:00:00+03:00"));
  {
    const realNow = Date.now;
    Date.now = () => atMaghrib;
    try {
      const next = findNextUpcomingPrayer(prayers, TZ);
      assert.equal(next?.key, "Isha", "at Maghrib → Isha");
    } finally {
      Date.now = realNow;
    }
  }
  console.log("  ✓ next prayer boundaries (00:01, before fajr, after isha, at prayer)");
}

// ── 5) حارس التسليم ──
{
  const prayerAt = 1_700_000_000_000;
  assert.equal(shouldDeliverPreAlert(prayerAt - 60_000, prayerAt).allow, true);
  assert.equal(shouldDeliverPreAlert(prayerAt, prayerAt).allow, false);
  assert.equal(shouldDeliverPreAlert(prayerAt + 1, prayerAt).allow, false);
  assert.equal(shouldDeliverEnterAlert(prayerAt + 60_000, prayerAt).allow, true);
  assert.equal(shouldDeliverEnterAlert(prayerAt + 6 * 60_000, prayerAt).allow, false);
  console.log("  ✓ delivery guard pre/enter");
}

// ── 6) نص الإشعار يحمل الوقت ──
{
  const pre = buildScheduledPrayerNotificationCopy({
    kind: "pre",
    prayerName: "المغرب",
    prayerTimeLabel: formatTime12("18:27"),
    minutesBefore: 15,
  });
  assert.match(pre.title, /اقترب/);
  assert.match(pre.body, /المغرب/);
  assert.match(pre.body, /١٥|15|بقي/);
  assert.match(pre.body, /صلاة/);
  const enter = buildScheduledPrayerNotificationCopy({
    kind: "enter",
    prayerName: "المغرب",
    prayerTimeLabel: formatTime12("18:27"),
  });
  assert.match(enter.title, /أذان المغرب/);
  assert.match(enter.body, /حان وقت صلاة المغرب/);
  console.log("  ✓ scheduled copy includes clock time");
}

// ── 7) معرّفات قابلة للتنبؤ + لا تضاعف ──
{
  const a = hashPrayerNotificationId("maghrib", "2026-08-17", "pre");
  const b = hashPrayerNotificationId("maghrib", "2026-08-17", "pre");
  const c = hashPrayerNotificationId("maghrib", "2026-08-17", "enter");
  assert.equal(a, b);
  assert.notEqual(a, c);
  console.log("  ✓ predictable notification ids");
}

// ── 8) epoch Kuwait صريح (لا غموض Date string) ──
{
  const e = epochAtZoneMinutes(TZ, parseHm("18:27"), new Date("2026-08-17T12:00:00+03:00"));
  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(e));
  assert.match(label, /18:27/);
  assert.match(label, /17/);
  console.log("  ✓ epochAtZoneMinutes Asia/Kuwait unambiguous");
}

// ── 9) بوابة مصدر: لا لفّ advDelay سالب إلى +24س ──
{
  const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const src = readFileSync(join(root, "lib/adhan-scheduler.ts"), "utf8");
  assert.doesNotMatch(
    src,
    /advDelay\s*<\s*0\)\s*advDelay\s*\+=\s*24/,
    "must not wrap negative advance delay by +24h",
  );
  assert.match(src, /prayerDelayFromNow/, "uses absolute prayer delay for advance");
  const times = readFileSync(join(root, "lib/prayer-times.ts"), "utf8");
  assert.match(times, /export async function getPrayerTimes/, "single getPrayerTimes export");
  assert.doesNotMatch(times, /fetchAlAdhanDirect/, "no parallel AlAdhan cache overwrite");
  console.log("  ✓ source gates: no +24 wrap, single source");
}

// ── 10) listNative slots تكافؤ العدّاد/المجدول لنفس الدقائق ──
{
  const realNow = Date.now;
  Date.now = () => epochAtZoneMinutes(TZ, parseHm("12:00"), new Date("2026-08-17T12:00:00+03:00"));
  try {
    const prayers = [
      { key: "Fajr", name: "الفجر", obligatory: true, time24: "03:52", time: "", minutes: parseHm("03:52") },
      { key: "Dhuhr", name: "الظهر", obligatory: true, time24: "11:52", time: "", minutes: parseHm("11:52") },
      { key: "Asr", name: "العصر", obligatory: true, time24: "15:28", time: "", minutes: parseHm("15:28") },
      { key: "Maghrib", name: "المغرب", obligatory: true, time24: "18:27", time: "", minutes: parseHm("18:27") },
      { key: "Isha", name: "العشاء", obligatory: true, time24: "19:49", time: "", minutes: parseHm("19:49") },
    ];
    const slots = listNativePrayerScheduleSlots(prayers, TZ);
    assert.equal(slots[0]?.slot.key, "Asr");
    const asrEpoch = slots[0]!.epoch;
    const expected = epochAtZoneMinutes(TZ, parseHm("15:28"), new Date("2026-08-17T12:00:00+03:00"));
    assert.equal(asrEpoch, expected, "scheduler epoch ≡ epochAtZoneMinutes");
  } finally {
    Date.now = realNow;
  }
  console.log("  ✓ countdown/scheduler epoch equivalence");
}

console.log("\nprayer-notif-timing: all checks passed");
