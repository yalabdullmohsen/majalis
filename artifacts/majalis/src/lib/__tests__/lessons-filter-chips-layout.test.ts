/**
 * فلتر الدروس: بطاقة مستطيلة، أهداف لمس ≥44px، بلا قصّ نص.
 * تشغيل: node --import tsx src/lib/__tests__/lessons-filter-chips-layout.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const chipsCss = readFileSync(resolve(appRoot, "src/styles/components/page-hero.css"), "utf8");
const lessonsCss = readFileSync(resolve(appRoot, "src/styles/pages/lessons.css"), "utf8");
const chipsTsx = readFileSync(resolve(appRoot, "src/components/ui/FilterChips.tsx"), "utf8");
const lessonsView = readFileSync(resolve(appRoot, "src/pages/lessons/ui/LessonsView.tsx"), "utf8");

assert.equal(/exclusive-choice/.test(chipsTsx), false, "بلا exclusive-choice يفرض شكلًا متضاربًا");
assert.match(chipsCss, /\.filter-chips\s*\{[\s\S]*?flex-wrap:\s*wrap/);
assert.match(chipsCss, /\.filter-chips\s*\{[\s\S]*?border-radius:\s*var\(--mj-r-md/);
assert.match(chipsCss, /\.filter-chips__chip\s*\{[\s\S]*?min-height:\s*44px/);
assert.match(chipsCss, /\.filter-chips__chip\s*\{[\s\S]*?border-radius:\s*var\(--mj-r-sm/);
assert.equal(
  /\.filter-chips\s*\{[\s\S]*?border-radius:\s*var\(--mj-r-pill/.test(chipsCss),
  false,
  "حاوية التصفية بلا pill",
);
assert.match(chipsCss, /\.filter-chips__label\s*\{[\s\S]*?text-overflow:\s*clip/);
assert.match(lessonsCss, /\.lessons-page-v2 \.filter-chips/);
assert.match(lessonsView, /all:\s*"الكل"/);

console.log("lessons-filter-chips-layout.test.ts: ok");
