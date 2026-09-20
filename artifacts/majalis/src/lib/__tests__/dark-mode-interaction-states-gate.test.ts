/**
 * بوابة: نظام حالات التفاعل الليلي — tokens متمايزة + لا highlight وهمي.
 * تشغيل: node --import tsx src/lib/__tests__/dark-mode-interaction-states-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const states = read("src/styles/interaction-states.css");
const theme = read("src/app/styles/theme.css");
const main = read("src/main.tsx");
const quranHub = read("src/styles/pages/quran-hub.css");
const darkSurfaces = read("src/styles/dark-mode-surfaces.css");
const topicPage = read("src/styles/components/topic-page.css");
const refine = read("src/styles/premium-dark-refine.css");

for (const token of [
  "--state-default-bg",
  "--state-hover-bg",
  "--state-active-bg",
  "--state-focus-outline",
  "--state-selected-bg",
  "--state-current-bg",
  "--state-highlighted-bg",
  "--state-visited-fg",
  "--state-selection-bg",
]) {
  assert.match(states, new RegExp(token.replace(/-/g, "\\-")), `states defines ${token}`);
}

assert.match(states, /::selection/, "defines ::selection");
assert.match(states, /\.topic-page__crumb[\s\S]*?background:\s*transparent/, "crumb transparent");
assert.match(
  states,
  /منع Highlight وهمي[\s\S]*?\.quran-open-mushaf__resume[\s\S]*?background:\s*transparent/,
  "resume no fake highlight",
);
assert.match(states, /:focus-visible/, "keeps focus-visible");
assert.doesNotMatch(
  states,
  /:focus-visible[\s\S]{0,80}background:\s*var\(--state-selected/,
  "focus-visible ≠ selected bg",
);

assert.match(theme, /--state-selected-bg/, "theme dark contract has selected");
assert.match(theme, /--state-current-bg/, "theme dark contract has current");
assert.match(main, /interaction-states\.css/, "main imports interaction-states");

assert.doesNotMatch(
  quranHub.replace(/\/\*[\s\S]*?\*\//g, ""),
  /html\[data-theme="dark"\]\s*\.quran-open-mushaf__resume[\s\S]{0,200}background:\s*color-mix/,
  "quran-hub resume بلا wash أخضر",
);
assert.doesNotMatch(
  darkSurfaces.replace(/\/\*[\s\S]*?\*\//g, ""),
  /html\[data-theme="dark"\]\s*\.quran-open-mushaf__resume[\s\S]{0,200}background:\s*color-mix/,
  "dark-surfaces resume بلا wash أخضر",
);
assert.match(
  darkSurfaces,
  /\.quran-open-mushaf__resume[\s\S]{0,160}background:\s*transparent/,
  "dark-surfaces resume شفاف",
);

assert.match(topicPage, /\.topic-page__crumb[\s\S]{0,160}background:\s*transparent/, "topic crumb transparent");
assert.match(refine, /\.soft-card:focus-visible/, "refine يفصل focus-visible");
assert.doesNotMatch(
  refine,
  /\.soft-card:is\(:focus-visible,\s*\.is-active/,
  "لا دمج focus مع active في نفس القاعدة",
);

console.log("dark-mode-interaction-states-gate.test.ts: ok");
