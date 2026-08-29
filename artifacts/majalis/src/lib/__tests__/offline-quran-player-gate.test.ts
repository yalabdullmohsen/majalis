/**
 * بوابة — OfflineQuranPlayer + QuranPlayerView (Capacitor، لا RN).
 * Run: node --import tsx src/lib/__tests__/offline-quran-player-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildProportionalAyahTimings,
  findAyahAtTime,
} from "../surah-ayah-timing";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(appRoot, rel), "utf8");

const engine = read("src/lib/offline-quran-player.ts");
assert.match(engine, /class OfflineQuranPlayer/);
assert.match(engine, /getOfflineSurahUrl/);
assert.match(engine, /attachAudioStallRecovery/);
assert.match(engine, /classifyPlaybackNetworkError/);
assert.doesNotMatch(engine, /from ['"]react-native-sound|import RNFS|from ['"]react-native/i);

const classifier = read("src/lib/playback-network-error.ts");
assert.match(classifier, /classifyPlaybackNetworkError/);
assert.match(classifier, /offline_missing/);

const view = read("src/components/quran/QuranPlayerView.tsx");
assert.match(view, /qpv-ayah--active/);
assert.match(view, /offlineQuranPlayer/);
assert.match(view, /findAyahAtTime/);
assert.doesNotMatch(view, /TouchableOpacity|StyleSheet|ScrollView/i);

const page = read("src/pages/quran/QuranOfflinePlayerPage.tsx");
assert.match(page, /\/quran\/offline-player/);

const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
assert.match(app, /QuranOfflinePlayerPage/);
assert.match(app, /path="\/quran\/offline-player"/);

const timings = buildProportionalAyahTimings(
  [
    { numberInSurah: 1, text: "بسم الله" },
    { numberInSurah: 2, text: "الحمد لله رب العالمين" },
  ],
  10,
);
assert.equal(timings.length, 2);
assert.equal(findAyahAtTime(timings, 0.4), 1);
assert.equal(findAyahAtTime(timings, 9.5), 2);

console.log("offline-quran-player-gate: ok");
