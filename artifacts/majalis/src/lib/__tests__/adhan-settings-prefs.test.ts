/**
 * تفضيلات إعدادات الأذان — حجم، تجاوز صامت، صيغة لكل صلاة.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-settings-prefs.test.ts
 */
import assert from "node:assert/strict";
import {
  applyDefaultMuezzinToAllPrayers,
  getEffectivePlaybackMode,
  loadAdhanPrefs,
  patchAdhanPrefs,
  patchPrayerPrefs,
  saveAdhanPrefs,
  type AdhanPreferences,
} from "../adhan-preferences";
import {
  ADHAN_FULL_DOWNLOAD_CAP_BYTES,
  formatAdhanDownloadCap,
} from "../adhan-downloads";

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); },
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
};

mem.clear();
const base = loadAdhanPrefs();
assert.equal(base.playbackMode, "short", "الافتراضي قصير لا كامل");
assert.equal(base.bypassSilentMode, false);
assert.equal(base.vibrateEnabled, true);
assert.equal(base.volume, 1);

const withVol = patchAdhanPrefs({ volume: 0.4, bypassSilentMode: true });
assert.equal(withVol.volume, 0.4);
assert.equal(withVol.bypassSilentMode, true);

patchPrayerPrefs("isha", { deliveryMode: "full" });
const prefs = loadAdhanPrefs();
assert.equal(getEffectivePlaybackMode(prefs, "isha"), "full");
assert.equal(getEffectivePlaybackMode(prefs, "dhuhr"), "short");

patchAdhanPrefs({ playbackMode: "silent" });
assert.equal(getEffectivePlaybackMode(loadAdhanPrefs(), "isha"), "silent");

patchAdhanPrefs({ playbackMode: "short", defaultMuezzinId: "madinah" });
patchPrayerPrefs("asr", { muezzinId: "egypt" });
const all = applyDefaultMuezzinToAllPrayers("madinah");
assert.equal(all.prayers.asr.muezzinId, "");
assert.equal(all.defaultMuezzinId, "madinah");

assert.ok(ADHAN_FULL_DOWNLOAD_CAP_BYTES >= 40 * 1024 * 1024);
assert.match(formatAdhanDownloadCap(), /ميغابايت/);

// لا يُفعَّل الكامل ضمن defaultPrefs
const fresh = saveAdhanPrefs({ ...base, playbackMode: "short" } as AdhanPreferences);
assert.equal(fresh.playbackMode, "short");

console.log("adhan-settings-prefs.test.ts: ok");
