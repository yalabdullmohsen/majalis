/**
 * أنواع الأذان المميزة + الجدولة بلا تكرار.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-featured-styles.test.ts
 */
import assert from "node:assert/strict";
import {
  FEATURED_ADHAN_STYLE_IDS,
  FEATURED_ADHAN_STYLE_LABELS,
} from "../adhan-featured-styles";
import { getMuezzin, isMuezzinSelectable } from "../adhan-audio";
import { isOfflineFeaturedMuezzin, resolveOfflineClipUrl } from "../adhan-offline-assets";
import { buildPrayerScheduleSignature } from "../prayer-alert-scheduler";
import { ADHAN_PREFS_CHANGED_EVENT } from "../adhan-preferences";

assert.equal(FEATURED_ADHAN_STYLE_IDS.length, 8);
for (const id of FEATURED_ADHAN_STYLE_IDS) {
  assert.ok(FEATURED_ADHAN_STYLE_LABELS[id], `تسمية ${id}`);
  assert.ok(isOfflineFeaturedMuezzin(id), `${id} أوفلاين مميز`);
  const m = getMuezzin(id);
  assert.ok(isMuezzinSelectable(m), `${id} قابل للاختيار`);
  assert.ok(
    m.audioUrl.startsWith("/audio/adhan/") || m.audioUrl.startsWith("https://"),
    `${id} مسار صوت صالح`,
  );
  assert.ok(resolveOfflineClipUrl(id, "short") || resolveOfflineClipUrl(id, "general"), `${id} حزمة`);
}

assert.match(FEATURED_ADHAN_STYLE_LABELS.makkah, /مكة/);
assert.match(FEATURED_ADHAN_STYLE_LABELS.soft, /لطيف/);
assert.match(FEATURED_ADHAN_STYLE_LABELS.turkey, /تركي/);

const a = buildPrayerScheduleSignature({
  prayerKey: "dhuhr",
  prayerTimeEpochMs: 1_700_000_000_000,
  preAlertEnabled: true,
  enterAlertEnabled: true,
  preAlertMinutes: 10,
});
const b = buildPrayerScheduleSignature({
  prayerKey: "dhuhr",
  prayerTimeEpochMs: 1_700_000_000_000 + 30_000,
  preAlertEnabled: true,
  enterAlertEnabled: true,
  preAlertMinutes: 10,
});
assert.equal(a, b, "نفس الدقيقة → نفس التوقيع (لا تكرار)");

const c = buildPrayerScheduleSignature({
  prayerKey: "dhuhr",
  prayerTimeEpochMs: 1_700_000_000_000 + 120_000,
  preAlertEnabled: true,
  enterAlertEnabled: true,
  preAlertMinutes: 10,
});
assert.notEqual(a, c, "دقيقة مختلفة → توقيع مختلف");

assert.equal(ADHAN_PREFS_CHANGED_EVENT, "majalis:adhan-prefs-changed");

console.log("adhan-featured-styles.test.ts: ok");
