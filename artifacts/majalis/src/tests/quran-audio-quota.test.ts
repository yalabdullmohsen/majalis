/**
 * Run: node --import tsx src/tests/quran-audio-quota.test.ts
 */
import assert from "node:assert/strict";
import {
  MAX_FULL_OFFLINE_RECITERS,
  MAX_OFFLINE_AUDIO_BYTES,
  OfflineAudioQuotaError,
} from "../lib/quran-audio-downloads";
import { RECITERS, getAyahAudioUrl, getReciter } from "../lib/quran-audio";

assert.equal(MAX_FULL_OFFLINE_RECITERS, 2);
assert.ok(MAX_OFFLINE_AUDIO_BYTES >= 1.5 * 1024 * 1024 * 1024);
assert.ok(RECITERS.some((r) => r.id === "dosari" && r.featured));
assert.ok(RECITERS.some((r) => r.id === "ali_jaber" && r.featured));

const url = getAyahAudioUrl(2, 255, "dosari");
assert.match(url, /^https:\/\/everyayah\.com\/data\//);
assert.ok(!url.includes("assets/") && !url.startsWith("/"), "streaming URL only");

assert.equal(getReciter("ali_jaber").nameAr, "علي جابر");

const err = new OfflineAudioQuotaError("سقف");
assert.equal(err.name, "OfflineAudioQuotaError");

console.log("quran-audio-quota: ok");
