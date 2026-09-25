/**
 * PR-1: لا استماع ولا أدوات حجم خط في قصص الأنبياء.
 * Run: node --import tsx src/lib/__tests__/prophets-no-audio-font-controls-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const view = read("src/views/ProphetStoriesPage.tsx");
const css = read("src/styles/pages/prophet-stories.css");
const header = read("src/components/prophets/ProphetStoryReaderHeader.tsx");

console.log("=== no audio controls in prophets reader ===");
assert.doesNotMatch(view, /playAiNarration|stopAiNarration|isSpeechReadAloudSupported/);
assert.doesNotMatch(view, /prophet-speech-btn|speechPlaying|speakableText/);
assert.doesNotMatch(view, /Volume2|unlockAudioOnUserGesture/);
assert.doesNotMatch(view, /استماع لنص القصة|aria-label=\{speechPlaying/);
assert.doesNotMatch(view, /prophet-speech-btn|"استماع"\s*<\/span>/);
assert.doesNotMatch(css, /\.prophet-speech-btn/);

console.log("=== no font size controls in prophets reader ===");
assert.doesNotMatch(view, /prophet-font-controls|setFontSize|--pstory-fs/);
assert.doesNotMatch(view, /aria-label="تكبير الخط"|aria-label="تصغير الخط"|أ\+|أ−/);
assert.doesNotMatch(css, /\.prophet-font-controls/);

console.log("=== header: back + title only by default ===");
assert.match(header, /رجوع/);
assert.match(header, /data-has-actions=\{actions \? "1" : "0"\}/);
assert.match(view, /<ProphetStoryReaderHeader[\s\S]*?title=\{p\.arabicName\}[\s\S]*?onBack=\{onBack\}/);
assert.doesNotMatch(view, /actions=\{readerActions\}/);

console.log("=== detailed story content still present ===");
assert.match(view, /dbStory|briefBio|prophet-story-lux/);
assert.match(view, /data-ps-section="bio"|نبذة/);

console.log("prophets-no-audio-font-controls-gate.test.ts: ok");
