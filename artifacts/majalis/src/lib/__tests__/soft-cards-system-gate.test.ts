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

assert.match(theme, /--radius-card:\s*24px/, "رمز radius-card");
assert.match(theme, /--radius-tile:\s*24px/, "رمز radius-tile");
assert.match(theme, /--radius-button:\s*18px/, "رمز radius-button");
assert.match(theme, /--radius-sheet:\s*28px/, "رمز radius-sheet");
assert.match(theme, /--radius-nav:\s*28px/, "رمز radius-nav");
assert.match(theme, /--radius-pill:\s*999px/, "رمز radius-pill");
assert.match(soft, /--radius-button:\s*18px/, "soft-cards يحمل radius-button");
assert.match(soft, /--radius-card:\s*24px/, "soft-cards يحمل radius-card 24");
assert.match(soft, /\.soft-card\s*\{/, "فئة soft-card");
assert.match(soft, /\.soft-tile\s*\{/, "فئة soft-tile");
assert.match(soft, /inset 0 1px 0 rgba\(255,\s*255,\s*255/, "highlight داخلي");
assert.match(main, /soft-cards\.css/, "استيراد soft-cards في main");

const finalRelease = read("src/styles/final-release.css");
assert.match(
  finalRelease,
  /\.lesson-unified-card__btn\s*\{[^}]*border-radius:\s*var\(--radius-button/,
  "زر التفاصيل ناعم عبر radius-button",
);
assert.match(
  finalRelease,
  /bottom:\s*calc\(\s*var\(--bottom-nav-height[^)]*\)\s*\+\s*var\(--inset-bottom[^)]*\)\s*\+\s*16px/,
  "الرجوع العائم فوق الشريط السفلي بـ16px",
);
assert.match(finalRelease, /\.hub-card\s*,/, "HubCard ضمن polish الحواف الناعمة");
assert.doesNotMatch(soft, /\bbutton\s*\{/, "لا قاعدة button عامة في soft-cards");
assert.doesNotMatch(finalRelease, /^\s*button\s*\{/m, "لا قاعدة button عامة في final-release");

assert.match(prayer, /--pts-radius:\s*var\(--radius-card,\s*24px\)/, "الصلاة تستخدم نصف قطر البطاقة الناعمة 24px");
assert.match(prayer, /inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.12\)/, "highlight بطاقة البطل");
assert.doesNotMatch(prayer, /\.pts-row--next[\s\S]{0,120}border:\s*1\.5px/, "لا إطار سميك للصلاة القادمة");
assert.match(prayer, /\.pts-row\s*\{[\s\S]*?grid-template-columns:/, "صفوف المواقيت أفقية مضغوطة");
assert.match(prayer, /\.pts-list\s*\{[\s\S]*?flex-direction:\s*column/, "قائمة المواقيت عمودية");
assert.match(prayer, /\.pts-dock\s*\{[\s\S]*?grid-template-columns:\s*repeat\(\s*2/, "اختصارات 2×2");
assert.match(prayer, /border-radius:\s*1\.25rem\s+1\.25rem\s*0\s*0/, "حواف علوية ناعمة للشريط السفلي");
assert.match(prayer, /\.pts-chrome\s*\{[\s\S]*?display:\s*none/, "لا شريط رجوع/إعدادات عائم سفلي");

assert.match(prophets, /\.prophet-fact-card[\s\S]*?border-radius:\s*var\(--radius-tile/, "حقائق الأنبياء ناعمة");
assert.match(prophets, /\.prophet-lesson-card[\s\S]*?border-radius:\s*var\(--radius-card/, "دروس الأنبياء ناعمة");
assert.match(prophets, /\.prophet-lux-back[\s\S]*?border-radius:\s*var\(--radius-pill/, "رجوع pill");
assert.match(prophets, /\.prophet-chip-lux[\s\S]*?border-radius:\s*var\(--radius-pill/, "تصنيفات pill");

const contact = read("src/styles/pages/contact.css");
assert.match(contact, /\.contact-faq__trigger\s*\{[\s\S]*?border-radius:\s*var\(--radius-button/, "أسئلة التواصل بحواف ناعمة");
assert.match(contact, /appearance:\s*none/, "لا مظهر زر المتصفح الافتراضي في FAQ");

console.log("soft-cards-system-gate.test.ts: ok");
