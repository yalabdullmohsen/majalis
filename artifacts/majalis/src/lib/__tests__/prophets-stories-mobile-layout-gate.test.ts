/**
 * بوابة محاذاة قصص الأنبياء + إخفاء الشريط المتحرك + استماع.
 * node --import tsx src/lib/__tests__/prophets-stories-mobile-layout-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isCompactHeaderPath, isPinnedChromePath } from "../immersive-chrome";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/styles/pages/prophet-stories.css"), "utf8");
const view = readFileSync(resolve(root, "src/views/ProphetStoriesPage.tsx"), "utf8");
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const speech = readFileSync(resolve(root, "src/lib/speech-read-aloud.ts"), "utf8");
const stb = readFileSync(resolve(root, "src/styles/components/scholarly-trust.css"), "utf8");

assert.equal(isCompactHeaderPath("/prophets"), true);
assert.equal(isPinnedChromePath("/prophets/nuh"), true);
assert.match(app, /isPinnedChromePath\(location\)/);

assert.match(css, /inset-inline-start:\s*1\.15rem/);
assert.doesNotMatch(css, /\.prophet-timeline__line\s*\{[^}]*left:\s*50%/s);
assert.match(css, /\.prophet-timeline__card[\s\S]{0,220}max-width:\s*none/);
assert.match(css, /\.prophet-detail-lux \.stb-row__label/);
assert.match(css, /\.prophet-story-lux__footer span[\s\S]{0,120}--ps-text-primary/);
assert.match(css, /overflow-x:\s*clip/);
assert.match(css, /padding-bottom:\s*calc\(var\(--bottom-nav-height/);

assert.match(view, /prophet-speech-btn/);
assert.match(view, /speakArabicText|stopSpeechReadAloud/);
assert.match(view, /استماع/);
assert.match(speech, /speechSynthesis/);
assert.match(speech, /lang\s*=\s*"ar"/);
assert.match(stb, /html\.dark \.stb-row__value/);

console.log("prophets-stories-mobile-layout-gate: ok");
