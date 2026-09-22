/**
 * Guideline 2.5.4 — Background Audio must match a real continuous tilawa path.
 * Run: node --import tsx src/lib/__tests__/ios-background-audio-2-5-4-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const plist = read("ios/App/App/Info.plist");
const plugin = read("ios/App/App/MajlisPlaybackAudioPlugin.swift");
const engine = read("src/core/audio/AudioEngine.ts");
const bridge = read("src/lib/native-playback-audio.ts");
const reviewNotes = read("store/app-store/review-notes.md");
const runbook = resolve(majalisRoot, "docs/AUDIO_BACKGROUND_DEVICE_RUNBOOK.md");

console.log("=== UIBackgroundModes audio kept (Path A) ===");
assert.match(plist, /<key>UIBackgroundModes<\/key>/);
assert.match(plist, /<string>audio<\/string>/);
assert.match(plist, /<string>remote-notification<\/string>/);

console.log("=== Native session + Now Playing + background reassert ===");
assert.match(plugin, /AVAudioSession/);
assert.match(plugin, /\.playback/);
assert.match(plugin, /MPNowPlayingInfoCenter/);
assert.match(plugin, /MPRemoteCommandCenter/);
assert.match(plugin, /reassertPlaybackIfNeeded|MajlisAppDidEnterBackground/);
assert.match(plugin, /setNowPlaying/);
assert.doesNotMatch(plugin, /duckOthers[\s\S]{0,80}allowAirPlay/);

console.log("=== AudioEngine awaits session before play ===");
assert.match(engine, /await this\.activatePlaybackSession/);
assert.match(engine, /audio-engine-native-bridge/);
assert.match(bridge, /updateNativeNowPlaying/);
assert.match(bridge, /enablePlayback:\s*\(opts\?:/);
const nativeBridge = read("src/core/audio/audio-engine-native-bridge.ts");
assert.match(nativeBridge, /remoteCommand/);
assert.match(nativeBridge, /bindAudioEngineNative/);
assert.match(nativeBridge, /syncNativeNowPlaying/);

console.log("=== Review notes + device runbook ===");
assert.ok(existsSync(runbook), "device runbook missing");
assert.match(reviewNotes, /Background Audio|UIBackgroundModes|Lock Screen/i);
assert.match(reviewNotes, /\/mushaf/);

console.log("ios-background-audio-2-5-4-gate.test.ts: ok");
