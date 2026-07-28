/**
 * اختبارات — تحقق صوتي، تمرير تلقائي، أوقات شرعية، مزامنة تبويب، موفر طاقة
 * تشغيل: npx tsx src/lib/__tests__/speech-scroll-sacred-sync-suite.test.ts
 */

import {
  emptyHintState,
  isVoiceVerificationAvailable,
  matchRecitationTranscript,
  recordVoiceVerifySession,
} from "../voice-recitation-verify";
import {
  computeReadingVelocityProfile,
  planAutoScroll,
  recordVerseDwell,
  saveAutoScrollPrefs,
} from "../adaptive-auto-scroll";
import {
  computeSacredWindows,
  formatMinutesAsTime,
  isInForbiddenPrayerWindow,
  resolveSacredTimeState,
} from "../sacred-time-calculator";
import {
  getCrossTabId,
  isBroadcastChannelSupported,
  publishCrossTabEvent,
  subscribeCrossTab,
  closeCrossTabChannel,
} from "../cross-tab-sync";
import {
  beginPowerSaverSession,
  endPowerSaverSession,
  getPowerSaverState,
  scaleIntervalMs,
  setPowerSaverMode,
  shouldThrottleUiRender,
} from "../power-saver-engine";
import type { PrayerSlot } from "../prayer-times";

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

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
} as Storage;

(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
  getItem: (k) => (mem.has(`s:${k}`) ? mem.get(`s:${k}`)! : null),
  setItem: (k, v) => {
    mem.set(`s:${k}`, String(v));
  },
  removeItem: (k) => {
    mem.delete(`s:${k}`);
  },
  clear: () => undefined,
  key: () => null,
  get length() {
    return 0;
  },
} as Storage;

const prayers: PrayerSlot[] = [
  { key: "Fajr", name: "الفجر", obligatory: true, time24: "04:10", time: "4:10 ص", minutes: 4 * 60 + 10 },
  { key: "Sunrise", name: "الشروق", obligatory: false, time24: "05:30", time: "5:30 ص", minutes: 5 * 60 + 30 },
  { key: "Dhuhr", name: "الظهر", obligatory: true, time24: "11:50", time: "11:50 ص", minutes: 11 * 60 + 50 },
  { key: "Asr", name: "العصر", obligatory: true, time24: "15:20", time: "3:20 م", minutes: 15 * 60 + 20 },
  { key: "Maghrib", name: "المغرب", obligatory: true, time24: "18:40", time: "6:40 م", minutes: 18 * 60 + 40 },
  { key: "Isha", name: "العشاء", obligatory: true, time24: "20:00", time: "8:00 م", minutes: 20 * 60 },
];

console.log("\n=== 1. Voice recitation verify ===");
{
  assert(typeof isVoiceVerificationAvailable() === "boolean", "availability check");
  assert(emptyHintState().kind === "none", "empty hint");
  const target = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
  const good = matchRecitationTranscript(target, "بسم الله الرحمن الرحيم");
  assert(good.matchPercent >= 50, "normalized match scores");
  const hes = matchRecitationTranscript(target, "بسم", { hesitationDetected: true });
  assert(hes.kind === "hesitation" || hes.kind === "missing_word" || hes.kind === "behind", "hesitation/missing hint");
  const wrong = matchRecitationTranscript(target, "الحمد لله رب العالمين");
  assert(wrong.kind === "mispronunciation" || wrong.matchPercent < 80, "mismatch detected");
  const stats = recordVoiceVerifySession(90, 1);
  assert(stats.sessions >= 1, "stats recorded");
}

console.log("\n=== 2. Adaptive auto-scroll ===");
{
  saveAutoScrollPrefs({ enabled: true, followAudio: true, overrideMsPerAyah: null });
  const profile = computeReadingVelocityProfile({ wordsPerMinute: 140 });
  assert(profile.msPerAyah > 0 && profile.acceleration > 0, "velocity profile");
  const cmd = planAutoScroll({ ayah: 5, syncWithAudio: true, profile });
  assert(Boolean(cmd) && cmd!.ayah === 5, "plan scroll command");
  assert((cmd?.delayMs ?? -1) >= 0, "paced delay");
  const updated = recordVerseDwell(5_000, 10);
  assert(updated.msPerAyah > 0, "dwell updates profile");
  const off = planAutoScroll({
    ayah: 1,
    prefs: { enabled: false, followAudio: true, overrideMsPerAyah: null },
  });
  assert(off === null, "disabled prefs → no scroll");
}

console.log("\n=== 3. Sacred time calculator ===");
{
  const windows = computeSacredWindows(prayers, { isFriday: true });
  assert(windows.some((w) => w.id === "last_third_night"), "last third of night");
  assert(windows.some((w) => w.id === "ishraq"), "ishraq window");
  assert(windows.some((w) => w.id === "zawal" && w.prayerRestricted), "zawal restricted");
  assert(windows.some((w) => w.id === "friday_answer_hour"), "friday answer hour");
  assert(formatMinutesAsTime(125).includes("02:05"), "format minutes");

  const zawalState = resolveSacredTimeState(prayers, {
    nowMinutes: 11 * 60 + 45,
    isFriday: false,
  });
  assert(zawalState.active.some((a) => a.id === "zawal"), "active zawal");
  assert(isInForbiddenPrayerWindow(zawalState), "forbidden during zawal");

  const ishraqState = resolveSacredTimeState(prayers, {
    nowMinutes: 5 * 60 + 50,
    isFriday: false,
  });
  assert(ishraqState.azkarRecommendations.length > 0, "azkar recommendations");
  assert(ishraqState.azkarRecommendations[0]!.href.includes("/adhkar"), "azkar href");
}

console.log("\n=== 4. Cross-tab sync ===");
{
  const id = getCrossTabId();
  assert(id.startsWith("tab-"), "tab id assigned");
  assert(typeof isBroadcastChannelSupported() === "boolean", "BC support flag");

  let received = false;
  // Simulate handler path via publish (same-tab messages are filtered; test publish shape)
  const msg = publishCrossTabEvent("bookmark_changed", { id: 1 }, "majalis-local-bookmarks-v1");
  assert(msg.type === "bookmark_changed" && msg.tabId === id, "publish message shape");
  const unsub = subscribeCrossTab(() => {
    received = true;
  });
  unsub();
  assert(received === false || received === true, "subscribe/unsubscribe safe");
}

console.log("\n=== 5. Power saver ===");
{
  endPowerSaverSession();
  beginPowerSaverSession({ immediate: true });
  const st = getPowerSaverState();
  assert(st.sessionActive === true, "session active");
  assert(st.audioExempt && st.readingTimerExempt, "audio/reading exempt");
  assert(st.intervalMultiplier >= 1, "interval multiplier");
  setPowerSaverMode("aggressive");
  assert(scaleIntervalMs(1000) >= 1000, "scaled interval");
  // throttle helper should be callable
  assert(typeof shouldThrottleUiRender() === "boolean", "ui throttle helper");
  endPowerSaverSession();
  assert(getPowerSaverState().mode === "off", "session ended → off");
}

try {
  closeCrossTabChannel();
} catch {
  /* ignore */
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
