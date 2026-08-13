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

const filtersCss = readFileSync(resolve(appRoot, "src/styles/components/filters.css"), "utf8");
const lessonsCss = readFileSync(resolve(appRoot, "src/styles/pages/lessons.css"), "utf8");
const chipsTsx = readFileSync(resolve(appRoot, "src/components/ui/FilterChips.tsx"), "utf8");
const lessonsView = readFileSync(resolve(appRoot, "src/pages/lessons/ui/LessonsView.tsx"), "utf8");

assert.equal(/exclusive-choice/.test(chipsTsx), false, "بلا exclusive-choice يفرض شكلًا متضاربًا");
assert.match(chipsTsx, /SegmentedFilter/, "FilterChips يغلف النظام الموحّد");
assert.match(filtersCss, /\.mj-filter-chip\s*\{[\s\S]*?min-height:\s*44px/);
assert.match(filtersCss, /\.mj-filter-chip\.is-active\s*\{[\s\S]*?color:\s*#fff/);
assert.match(lessonsCss, /\.lessons-page-v3/);
assert.match(lessonsView, /all:\s*"الكل"/);
assert.match(lessonsView, /SegmentedFilter|FilterBar/);
assert.match(lessonsView, /useDebouncedValue/);

console.log("lessons-filter-chips-layout.test.ts: ok");
