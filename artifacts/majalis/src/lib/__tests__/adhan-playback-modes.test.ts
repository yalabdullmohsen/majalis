/**
 * صيغ تشغيل الأذان — كامل / قصير / تكبير / صامت + إقامة.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-playback-modes.test.ts
 */
import assert from "node:assert/strict";
import {
  ADHAN_SHORT_MAX_SEC,
  ADHAN_TAKBIR_MAX_SEC,
  resolveAdhanClip,
  resolveIqamahClip,
} from "../adhan-playback-modes";

const sources = {
  audioUrl: "https://example.com/general.mp3",
  fajrUrl: "https://example.com/fajr/fajr.mp3",
  shortUrl: "https://example.com/short.mp3",
  takbirUrl: "https://example.com/takbir.mp3",
  iqamahUrl: "https://example.com/iqamah.mp3",
};

assert.equal(resolveAdhanClip(sources, { isFajr: false, mode: "silent" }), null);

const full = resolveAdhanClip(sources, { isFajr: false, mode: "full" })!;
assert.equal(full.url, sources.audioUrl);
assert.equal(full.maxMs, null);

const fajr = resolveAdhanClip(sources, { isFajr: true, mode: "full" })!;
assert.equal(fajr.url, sources.fajrUrl);
assert.equal(fajr.kind, "fajr");

assert.equal(
  resolveAdhanClip({ audioUrl: sources.audioUrl }, { isFajr: true, mode: "full" }),
  null,
  "فجر بلا fajrUrl → null",
);

const short = resolveAdhanClip(sources, { isFajr: false, mode: "short" })!;
assert.equal(short.url, sources.shortUrl);
assert.equal(short.maxMs, ADHAN_SHORT_MAX_SEC * 1000);
assert.equal(short.truncatedFromFull, false);

const shortFallback = resolveAdhanClip(
  { audioUrl: sources.audioUrl, fajrUrl: sources.fajrUrl },
  { isFajr: false, mode: "short" },
)!;
assert.equal(shortFallback.url, sources.audioUrl);
assert.equal(shortFallback.truncatedFromFull, true);
assert.ok((shortFallback.maxMs ?? 0) <= ADHAN_SHORT_MAX_SEC * 1000);

const takbir = resolveAdhanClip(sources, { isFajr: false, mode: "takbir" })!;
assert.equal(takbir.url, sources.takbirUrl);
assert.equal(takbir.maxMs, ADHAN_TAKBIR_MAX_SEC * 1000);

const iqamah = resolveIqamahClip(sources)!;
assert.equal(iqamah.kind, "iqamah");
assert.equal(resolveIqamahClip({ audioUrl: sources.audioUrl }), null);

assert.ok(ADHAN_SHORT_MAX_SEC <= 28);

console.log("adhan-playback-modes.test.ts: ok");
