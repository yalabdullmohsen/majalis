/**
 * بوابة — مركز العبادة القرآنية (مواقيت + تحفيظ + أوفلاين Majlis-native).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "./full-quran-downloader-gate.test.ts";
import "./offline-quran-player-gate.test.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(appRoot, rel), "utf8");

const view = read("src/pages/quran/ui/QuranWorshipHubView.tsx");
assert.match(view, /usePrayerCountdown/);
assert.match(view, /HifzAudioLoopPlayer/);
import "./audio-library-engine.test.ts";

assert.match(view, /ReciterDownloadManager/);
assert.match(view, /\/quran\/offline-player/);
assert.match(view, /AudioLibrarySelectionPanel/);
assert.match(view, /\/quran\/worship-hub/);
assert.doesNotMatch(view, /AdhanCalculationService/);
assert.doesNotMatch(view, /OfflineRecitationManager/);
assert.doesNotMatch(view, /"use client"/);

const app = read("src/App.tsx");
assert.match(app, /QuranWorshipHubPage/);
assert.match(app, /path="\/quran\/worship-hub"/);

const hub = read("src/views/MemorizationHubPage.tsx");
assert.match(hub, /\/quran\/worship-hub/);

const css = read("src/styles/quran-worship-hub.css");
assert.match(css, /surface-brand|qwh-prayer-strip/);

console.log("quran-worship-hub-gate: ok");
