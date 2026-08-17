/**
 * بوابة: أزواج تباين الرموز في theme.css تطابق العتبة قبل CI.
 * تشغيل: node --import tsx src/lib/__tests__/theme-contrast-pairs.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const theme = readFileSync(resolve(root, "src/app/styles/theme.css"), "utf8");

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function relLum([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(fg: string, bg: string): number {
  const l1 = relLum(hexToRgb(fg));
  const l2 = relLum(hexToRgb(bg));
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
}

function tokenHex(name: string): string {
  const re = new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`);
  const m = theme.match(re);
  assert.ok(m, `الرمز ${name} غير موجود في theme.css`);
  return m[1].toUpperCase();
}

const block = theme.match(/CONTRAST_PAIRS_BEGIN([\s\S]*?)CONTRAST_PAIRS_END/);
assert.ok(block, "كتلة CONTRAST_PAIRS ناقصة من theme.css");

const rows = block[1]
  .split("\n")
  .map((l) => l.replace(/^\s*\*\s*/, "").trim())
  .filter((l) => l.startsWith("--"));

assert.ok(rows.length >= 6, "أزواج التباين أقل من المتوقع");

console.log("=== أزواج تباين @theme ===");
for (const line of rows) {
  const [fgToken, fgHex, bgHex, minRaw] = line.split("|");
  const min = Number(minRaw);
  const actualFg = tokenHex(fgToken).toUpperCase();
  assert.equal(actualFg, fgHex.toUpperCase(), `${fgToken} في الملف ≠ ${fgHex} في الجدول`);
  const ratio = contrast(fgHex, bgHex);
  assert.ok(
    ratio >= min,
    `${fgToken} ${fgHex} على ${bgHex} = ${ratio}:1 < ${min}:1`,
  );
  console.log(`  ✓ ${fgToken} ${fgHex} على ${bgHex} = ${ratio}:1 (≥${min})`);
}

assert.equal(tokenHex("--chip-bg"), "#E4F0EA");
assert.equal(tokenHex("--on-brand-muted"), "#E8F3EE");
assert.equal(tokenHex("--color-muted"), "#5E6E67");

console.log("theme-contrast-pairs.test.ts: ok");
