/**
 * ناقل الصوت الحصري + مفتاح تعطيل التفسير الصوتي.
 * Run: node --import tsx src/lib/__tests__/tafsir-audio-bus.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  claimAudio,
  getAudioBusOwner,
  registerAudioStopper,
  releaseAudio,
} from "@/lib/exclusive-audio-bus";
import {
  __setTafsirAudioRemoteConfigForTests,
  isTafsirClipDisabled,
  isTafsirAudioGloballyDisabled,
} from "@/lib/tafsir-audio-remote-config";
import {
  findTafsirAudioForAyah,
  displayScholarLabel,
  type TafsirAudioClip,
} from "@/lib/quran-data/tafsir-audio";

const stopped: string[] = [];
registerAudioStopper("tilawa", () => {
  stopped.push("tilawa");
});
registerAudioStopper("adhan", () => {
  stopped.push("adhan");
});

await claimAudio("tafsir");
assert.equal(getAudioBusOwner(), "tafsir");
assert.ok(stopped.includes("tilawa"), "claim tafsir stops tilawa");
assert.ok(stopped.includes("adhan"), "claim tafsir stops adhan");
releaseAudio("tafsir");
assert.equal(getAudioBusOwner(), null);

__setTafsirAudioRemoteConfigForTests({
  globalDisabled: true,
  disabledClipIds: [],
  disabledScholarIds: [],
  disabledSources: [],
});
assert.ok(isTafsirAudioGloballyDisabled());
assert.ok(isTafsirClipDisabled("any"));

__setTafsirAudioRemoteConfigForTests({
  globalDisabled: false,
  disabledClipIds: ["clip-1"],
  disabledScholarIds: ["scholar-x"],
  disabledSources: [],
});
assert.ok(isTafsirClipDisabled("clip-1"));
assert.ok(isTafsirClipDisabled("other", "scholar-x"));
assert.equal(isTafsirClipDisabled("ok", "ok"), false);

const clips: TafsirAudioClip[] = [
  {
    id: "c1",
    scholarId: "s1",
    scholarLabelAr: "عالم تجريبي",
    attributionVerified: false,
    titleAr: "تفسير",
    surah: 1,
    ayahFrom: 1,
    ayahTo: 7,
    streamUrl: "https://example.com/a.mp3",
    sourceId: "src",
    license: "pending",
    enabled: true,
  },
];
assert.ok(findTafsirAudioForAyah(clips, 1, 3));
assert.equal(findTafsirAudioForAyah(clips, 2, 1), null);

const { findTafsirAudioForSurah } = await import("@/lib/quran-data/tafsir-audio");
assert.ok(findTafsirAudioForSurah(clips, 1));
assert.equal(findTafsirAudioForSurah(clips, 99), null);
assert.match(displayScholarLabel(clips[0]!), /غير موثّقة/);
clips[0]!.attributionVerified = true;
assert.equal(displayScholarLabel(clips[0]!), "عالم تجريبي");

const here = dirname(fileURLToPath(import.meta.url));
const remote = JSON.parse(
  readFileSync(resolve(here, "../../../public/data/tafsir-audio-remote.json"), "utf8"),
);
const catalog = JSON.parse(
  readFileSync(resolve(here, "../../../public/data/tafsir-audio-catalog.json"), "utf8"),
);
assert.ok(Array.isArray(remote.disabledClipIds));
assert.ok(Array.isArray(catalog.clips));
assert.equal(catalog.clips.length, 0, "لا مقاطع بلا ترخيص");

console.log("tafsir-audio-bus.test.ts: ok");
