/**
 * بوابة استرداد الوضع الليلي P0 — سُنّة
 * تشغيل: node --import tsx src/lib/__tests__/dark-mode-recovery-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const recovery = read("src/styles/dark-mode-recovery.css");
assert.match(recovery, /--dm-bg:/, "توكن خلفية ليلية");
assert.match(recovery, /--dm-surface-elevated:/, "توكن سطح مرتفع");
assert.match(recovery, /--dm-text-primary:/, "توكن نص أساسي");
assert.match(recovery, /--dm-text-secondary:/, "توكن نص ثانوي");
assert.match(recovery, /--dm-bottom-nav:/, "توكن شريط سفلي");
assert.match(recovery, /--dm-drawer:/, "توكن درج");
assert.match(recovery, /\.bottom-nav/, "إصلاح الشريط السفلي");
assert.match(recovery, /\.sidebar-panel/, "إصلاح الدرج");
assert.match(recovery, /\.hus-field/, "إصلاح البحث");
assert.match(recovery, /\.home-start-here/, "إصلاح بطاقة الزائر");
assert.match(recovery, /\.page-hero-mj/, "إصلاح الهيرو");
assert.doesNotMatch(recovery, /filter:\s*invert/, "بلا invert");
assert.doesNotMatch(recovery, /mix-blend-mode:\s*(multiply|screen|difference|exclusion)/, "بلا blend ضار");

const main = read("src/main.tsx");
assert.match(main, /import\s+['"]\.\/styles\/dark-mode-recovery\.css['"]/, "الاسترداد متزامن من main");
assert.match(main, /dark-mode-recovery\.css/, "الاسترداد محمّل من main");

const nav = read("src/styles/m2030/navigation.css");
assert.match(nav, /--brand-on-surface/, "تبويب نشط ليلي لا يعتمد على brand-on-light وحده");

assert.equal(
  existsSync(resolve(root, "src/components/home/HomeLearningSeasonsWidget.tsx")),
  false,
  "ويدجت مواسم التعلم محذوف",
);
const layout = read("src/lib/homepage-layout.ts");
assert.doesNotMatch(layout, /learning-seasons/, "لا معرّف learning-seasons");

const startHere = read("src/components/home/HomeStartHereSection.tsx");
assert.match(startHere, /home-start-here--compact/, "بطاقة زائر مختصرة");
assert.match(startHere, /hsh-steps--rows/, "خطوات صفوف لا بطاقات متداخلة");

console.log("dark-mode-recovery-gate.test.ts: ok");
