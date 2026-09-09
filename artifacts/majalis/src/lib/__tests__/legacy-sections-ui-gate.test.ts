/**
 * بوابة انحدار: أقسام كانت على قالب قديم (هيرو/بطاقات خضراء داكنة).
 * Run: node --import tsx src/lib/__tests__/legacy-sections-ui-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const sects = read("src/views/IslamicSectsPage.tsx");
const sectsCss = read("src/styles/pages/islamic-sects.css");
const akhlaq = read("src/views/AkhlaqPage.tsx");
const akhlaqCss = read("src/styles/pages/akhlaq.css");
const stories = read("src/views/IslamicStoriesPage.tsx");
const storiesCss = read("src/styles/pages/islamic-stories.css");
const amr = read("src/views/AmrBilMarufPage.tsx");
const template = read("src/config/section-template.ts");

for (const [name, src] of [
  ["sects", sects],
  ["akhlaq", akhlaq],
  ["stories", stories],
  ["amr", amr],
] as const) {
  assert.match(src, /SectionTemplatePage/, `${name} يستخدم SectionTemplatePage`);
}

assert.match(template, /"\/islamic-sects"/);
assert.match(template, /"\/akhlaq"/);
assert.match(template, /"\/stories"/);

assert.doesNotMatch(sects, /page-hero/, "الفرق بلا page-hero القديم");
assert.doesNotMatch(
  sects,
  /background:\s*["']linear-gradient\(135deg,\s*var\(--mj-brand-deep\)/,
  "الفرق بلا هيرو أخضر حاد مضمّن",
);
assert.match(sectsCss, /\.sect-hub__grid/);
assert.match(sectsCss, /justify-self:\s*center/, "Section card is not centered");
assert.match(sectsCss, /padding-bottom:\s*calc\(var\(--(?:nav-h|bottom-nav-height)/);
assert.match(sectsCss, /\.sect-hub__chip[\s\S]{0,80}?min-height:\s*44px/, "Filter chips touch target < 44px");
assert.match(sectsCss, /\.sect-hub__chips[\s\S]{0,220}?padding-inline/, "Filter chips clipped at edge: need padding-inline");

assert.match(akhlaqCss, /topic-page--akhlaq \.akl-hero/);
assert.match(akhlaqCss, /display:\s*none/);
assert.doesNotMatch(akhlaqCss, /#6D28D9|#7c3aed/i, "Off-brand purple found in akhlaq.css");
assert.match(akhlaqCss, /\.akl-cat[\s\S]{0,80}?min-height:\s*44px/, "Akhlaq chips touch target < 44px");

assert.doesNotMatch(
  storiesCss,
  /\.isp-card\s*\{[^}]*background:\s*var\(--elite-forest/s,
  "Heavy dark-green section cards found in stories",
);
assert.match(storiesCss, /\.isp-card\s*\{[^}]*--ss-card-bg/s);
assert.match(storiesCss, /\.isp-grid\s*>\s*:last-child:nth-child\(odd\)/, "Section card is not centered");
assert.doesNotMatch(storiesCss, /#6D28D9/, "Off-brand purple found in stories.css");
assert.match(storiesCss, /\.isp-chip[\s\S]{0,80}?min-height:\s*44px/, "Stories chips touch target < 44px");

assert.doesNotMatch(amr, /linear-gradient\(160deg,\s*var\(--mj-brand-deep\)/, "Low contrast text found inside dark hero");

for (const [name, src] of [
  ["sects", sects],
  ["akhlaq", akhlaq],
  ["stories", stories],
  ["amr", amr],
] as const) {
  assert.doesNotMatch(
    src,
    /AppBackButton|FloatingBackButton/,
    `Duplicate back buttons visible: ${name} must not render local back`,
  );
}

console.log("legacy-sections-ui-gate: ok");
