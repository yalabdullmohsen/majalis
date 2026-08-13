/**
 * بوابة ثابتة: شيت المزيد — سطح علامة + لا أبيض يتيم + line-clamp.
 * تشغيل: node --import tsx src/lib/__tests__/more-hub-tile-colors.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/styles/components/more-bottom-sheet.css"), "utf8");
const tsx = readFileSync(resolve(root, "src/components/MoreBottomSheet.tsx"), "utf8");
const tokens = readFileSync(resolve(root, "src/styles/tokens.css"), "utf8");

assert.match(tsx, /more-sheet-item--featured surface-brand/);
assert.match(tsx, /on-brand-secondary/);
assert.match(tokens, /\.surface-brand\s*,/);
assert.match(tokens, /:root\s*\{[\s\S]*?--surface-brand-solid:/);
assert.match(tokens, /--on-brand:\s*#ffffff/);
assert.match(css, /more-sheet-item--featured\.surface-brand/);
assert.match(css, /background-color:\s*var\(--surface-brand-solid,\s*var\(--mj-brand\)\)/);
assert.match(css, /background-image:\s*linear-gradient/);
assert.match(css, /:not\(\.more-sheet-item--featured\)/);
assert.match(css, /more-sheet-item--quick[\s\S]*?-webkit-line-clamp:\s*2/);
assert.match(css, /app-sheet__footer/);

assert.match(
  css,
  /\.bottom-sheet--services \.more-sheet-item:not\(\.more-sheet-item--featured\)\s*\{[\s\S]*?background:\s*var\(--surface-card/,
);
assert.match(
  css,
  /\.bottom-sheet--services \.more-sheet-item\.more-sheet-item--featured\.surface-brand/,
);

const themeAliases = readFileSync(resolve(root, "src/styles/theme-aliases.css"), "utf8");
assert.match(themeAliases, /--surface-brand-solid:\s*var\(--mj-brand\)/);

const shimmer = css.match(/\.more-sheet-item__shimmer\s*\{[^}]+\}/)?.[0] ?? "";
assert.doesNotMatch(shimmer, /rgba\(255,\s*255,\s*255,\s*0\.(1[9-9]|[2-9])/);
assert.doesNotMatch(shimmer, /mix-blend-mode:\s*(plus-lighter|lighten|color-dodge)/);

console.log("more-hub-tile-colors.test.ts: ok");
