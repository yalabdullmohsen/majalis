/**
 * بوابة منسّق الصوت الأحادي + الكتالوجات المرخّصة.
 * node --import tsx src/lib/__tests__/app-audio-coordinator-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  __resetAppAudioCoordinatorForTests,
  canAutoDuckForKind,
  getAppAudioSnapshot,
  playAppAudio,
  stopAllAppAudio,
  stopAppAudio,
} from "@/lib/audio/app-audio-coordinator";
import {
  DHIKR_AUDIO_CATALOG,
  dhikrClipsNeedingRecording,
  listPlayableDhikrClips,
} from "@/lib/audio/dhikr-audio-catalog";
import {
  PRAYER_PROMPT_CATALOG,
  listPlayablePrayerPrompts,
  prayerPromptsNeedingRecording,
} from "@/lib/audio/prayer-prompt-catalog";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== Catalog licenses ===");
assert.ok(listPlayablePrayerPrompts().length >= 5, "نغمات اقتراب الصلاة القابلة للتشغيل");
assert.ok(prayerPromptsNeedingRecording().length >= 5, "مقاطع منطوقة معلّقة للتسجيل");
assert.equal(listPlayableDhikrClips().length, 0, "لا أذكار صوتية بلا ترخيص");
assert.equal(dhikrClipsNeedingRecording().length, DHIKR_AUDIO_CATALOG.length);
for (const clip of PRAYER_PROMPT_CATALOG) {
  if (clip.approvedForProduction) {
    assert.ok(clip.previewUrl, `${clip.id} يحتاج previewUrl`);
    assert.equal(clip.licenseStatus, "project_original");
  } else {
    assert.equal(clip.previewUrl, null);
    assert.equal(clip.licenseStatus, "needs_recording");
  }
}

class FakeAudio {
  static instances: FakeAudio[] = [];
  volume = 1;
  preload = "";
  currentTime = 0;
  duration = 3;
  paused = true;
  src = "";
  onended: ((this: FakeAudio, ev: Event) => void) | null = null;
  onerror: ((this: FakeAudio, ev: Event) => void) | null = null;
  onloadedmetadata: ((this: FakeAudio, ev: Event) => void) | null = null;
  ontimeupdate: ((this: FakeAudio, ev: Event) => void) | null = null;
  constructor(url: string) {
    this.src = url;
    FakeAudio.instances.push(this);
  }
  async play() {
    this.paused = false;
    this.onloadedmetadata?.(new Event("loadedmetadata"));
    return undefined;
  }
  pause() {
    this.paused = true;
  }
  removeAttribute() {}
  load() {}
}

(globalThis as unknown as { Audio: typeof FakeAudio }).Audio = FakeAudio;

console.log("=== Single-flight / token ===");
__resetAppAudioCoordinatorForTests();
FakeAudio.instances = [];

await Promise.all([
  playAppAudio({
    sourceId: "a",
    kind: "adhanPreview",
    url: "/audio/notifications/prayer-alert.mp3",
    shortLived: true,
  }),
  playAppAudio({
    sourceId: "b",
    kind: "dhikrPrompt",
    url: "/audio/notifications/short-ring.mp3",
    shortLived: true,
  }),
  playAppAudio({
    sourceId: "c",
    kind: "notificationPreview",
    url: "/audio/notifications/soft-ring.mp3",
    shortLived: true,
  }),
]);

const finalSnap = getAppAudioSnapshot();
assert.equal(finalSnap.phase, "playing");
assert.equal(finalSnap.activeSourceId, "c", "آخر طلب يفوز بعد الطابور");
assert.ok(
  FakeAudio.instances.filter((a) => !a.paused).length <= 1,
  "عنصر واحد غير متوقف على الأكثر",
);

await stopAppAudio("user");
assert.equal(getAppAudioSnapshot().phase, "idle");

console.log("=== Priority ducking ===");
__resetAppAudioCoordinatorForTests();
await playAppAudio({
  sourceId: "quran-1",
  kind: "quranRecitation",
  url: "/audio/notifications/prayer-alert.mp3",
  userInitiated: true,
});
assert.equal(canAutoDuckForKind("dhikrPrompt"), false, "الذكر لا يقطع التلاوة تلقائيًا");
assert.equal(
  canAutoDuckForKind("adhanPreview"),
  false,
  "معاينة الأذان لا تقطع التلاوة تلقائيًا (أولوية أقل)",
);
// تشغيل يدوي يوقف السابق دائمًا
await playAppAudio({
  sourceId: "adhan-preview-1",
  kind: "adhanPreview",
  url: "/audio/notifications/short-ring.mp3",
  userInitiated: true,
});
assert.equal(getAppAudioSnapshot().activeSourceId, "adhan-preview-1");
assert.equal(getAppAudioSnapshot().activeKind, "adhanPreview");
await stopAllAppAudio();

console.log("=== Migration gates ===");
const adhanSettings = read("src/pages/worship/ui/AdhanSettingsView.tsx");
assert.doesNotMatch(adhanSettings, /new Audio\(/);
assert.match(adhanSettings, /previewAdhanUrl|previewNotificationTone/);
assert.match(adhanSettings, /stopAppAudio/);
assert.match(adhanSettings, /AudioPromptsSettingsCard/);

const bus = read("src/lib/exclusive-audio-bus.ts");
assert.match(bus, /forceStopAppAudioSync/);

const card = read("src/components/adhan/AudioPromptsSettingsCard.tsx");
assert.match(card, /previewPrayerPrompt|previewDhikrClip/);
assert.match(card, /subscribeAppAudio/);

const picker = read("src/components/adhan/MuezzinPicker.tsx");
assert.doesNotMatch(picker, /previewAdhanAsync|new Audio\(/);
assert.match(picker, /previewAdhanUrl/);
assert.match(picker, /stopAppAudio/);

const adhanService = read("src/lib/adhan-audio-service.ts");
assert.match(adhanService, /playAppAudio/);
assert.match(adhanService, /kind:\s*"adhanPreview"/);

console.log("app-audio-coordinator-gate.test.ts: ok");
