/**
 * بوابة شرعية: أذان الفجر = نسخة تثويب مستقلة فقط.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-fajr-thasweeb.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_MUEZZIN_ID,
  MUEZZINS,
  getDefaultFajrMuezzin,
  getMuezzin,
  hasFajrAdhan,
  listSelectableMuezzins,
  playAdhan,
} from "../adhan-audio";
import {
  getEffectiveMuezzinId,
  sanitizeFajrMuezzinPrefs,
  type AdhanPreferences,
} from "../adhan-preferences";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

// ── كتالوج: كل fajrUrl مستقل ومسار تثويب (CDN /fajr/ أو محلي makkah-fajr) ─
for (const m of MUEZZINS) {
  if (!m.fajrUrl) continue;
  assert.notEqual(m.fajrUrl, m.audioUrl, `${m.id}: fajrUrl ≠ audioUrl`);
  assert.match(
    m.fajrUrl,
    /\/fajr\/|makkah-fajr|[-_/]fajr\./i,
    `${m.id}: fajrUrl مسار تثويب`,
  );
  assert.ok(hasFajrAdhan(m) || !m.audioAvailable, `${m.id}: hasFajrAdhan`);
}

const fajrCapable = listSelectableMuezzins({ requireFajr: true });
assert.ok(fajrCapable.length >= 1, "يوجد تسجيل فجر واحد على الأقل");
assert.ok(
  fajrCapable.every((m) => hasFajrAdhan(m)),
  "كل اختيارات الفجر لها تثويب",
);

const generalOnly = listSelectableMuezzins().filter((m) => !m.fajrUrl);
assert.ok(generalOnly.length >= 1, "يوجد تسجيلات عامة بلا فجر (لاختبار الاستبعاد)");
assert.ok(
  !fajrCapable.some((m) => generalOnly.some((g) => g.id === m.id)),
  "لا يتداخل العام-فقط مع قائمة الفجر",
);

// ── تفضيلات: الفجر لا يستقر على ملف بلا تثويب ───────────────────────────
const basePrefs: AdhanPreferences = {
  globalEnabled: true,
  browserNotificationsEnabled: false,
  silentReminderEnabled: true,
  defaultMuezzinId: generalOnly[0].id,
  playbackMode: "full",
  iqamahEnabled: false,
  iqamahDelayMinutes: 0,
  volume: 1,
  vibrateEnabled: true,
  bypassSilentMode: false,
  iosSequentialFullAdhan: false,
  prayers: {
    fajr: { enabled: true, iqamahEnabled: false, muezzinId: generalOnly[0].id, advanceMinutes: 15 },
    dhuhr: { enabled: true, iqamahEnabled: false, muezzinId: "", advanceMinutes: 10 },
    asr: { enabled: true, iqamahEnabled: false, muezzinId: "", advanceMinutes: 10 },
    maghrib: { enabled: true, iqamahEnabled: false, muezzinId: "", advanceMinutes: 5 },
    isha: { enabled: true, iqamahEnabled: false, muezzinId: "", advanceMinutes: 10 },
  },
  fridayBannerEnabled: true,
  lastTestedMuezzinId: null,
  lastTestSuccessAt: null,
  lastTestFailureAt: null,
  lastTestFailureReason: null,
};

const sanitized = sanitizeFajrMuezzinPrefs(basePrefs);
assert.ok(
  hasFajrAdhan(getMuezzin(sanitized.prayers.fajr.muezzinId)),
  "sanitize يستبدل مؤذن فجر بلا تثويب",
);

const effectiveFajr = getEffectiveMuezzinId(
  {
    ...basePrefs,
    prayers: { ...basePrefs.prayers, fajr: { ...basePrefs.prayers.fajr, muezzinId: "" } },
  },
  "fajr",
);
assert.ok(
  hasFajrAdhan(getMuezzin(effectiveFajr)),
  "الافتراضي العام بلا فجر → يُحلّ لمؤهل تثويب",
);

assert.ok(hasFajrAdhan(getDefaultFajrMuezzin()));
assert.ok(hasFajrAdhan(getMuezzin(DEFAULT_MUEZZIN_ID)) || getDefaultFajrMuezzin().id);

// ── تشغيل: playAdhan(..., true) لا يستخدم audioUrl ─────────────────────
const good = fajrCapable[0];
const bad = generalOnly[0];
assert.equal(playAdhan(bad, true), null, "بلا fajrUrl → لا تشغيل ولا استبدال بالعام");

// لا نُشغّل شبكة في CI: نتحقق من اختيار الرابط عبر hasFajrAdhan فقط
assert.ok(good.fajrUrl && good.fajrUrl !== good.audioUrl);

// ── فحص مصدر المجدول: لا fallback صريح للعام عند الفجر ─────────────────
const schedulerSrc = readFileSync(resolve(appRoot, "src/lib/adhan-scheduler.ts"), "utf8");
assert.match(schedulerSrc, /isFajr/, "المجدول يعرف الفجر");
assert.match(
  schedulerSrc,
  /لا يُشغَّل بلا نسخة تثويب|!audio && isFajr/,
  "المجدول لا يتجاهل غياب التثويب بصمت مع تشغيل عام",
);
assert.equal(
  /playAdhan\([^)]+,\s*isFajr\s*\?\s*false/.test(schedulerSrc),
  false,
  "لا يُمرَّر false قسريًا للفجر",
);

const audioSrc = readFileSync(resolve(appRoot, "src/lib/adhan-audio.ts"), "utf8");
assert.match(audioSrc, /resolveAdhanClip/, "playAdhan يمر عبر resolveAdhanClip");
const modesSrc = readFileSync(resolve(appRoot, "src/lib/adhan-playback-modes.ts"), "utf8");
assert.match(
  modesSrc,
  /if \(opts\.isFajr\) \{[\s\S]*?if \(!sources\.fajrUrl\) return null/,
  "resolveAdhanClip يرفض الفجر بلا fajrUrl",
);

console.log("adhan-fajr-thasweeb.test.ts: ok");
