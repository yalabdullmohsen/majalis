/**
 * PR-4: الرئيسية + مركز القرآن + الأنبياء — استئناف حقيقي + لا clip + ذهب موحّد.
 * تشغيل: node --import tsx src/lib/__tests__/sunnah-pr4-home-quran-prophets-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const resume = read("src/components/home/HomeLocalResumeCard.tsx");
const openMushaf = read("src/components/quran/QuranOpenMushafCard.tsx");
const hubCss = read("src/styles/pages/quran-hub.css");
const prophetsCss = read("src/styles/pages/prophet-stories.css");
const polish = read("src/styles/ssunnah-ux-polish.css");
const prophetsPage = read("src/views/ProphetStoriesPage.tsx");

console.log("=== استئناف مصحف ذي معنى فقط ===");
assert.match(resume, /hasMeaningfulMushafResume|page > 1/);
assert.match(resume, /ayahKey !== "1:1"/);
assert.match(openMushaf, /hasMeaningfulResume/);

console.log("=== مركز قرآن: ذهب + عنوان CTA ليلي ===");
assert.match(hubCss, /--sunnah-quran-gold/);
assert.match(hubCss, /\.quran-open-mushaf__cta-label[\s\S]{0,80}--mj-on-brand/);
assert.doesNotMatch(
  hubCss,
  /html\.dark \.quran-open-mushaf__cta-label[\s\S]{0,60}color:\s*var\(--mj-ink\)\s*;/,
);

console.log("=== لوبي + مشغّل تلاوة ===");
assert.match(polish, /quran-mini-player-offset/);
assert.match(
  polish,
  /\.section-lobby[\s\S]{0,120}padding-bottom:\s*calc\([\s\S]{0,80}quran-mini-player-offset/,
);

console.log("=== أنبياء: بلا overflow clip على التفصيل + سيرة مختصرة ===");
assert.doesNotMatch(
  prophetsCss,
  /\.prophet-detail-lux\s*\{[^}]*overflow:\s*clip/s,
);
assert.match(prophetsCss, /\.prophet-detail-lux\s*\{[^}]*overflow:\s*visible/s);
assert.match(prophetsPage, /prophets-seerah-brief/);
assert.match(prophetsPage, /href="\/seerah"/);
assert.match(prophetsPage, /layoutIntegrity="prophets-v1"/);

console.log("sunnah-pr4-home-quran-prophets-gate.test.ts: ok");
