/**
 * بوابة: توحيد الأخضر الغامق (فقه) على بنرات/تبويب/تصفية الأقسام الرئيسية.
 * لا يمسّ أنماط قراءة المصحف الداخلية.
 * تشغيل: node --import tsx src/lib/__tests__/unify-dark-emerald-theme-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const theme = read("src/app/styles/theme.css");
assert.match(theme, /--color-primary-dark:\s*var\(--mj-brand-deep\)/);
assert.match(theme, /--color-active-tab-bg:/);
assert.match(theme, /--mj-brand-deep:\s*#123F2E/);

const featured = read("src/components/sections/section-cards.css");
assert.match(featured, /\.card--featured[\s\S]{0,400}--color-primary-dark|--mj-brand-deep/);
assert.doesNotMatch(
  featured,
  /\.card--featured\s*\{[^}]*background-color:\s*#1f7a5a/i,
  "بطاقة مميّزة بلا خلفية Teal الفاتحة",
);

const bottom = read("src/styles/final-release.css");
assert.match(
  bottom,
  /\.bottom-nav__tab\.is-active[\s\S]{0,200}--color-primary-dark|--mj-brand-deep/,
);

const lessons = read("src/styles/pages/lessons.css");
assert.match(lessons, /\.kuwait-tab--active[\s\S]{0,160}--color-primary-dark|--mj-brand-deep/);
assert.match(lessons, /\.lessons-filter-tab--active[\s\S]{0,160}--color-primary-dark|--mj-brand-deep/);

const lobby = read("src/components/lobby/section-lobby.css");
assert.match(lobby, /\.section-lobby__chip\.is-active[\s\S]{0,160}--color-primary-dark|--mj-brand-deep/);

/* واجهة المصحف الداخلية لم تُمسّ بهذا التوحيد */
const mushaf = read("src/features/mushaf-madinah/mushaf-madinah.css");
assert.doesNotMatch(mushaf, /--color-primary-dark/);
assert.doesNotMatch(mushaf, /--color-active-tab-bg/);

console.log("unify-dark-emerald-theme-gate.test.ts: ok");
