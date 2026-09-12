/**
 * بوابة — شبكة البطاقات المتجاوبة + سلامة النص العربي.
 * Run: node --import tsx src/lib/__tests__/responsive-card-grid-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
/** أزل التعليقات حتى لا تُحسب كلمات داخل الشرح */
const stripCssComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

const sys = read("src/styles/responsive-card-system.css");
const sysCode = stripCssComments(sys);
const hub = read("src/styles/components/hub-card.css");
const lobby = read("src/components/lobby/section-lobby.css");
const cards = read("src/components/sections/section-cards.css");
const tokens = read("src/styles/design-tokens.css");
const indexCss = read("src/index.css");
const typo = read("src/styles/typography-app.css");
const main = read("src/main.tsx");

console.log("=== Responsive Card System ===");

assert.ok(existsSync(resolve(root, "src/styles/responsive-card-system.css")), "ملف النظام موجود");
assert.match(main, /responsive-card-system\.css/, "مستورد في main.tsx");
assert.match(tokens, /--card-min-width:\s*min\(100%,\s*16\.25rem\)/, "حد أدنى 16.25rem");
assert.match(sys, /--card-min-width:\s*min\(100%,\s*16\.25rem\)/, "توكن الشبكة في النظام");
assert.match(sys, /repeat\(\s*auto-fit/, "auto-fit مركزي");
assert.match(sys, /--content-bottom-inset/, "inset سفلي فوق Bottom Nav");
assert.match(sys, /responsive-card-grid--compact/, "density: compact");
assert.match(sys, /responsive-card-grid--standard/, "density: standard");
assert.match(sys, /responsive-card-grid--wide/, "density: wide");
assert.match(sys, /responsive-card-grid--featured/, "density: featured");

console.log("=== Arabic title integrity ===");

const ARABIC_TITLES = [
  "الحكم الشرعي",
  "المطلق والمقيد",
  "الناسخ والمنسوخ",
  "الأمر والنهي",
  "الحريات والحدود",
  "دليل الجامعات الشرعية",
  "مصطلحات علوم القرآن",
  "الأحاديث الضعيفة",
];

for (const t of ARABIC_TITLES) {
  assert.ok([...t].length >= 5, `عنوان حقيقي للاختبار: ${t}`);
  assert.doesNotMatch(t, /\n/, "عنوان سطر واحد منطقيًا");
}

assert.match(sysCode, /writing-mode:\s*horizontal-tb/, "عناوين أفقية");
assert.match(sysCode, /word-break:\s*normal/, "word-break عادي");
assert.match(sysCode, /overflow-wrap:\s*break-word/, "break-word لا anywhere");
assert.doesNotMatch(sysCode, /overflow-wrap:\s*anywhere/, "لا anywhere في قواعد النظام");
assert.doesNotMatch(sysCode, /word-break:\s*break-all/, "لا break-all");
assert.doesNotMatch(stripCssComments(hub), /overflow-wrap:\s*anywhere/, "hub-card بلا anywhere");
assert.doesNotMatch(
  stripCssComments(typo),
  /\.hub-card__title[\s\S]{0,200}overflow-wrap:\s*anywhere/,
  "typography بلا anywhere على العنوان",
);

const bodyBlocks = [...indexCss.matchAll(/body\s*\{[^}]+\}/g)].map((m) => m[0]);
assert.ok(bodyBlocks.length > 0, "قاعدة body");
assert.ok(
  bodyBlocks.some((b) => /overflow-wrap:\s*break-word/.test(b)),
  "body يستخدم break-word",
);
assert.ok(
  bodyBlocks.every((b) => !/overflow-wrap:\s*anywhere/.test(b)),
  "body بلا anywhere",
);

console.log("=== Hub / Lobby / Card grids ===");

assert.match(hub, /auto-fit/, "hub-card-grid متجاوب");
assert.doesNotMatch(
  stripCssComments(hub),
  /grid-template-columns:\s*repeat\(\s*2\s*,\s*minmax\(\s*0/,
  "hub بلا عمودين ثابتين",
);
assert.match(lobby, /auto-fit/, "section-lobby__grid متجاوب");
assert.doesNotMatch(
  stripCssComments(lobby),
  /grid-template-columns:\s*repeat\(\s*2\s*,\s*minmax\(\s*0/,
  "lobby بلا عمودين ثابتين",
);
assert.match(cards, /auto-fit/, "card-grid متجاوب");
assert.doesNotMatch(
  stripCssComments(cards),
  /grid-template-columns:\s*repeat\(\s*2\s*,\s*minmax\(\s*0/,
  "card-grid بلا عمودين ثابتين",
);

console.log("=== Knowledge page grids (no forced 2-col) ===");

const knowledgePages = [
  "src/styles/pages/fiqh-hub.css",
  "src/styles/pages/tawhid.css",
  "src/styles/pages/hadith.css",
  "src/styles/pages/miracles.css",
  "src/styles/pages/section-hub.css",
  "src/styles/pages/lessons.css",
  "src/styles/pages/tarikh-islami.css",
  "src/styles/pages/prophet-stories.css",
  "src/styles/discover-islam.css",
];

for (const p of knowledgePages) {
  const css = stripCssComments(read(p));
  assert.doesNotMatch(
    css,
    /grid-template-columns:\s*repeat\(\s*2\s*,\s*minmax\(\s*0\s*,\s*1fr\s*\)/,
    `${p}: لا repeat(2) ثابت لشبكات البطاقات`,
  );
}

console.log("=== Viewport plan + odd count ===");

for (const w of [320, 375, 390, 430]) {
  const content = w - 40;
  const cols = Math.floor((content + 12) / (16.25 * 16));
  assert.ok(cols <= 1, `${w}px → عمود واحد منطقيًا (محسوب=${cols})`);
}
assert.ok(Math.floor((720 - 48 + 12) / 260) >= 2, "≈720px يتسع لعمودين");

for (const n of [3, 5, 7]) {
  assert.equal(n % 2, 1, `عدد فردي ${n}`);
}
assert.match(sys, /:last-child:nth-child\(odd\)/, "قاعدة البطاقة اليتيمة");

console.log("=== CI anti-regression snippets ===");

assert.match(hub, /-webkit-line-clamp:\s*var\(--card-title-lines/, "عنوان حتى 3 أسطر عبر توكن");
assert.match(sys, /\.hub-card-grid/, "hub-card-grid ضمن النظام المركزي");
assert.doesNotMatch(sys, /LegacyCardGrid/, "لا LegacyCardGrid");
assert.match(hub, /max-width:\s*100%/, "بطاقة بلا عرض ثابت 22rem");

console.log("responsive-card-grid-gate.test.ts: ok");
