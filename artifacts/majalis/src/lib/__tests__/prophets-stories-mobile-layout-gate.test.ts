/**
 * بوابة محاذاة قصص الأنبياء — بلا استماع ولا أدوات خط في القارئ.
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
const header = readFileSync(resolve(root, "src/components/prophets/ProphetStoryReaderHeader.tsx"), "utf8");
const stb = readFileSync(resolve(root, "src/styles/components/scholarly-trust.css"), "utf8");

assert.equal(isCompactHeaderPath("/prophets"), true);
assert.equal(isPinnedChromePath("/prophets"), true);
assert.equal(isPinnedChromePath("/prophets/nuh"), false);
assert.match(app, /isPinnedChromePath\(location\)/);

assert.match(css, /inset-inline-start:\s*1\.15rem/);
assert.doesNotMatch(css, /\.prophet-timeline__line\s*\{[^}]*left:\s*50%/s);
assert.match(css, /\.prophet-timeline__card[\s\S]{0,220}max-width:\s*none/);
assert.match(css, /\.prophet-detail-lux \.stb-row__label/);
assert.match(css, /overflow-x:\s*clip/);
assert.match(css, /\.prophet-reader-header/);
assert.match(css, /padding-bottom:\s*calc\(var\(--inset-bottom/);

assert.match(view, /ProphetStoryReader/);
assert.match(view, /ProphetStoryReaderHeader/);
assert.doesNotMatch(view, /prophet-speech-btn|playAiNarration|stopAiNarration|speakableText/);
assert.doesNotMatch(view, /prophet-font-controls|setFontSize|أ\+|أ−/);
assert.doesNotMatch(view, /aria-label=\{speechPlaying|"استماع لنص القصة"/);
assert.doesNotMatch(css, /\.prophet-speech-btn|\.prophet-font-controls/);
assert.match(header, /data-has-actions/);
assert.match(stb, /html\.dark \.stb-row__value/);

console.log("prophets-stories-mobile-layout-gate: ok");
