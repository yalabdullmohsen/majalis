/**
 * بوابة — مشغّل تحفيظ A-B مدمج مع AudioEngine.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(appRoot, rel), "utf8");

const player = read("src/components/quran/HifzAudioLoopPlayer.tsx");
assert.match(player, /AudioEngine/);
assert.match(player, /setLoopConfig/);
assert.match(player, /hifzPrefsToLoopConfig/);
assert.match(player, /data-testid="hifz-audio-loop-player"/);
assert.doesNotMatch(player, /"use client"/);

const view = read("src/pages/quran/ui/QuranHifzLoopView.tsx");
assert.match(view, /HifzAudioLoopPlayer/);
assert.match(view, /\/quran\/hifz-loop/);

const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
assert.match(app, /QuranHifzLoopPage/);
assert.match(app, /path="\/quran\/hifz-loop"/);

const hub = read("src/views/MemorizationHubPage.tsx");
assert.match(hub, /\/quran\/hifz-loop/);

const css = read("src/styles/components/hifz-audio-loop-player.css");
assert.match(css, /#1a4d3e|1a4d3e|--mj-brand-deep/i);

console.log("hifz-audio-loop-gate: ok");
