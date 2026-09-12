/**
 * بوابة P0 — قارئ سُنّة الصوتي التفاعلي.
 * node --import tsx src/lib/__tests__/audio-reader-p0-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUDIO_READER_FLAGS_P0,
  AUDIO_READER_VERSION,
  __resetAudioReaderForTests,
  assertNoApiKeyInClientBundle,
  assertTtsAllowed,
  decideCloudNarration,
  detectProtectedText,
  evaluateAudioReaderEligibility,
  getAudioReaderFlags,
  getAudioReaderState,
  isAudioArtifactCompatible,
  createArtifactRecord,
  listTtsForbiddenSegments,
  logContainsFullNarrationText,
  narrationCacheMatchesContent,
  partitionProtectedText,
  prepareAudioReaderSession,
  prepareNarrationManifest,
  redactNarrationForLogs,
  requestAudioReaderPlayback,
  resetAudioReaderFlags,
  setAudioReaderFlagsForTests,
  stopAudioReader,
} from "@/lib/audio-reader";
import {
  __resetAppAudioCoordinatorForTests,
  beginLongFormAudio,
  getAppAudioSnapshot,
  playAppAudio,
  stopAppAudio,
} from "@/lib/audio/app-audio-coordinator";
import { APP_AUDIO_PRIORITY } from "@/lib/audio/app-audio-types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== Feature flags default OFF ===");
resetAudioReaderFlags();
const flags = getAudioReaderFlags();
for (const [k, v] of Object.entries(AUDIO_READER_FLAGS_P0)) {
  assert.equal((flags as Record<string, boolean>)[k], v, k);
  assert.equal(v, false, `${k} must be false in P0`);
}

console.log("=== Eligibility: blocked families ===");
for (const family of [
  "quran",
  "mushaf",
  "hadith_reference",
  "adhkar_reference",
  "adhan_text",
  "unpublished",
  "needs_review",
] as const) {
  const r = evaluateAudioReaderEligibility({
    contentId: `t-${family}`,
    family,
    published: family !== "unpublished",
    needsReview: family === "needs_review",
    incomplete: false,
    missingMandatorySource: false,
    contentVersion: "1",
    containsProtectedText: false,
    canSafelySeparateProtected: true,
    unsupportedElements: false,
  });
  assert.equal(r.mayPrepareNarration, false, family);
  assert.equal(r.mayStartPlayback, false, family);
  assert.equal(r.showListenButton, false, family);
}

console.log("=== Eligibility: prophets prepare-only (P0) ===");
{
  const r = evaluateAudioReaderEligibility({
    contentId: "story-1",
    family: "prophets_stories",
    published: true,
    needsReview: false,
    incomplete: false,
    missingMandatorySource: false,
    contentVersion: "v1",
    containsProtectedText: false,
    canSafelySeparateProtected: true,
    unsupportedElements: false,
  });
  assert.equal(r.audioReaderEligible, true);
  assert.equal(r.mayPrepareNarration, true);
  assert.equal(r.mayStartPlayback, false, "playback off until flags");
  assert.equal(r.showListenButton, false);
}

console.log("=== Protected detection + TTS ban ===");
{
  const sample =
    "قصة نوح عليه السلام. ﴿بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ﴾ ثم تابع السرد.";
  const det = detectProtectedText(sample);
  assert.equal(det.containsProtectedText, true);
  assert.ok(det.kinds.includes("quran"));
  const parts = partitionProtectedText(sample);
  assert.ok(parts.some((p) => p.type === "protected"));
  assert.ok(parts.some((p) => p.type === "speakable"));
  assert.equal(assertTtsAllowed("quran").ok, false);
  assert.equal(assertTtsAllowed("hadith").ok, false);
  assert.equal(assertTtsAllowed("dhikr").ok, false);
  assert.equal(assertTtsAllowed("none").ok, true);
}

console.log("=== Narration pipeline: no TTS on ayah segment ===");
{
  const manifest = prepareNarrationManifest({
    contentId: "nuh-1",
    family: "prophets_stories",
    contentVersion: "cv1",
    title: "قصة نوح",
    body: "مقدمة تحريرية.\n\n﴿إِنَّا أَرْسَلْنَا نُوحًا﴾\n\nخاتمة تحريرية.",
    published: true,
  });
  assert.ok(manifest.segments.length >= 3);
  const forbidden = listTtsForbiddenSegments(manifest);
  assert.ok(forbidden.length >= 1);
  assert.ok(forbidden.every((s) => s.ttsForbidden && s.protectedStatus === "quran"));
  assert.ok(manifest.eligibleSpeakableSegmentCount >= 2);
  assert.ok(manifest.checksum.length >= 8);
  assert.equal(manifest.readerVersion, AUDIO_READER_VERSION);
}

console.log("=== Unpublished / review rejected ===");
{
  const m = prepareNarrationManifest({
    contentId: "draft",
    family: "prophets_stories",
    contentVersion: "1",
    body: "نص",
    published: false,
  });
  assert.equal(m.segments.length, 0);
  const m2 = prepareNarrationManifest({
    contentId: "rev",
    family: "prophets_stories",
    contentVersion: "1",
    body: "نص",
    needsReview: true,
  });
  assert.equal(m2.segments.length, 0);
}

console.log("=== Cache version mismatch ===");
{
  assert.equal(
    narrationCacheMatchesContent({
      contentVersion: "a",
      cachedContentVersion: "b",
      manifestChecksum: "x",
      cachedManifestChecksum: "x",
    }),
    false,
  );
  const art = createArtifactRecord({
    contentId: "c1",
    contentVersion: "v1",
    manifestChecksum: "abc",
  });
  assert.equal(
    isAudioArtifactCompatible({
      contentVersion: "v2",
      artifact: art,
      expectedManifestChecksum: "abc",
    }).ok,
    false,
  );
}

console.log("=== Privacy: cloud + logs ===");
{
  const cloud = decideCloudNarration({
    userDisabledCloud: false,
    published: true,
    protectedKinds: ["none"],
    isUserPrivateNote: false,
  });
  assert.equal(cloud.allowed, false);
  const withProtected = decideCloudNarration({
    userDisabledCloud: false,
    published: true,
    protectedKinds: ["quran"],
    isUserPrivateNote: false,
  });
  assert.equal(withProtected.allowed, false);
  const redacted = redactNarrationForLogs({
    contentId: "c",
    contentVersion: "1",
    segmentCount: 3,
  });
  assert.equal("text" in redacted, false);
  const longText = "هذا نص سردي طويل للقراءة الصوتية يتجاوز الحد الأدنى للفحص";
  assert.equal(
    logContainsFullNarrationText(`error contentId=c`, longText),
    false,
  );
  assert.equal(
    logContainsFullNarrationText(`dump: ${longText}`, longText),
    true,
  );
}

console.log("=== No API keys in audio-reader sources ===");
{
  const dir = resolve(root, "src/lib/audio-reader");
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".ts") && !name.endsWith(".md")) continue;
    const src = read(`src/lib/audio-reader/${name}`);
    assert.ok(assertNoApiKeyInClientBundle(src), name);
  }
}

console.log("=== Coordinator knows audioReader ===");
assert.ok("audioReader" in APP_AUDIO_PRIORITY);
assert.ok(read("src/lib/audio/app-audio-coordinator.ts").includes("audioReader"));
assert.ok(read("src/lib/exclusive-audio-bus.ts").includes("audioReader"));
assert.ok(
  read("src/lib/audio/app-audio-coordinator.ts").includes("stopSpeechReadAloud"),
);

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

console.log("=== Service: prepare ready; playback refused (P0 flags) ===");
__resetAudioReaderForTests();
__resetAppAudioCoordinatorForTests();
{
  const st = await prepareAudioReaderSession({
    contentId: "story-nuh",
    family: "prophets_stories",
    contentVersion: "1",
    title: "نوح",
    body: "سرد تحريري موثق بدون آية.",
    published: true,
  });
  assert.equal(st.phase, "ready");
  const play = await requestAudioReaderPlayback({ userInitiated: true });
  assert.equal(play.ok, false);
  assert.equal(play.reason, "playback_flag_disabled_p0");
}

console.log("=== Single audio: lesson stops reader claim path ===");
__resetAudioReaderForTests();
__resetAppAudioCoordinatorForTests();
FakeAudio.instances = [];
{
  setAudioReaderFlagsForTests({
    audioReaderEnabled: true,
    prophetsStoriesAudioEnabled: true,
  });
  await prepareAudioReaderSession({
    contentId: "story-2",
    family: "prophets_stories",
    contentVersion: "1",
    body: "نص قصير.",
    published: true,
  });
  const armed = await requestAudioReaderPlayback({ userInitiated: true });
  assert.equal(armed.ok, true);
  assert.equal(getAudioReaderState().phase, "playing");
  assert.equal(getAppAudioSnapshot().activeKind, "audioReader");

  await playAppAudio({
    sourceId: "lesson-x",
    kind: "lessonAudio",
    url: "/audio/notifications/prayer-alert.mp3",
    userInitiated: true,
  });
  assert.equal(getAppAudioSnapshot().activeKind, "lessonAudio");
  assert.notEqual(getAudioReaderState().phase, "playing");

  await stopAppAudio("user");
  await stopAudioReader();
  resetAudioReaderFlags();
}

console.log("=== Rapid play idempotency under flags ===");
__resetAudioReaderForTests();
__resetAppAudioCoordinatorForTests();
{
  await prepareAudioReaderSession({
    contentId: "story-3",
    family: "prophets_stories",
    contentVersion: "1",
    body: "نص.",
    published: true,
  });
  const results = await Promise.all([
    requestAudioReaderPlayback({ userInitiated: true }),
    requestAudioReaderPlayback({ userInitiated: true }),
    requestAudioReaderPlayback({ userInitiated: true }),
    requestAudioReaderPlayback({ userInitiated: true }),
    requestAudioReaderPlayback({ userInitiated: true }),
  ]);
  assert.ok(results.every((r) => r.ok === false));
  assert.ok(results.every((r) => r.reason === "playback_flag_disabled_p0"));
}

console.log("=== beginLongFormAudio audioReader registered ===");
__resetAppAudioCoordinatorForTests();
await beginLongFormAudio("audioReader", "audio-reader:test");
assert.equal(getAppAudioSnapshot().activeKind, "audioReader");
await stopAppAudio("user");

console.log("=== HTML/URL stripped from speakable path ===");
{
  const m = prepareNarrationManifest({
    contentId: "u1",
    family: "articles_general",
    contentVersion: "1",
    body: "انظر https://example.com/path وملف foo.tsx للنقاش.",
    published: true,
  });
  const joined = m.segments.map((s) => s.text).join(" ");
  assert.equal(/https?:\/\//.test(joined), false);
  assert.equal(/foo\.tsx/.test(joined), false);
}

console.log("\naudio-reader P0 gate: PASS");
