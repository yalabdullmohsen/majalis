/**
 * بوابة: Sovereign Part II — تحليلات تنبؤية، geo صامت، CDN failover، WAL.
 * تشغيل: node --import tsx src/lib/__tests__/sovereign-part-ii-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FRAME_BUDGET_MS } from "../sovereign/frame-budget";
import { mergeLwwById } from "../sovereign/optimistic-wal";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p: string) => readFileSync(resolve(appRoot, p), "utf8");

assert.equal(FRAME_BUDGET_MS, 8);

const bootstrap = read("lib/sovereign/sovereign-bootstrap.ts");
assert.match(bootstrap, /startPredictivePrewarmEngine/);
assert.match(bootstrap, /startPrayerGeoSilentWatcher/);

const analytics = read("lib/sovereign/predictive-analytics.ts");
assert.match(analytics, /hourBuckets/);
assert.match(analytics, /recordReadingActivity/);

const prewarm = read("lib/sovereign/predictive-prewarm-engine.ts");
assert.match(prewarm, /canRunPredictivePrewarm/);
assert.match(prewarm, /prefetchMushafPage/);

const geo = read("lib/sovereign/prayer-geo-silent.ts");
assert.match(geo, /reconcilePrayerTimeZoneSilently/);
assert.match(geo, /getPrayerTimes/);

const cdn = read("lib/sovereign/cdn-failover-router.ts");
assert.match(cdn, /orderAudioUrlsByCdnHealth/);
assert.match(cdn, /recordCdnFailure/);

const wal = read("lib/sovereign/optimistic-wal.ts");
assert.match(wal, /runOptimisticWalPersist/);
assert.match(wal, /mergeLwwById/);

const audioEngine = read("core/audio/AudioEngine.ts");
assert.match(audioEngine, /crossfadeAudio/);
assert.match(audioEngine, /recordCdnSuccess/);

const bookmarks = read("lib/quran-my-bookmarks.ts");
assert.match(bookmarks, /runOptimisticWalPersist/);

const quranAudio = read("lib/quran-audio.ts");
assert.match(quranAudio, /orderAudioUrlsByCdnHealth/);

const bridge = read("lib/sovereign/SovereignNavigationBridge.tsx");
assert.match(bridge, /recordRouteForPredictivePrewarm/);

// LWW merge sanity
const merged = mergeLwwById(
  [{ id: 1, label: "a", at: "2026-01-01T00:00:00.000Z" }],
  [{ id: 1, label: "b", at: "2026-01-02T00:00:00.000Z" }],
);
assert.equal(merged[0]?.label, "b");

console.log("sovereign-part-ii-gate: OK");
