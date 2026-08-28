/**
 * بوابة — نظام soft-card: رموز الحواف + فئات موحّدة للصلاة/الداكن.
 * Run: node --import tsx src/lib/__tests__/soft-cards-system-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const soft = read("src/styles/soft-cards.css");
const theme = read("src/app/styles/theme.css");
const main = read("src/main.tsx");
const prayer = read("src/styles/pages/prayer-times.css");
const prophets = read("src/styles/pages/prophet-stories.css");

assert.match(theme, /--radius-card:\s*28px/, "رمز radius-card");
assert.match(theme, /--radius-tile:\s*24px/, "رمز radius-tile");
assert.match(theme, /--radius-pill:\s*999px/, "رمز radius-pill");
assert.match(soft, /\.soft-card\s*\{/, "فئة soft-card");
assert.match(soft, /\.soft-tile\s*\{/, "فئة soft-tile");
assert.match(soft, /inset 0 1px 0 rgba\(255,\s*255,\s*255/, "highlight داخلي");
assert.match(main, /soft-cards\.css/, "استيراد soft-cards في main");

assert.match(prayer, /--pts-radius:\s*22px/, "الصلاة تستخدم نصف قطر 22px");
assert.match(prayer, /inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.12\)/, "highlight بطاقة البطل");
assert.doesNotMatch(prayer, /\.pts-row--next[\s\S]{0,120}border:\s*1\.5px/, "لا إطار سميك للصلاة القادمة");
assert.match(prayer, /\.pts-row\s*\{[\s\S]*?width:\s*min\(\s*88vw,\s*430px\)/, "بطاقات الصلاة متمركزة بعرض محدود");
assert.match(prayer, /\.pts-row--next\s*\{[\s\S]*?width:\s*min\(\s*88vw,\s*440px\)/, "الصلاة القادمة أعرض قليلًا");
assert.match(prayer, /\.pts-list\s*\{[\s\S]*?align-items:\s*center/, "قائمة المواقيت متمركزة");

assert.match(prophets, /\.prophet-fact-card[\s\S]*?border-radius:\s*var\(--radius-tile/, "حقائق الأنبياء ناعمة");
assert.match(prophets, /\.prophet-lesson-card[\s\S]*?border-radius:\s*var\(--radius-card/, "دروس الأنبياء ناعمة");
assert.match(prophets, /\.prophet-lux-back[\s\S]*?border-radius:\s*var\(--radius-pill/, "رجوع pill");
assert.match(prophets, /\.prophet-chip-lux[\s\S]*?border-radius:\s*var\(--radius-pill/, "تصنيفات pill");

console.log("soft-cards-system-gate.test.ts: ok");
