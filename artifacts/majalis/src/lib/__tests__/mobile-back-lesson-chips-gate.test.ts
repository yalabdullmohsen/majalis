/**
 * بوابة: رجوع داخل هيدر الأقسام + تباين chips الدروس ليلاً (بلا عائم ثابت).
 * تشغيل: node --import tsx src/lib/__tests__/mobile-back-lesson-chips-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const appBack = read("src/components/common/AppBackButton.tsx");
assert.doesNotMatch(appBack, /isTabRootPath/);
assert.match(appBack, /ariaLabel = "رجوع"/);

const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /variant="floating"/);

const lobby = read("src/components/lobby/SectionLobby.tsx");
assert.match(lobby, /AppBackButton/, "رجوع مدمج في اللوبي");
assert.match(lobby, /section-lobby__back/);
assert.doesNotMatch(lobby, /FloatingBackButton/);

const polish = read("src/styles/sections-calm-polish.css");
assert.match(polish, /--mj-chip-bg:/);
assert.match(polish, /--mj-chip-fg:/);
assert.match(polish, /--mj-chip-active-bg:/);
assert.match(polish, /--mj-chip-active-fg:/);
assert.match(polish, /html\.dark[\s\S]*?--mj-chip-active-fg:\s*#06231a/);
assert.match(polish, /html\.dark[\s\S]*?--mj-chip-fg:\s*#f3f7f5/);
assert.match(polish, /\.floating-back-btn[\s\S]*?display:\s*none/);

const lessonsCss = read("src/styles/pages/lessons.css");
assert.match(lessonsCss, /--mj-chip-active-fg/);
assert.match(lessonsCss, /html\.dark[\s\S]*?\.filter-chips__chip\.is-active[\s\S]*?#06231a/);
assert.match(lessonsCss, /\.lessons-page-v3\s*\{[\s\S]*?padding-bottom:\s*calc\(\s*var\(--bottom-nav-height/);
assert.match(lessonsCss, /\.lesson-filters__chips\s*\{[\s\S]*?overflow-x:\s*auto/);
assert.doesNotMatch(
  lessonsCss.slice(lessonsCss.indexOf(".lessons-page-v2 .filter-chips {"), lessonsCss.indexOf(".lessons-page-v2 .filter-chips__chip {") + 80),
  /background:\s*var\(--surface-muted/,
  "فلاتر الدروس بلا صندوق muted ثقيل",
);

const unify = read("src/styles/visual-identity-unify.css");
assert.doesNotMatch(
  unify,
  /\.filter-chips__chip\.is-active[\s\S]{0,120}background:\s*var\(--color-selected\)/,
  "لا خلفية selected شفافة تخفي نص «درس» ليلاً",
);

const contrast = read("src/styles/visual-layer-contrast-fix.css");
assert.match(contrast, /\.lesson-filters__chips[\s\S]*?background:\s*transparent\s*!important/);

console.log("mobile-back-lesson-chips-gate.test.ts: ok");
