/**
 * بوابة: عناوين الهيرو/الأقسام في الوضع الليلي تحقق WCAG AA على سطح islamic الداكن.
 * تشغيل: node --import tsx src/lib/__tests__/dark-mode-heading-contrast-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function relLum({ r, g, b }: { r: number; g: number; b: number }): number {
  const f = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: string, b: string): number {
  const L1 = relLum(hexToRgb(a));
  const L2 = relLum(hexToRgb(b));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

const green = read("src/styles/green-surface-system.css");
const tokens = read("src/styles/design-tokens.css");
const refine = read("src/styles/premium-dark-refine.css");
const lobby = read("src/components/lobby/section-lobby.css");
const mss = read("src/styles/components/modern-section-shell.css");

console.log("\n=== عناوين الوضع الليلي — رموز ===");

/* ليلي: mss-on-hero يجب أن يُعاد ضبطه (لا يبقى #16241e) */
{
  const darkIdx = green.indexOf('html[data-theme="dark"]');
  assert.ok(darkIdx >= 0, "green-surface dark block");
  const darkBlock = green.slice(darkIdx, darkIdx + 1800);
  assert.match(darkBlock, /--mss-on-hero:\s*#f3efe6/i);
  assert.match(darkBlock, /--mss-on-hero-muted:\s*#d8d0c4/i);
  assert.match(darkBlock, /--mss-on-hero-accent:\s*#6fd0a8/i);
  assert.doesNotMatch(darkBlock, /--mss-on-hero:\s*#16241e/i);
}

assert.match(tokens, /--mss-on-hero:\s*#f3efe6/i);
assert.match(refine, /--mss-on-hero:\s*var\(--pd-ink/);
assert.match(lobby, /section-lobby__title[\s\S]*?--mss-on-hero/);
assert.match(refine, /section-lobby__title/);
assert.match(mss, /--mss-on-hero:\s*#16241e/, "نهاري يبقى حبر غامق");

/* تباين محسوب: عنوان أساسي + ثانوي + تمييز على سطح islamic الداكن */
const BG = "#131c19";
const pairs: Array<[string, string, number]> = [
  ["عنوان أساسي #F3EFE6", "#F3EFE6", 4.5],
  ["عنوان ثانوي #D8D0C4", "#D8D0C4", 4.5],
  ["تمييز زمردي #6FD0A8", "#6FD0A8", 3],
  ["حبر قديم ممنوع #16241E", "#16241E", 0], // يُثبت الفشل التاريخي
];

console.log("\n=== نسب التباين على", BG, "===");
for (const [label, fg, min] of pairs) {
  const ratio = contrast(fg, BG);
  if (min === 0) {
    assert.ok(ratio < 2, `${label}: كان ${ratio.toFixed(2)} — يجب أن يبقى فاشلًا كدليل تاريخي`);
    console.log(`  · ${label}: ${ratio.toFixed(2)}:1 (فاشل تاريخيًا — مُستبدَل)`);
    continue;
  }
  assert.ok(ratio >= min, `${label}: ${fg} على ${BG} = ${ratio.toFixed(2)} < ${min}`);
  console.log(`  ✓ ${label}: ${ratio.toFixed(2)}:1 (≥${min})`);
}

/* لا تبييض نص الجسم عبر رفع --mj-ink هنا */
assert.doesNotMatch(
  green.slice(green.indexOf('html[data-theme="dark"]'), green.indexOf('html[data-theme="dark"]') + 1800),
  /--mj-ink:\s*#fff/i,
  "لا تبييض mj-ink في كتلة الأسطح",
);

console.log("dark-mode-heading-contrast-gate.test.ts: ok");
