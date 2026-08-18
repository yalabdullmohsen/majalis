/**
 * بوابة: نص العلامة على الأسطح الفاتحة عبر --brand-on-white لا --mj-brand.
 * تشغيل: node --import tsx src/lib/__tests__/a11y-contrast-100-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const aliases = readFileSync(resolve(root, "src/styles/theme-aliases.css"), "utf8");
const theme = readFileSync(resolve(root, "src/app/styles/theme.css"), "utf8");
const statusCss = readFileSync(resolve(root, "src/styles/pages/lessons-legacy.css"), "utf8");

const rootBlock = aliases.match(/:root \{[\s\S]*?\n\}/);
assert.ok(rootBlock, "كتلة :root في theme-aliases");
assert.match(rootBlock[0], /--text-brand:\s*var\(--brand-on-white\)/, "نص العلامة نهاري = brand-on-white");
assert.match(rootBlock[0], /--msk-gold:\s*var\(--brand-on-white\)/, "روابط الرئيسية على brand-soft ≥4.5");
assert.match(theme, /--brand-on-white\|#146C4E\|#E4F0EA\|4\.5/, "زوج brand-on-white على chip-bg في CONTRAST_PAIRS");
assert.match(
  statusCss,
  /\.lesson-unified-card__status \{[\s\S]*?color:\s*var\(--chip-fg/,
  "شارة حالة الدرس تستخدم --chip-fg",
);

console.log("a11y-contrast-100-gate.test.ts: ok");
