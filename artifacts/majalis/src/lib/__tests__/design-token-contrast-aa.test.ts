/**
 * بوابة وحدات: أزواج التوكنز الأساسية تحقق WCAG AA.
 * لا يعتمد على Playwright — يمنع رجوع رمادي فاتح أو أخضر باهت.
 *
 * تشغيل: node --import tsx src/lib/__tests__/design-token-contrast-aa.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

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

function assertAA(label: string, fg: string, bg: string, min = 4.5) {
  const ratio = contrast(fg, bg);
  assert.ok(ratio >= min, `${label}: ${fg} على ${bg} = ${ratio.toFixed(2)} (يلزم ≥${min})`);
  console.log(`  ✓ ${label}: ${ratio.toFixed(2)}:1`);
}

const tokens = readFileSync(resolve(root, "src/styles/design-tokens.css"), "utf8");
const theme = readFileSync(resolve(root, "src/app/styles/theme.css"), "utf8");
const gate = readFileSync(resolve(root, "scripts/verify-color-contrast-gate.mjs"), "utf8");
const homeBrand = readFileSync(resolve(root, "src/styles/components/home-brand-title.css"), "utf8");
const nav = readFileSync(resolve(root, "src/styles/m2030/navigation.css"), "utf8");
const sheet = readFileSync(resolve(root, "src/styles/components/app-bottom-sheet.css"), "utf8");

console.log("\n=== توكنز التباين AA ===");

assert.match(tokens, /--color-bg:/, "عقد --color-bg");
assert.match(tokens, /--color-surface:/, "عقد --color-surface");
assert.match(tokens, /--color-surface-muted:/, "عقد --color-surface-muted");
assert.match(tokens, /--color-text:/, "عقد --color-text");
assert.match(tokens, /--color-text-muted:/, "عقد --color-text-muted");
assert.match(tokens, /--color-primary:/, "عقد --color-primary");
assert.match(tokens, /--color-primary-contrast:/, "عقد --color-primary-contrast");
assert.match(tokens, /--color-border:/, "عقد --color-border");
assert.match(tokens, /--brand-on-light:/, "أخضر للنص على فاتح");

assert.match(theme, /--mj-brand:\s*#1F7A5A/, "أخضر العلامة النهاري");
assert.match(theme, /--mj-on-brand:\s*#FFFFFF/, "نص أبيض فوق الأخضر");
assert.match(theme, /--brand-on-white:\s*#146C4E/, "أخضر غامق على أبيض");
assert.match(theme, /--mj-muted:\s*#5E6E67/, "رمادي مكتوم نهاري");
assert.match(theme, /--mj-ink:\s*#16241E/, "حبر نهاري");

assertAA("نص على خلفية عاجية", "#16241E", "#F2F4F3");
assertAA("نص مكتوم على خلفية", "#5E6E67", "#F2F4F3");
assertAA("أبيض على primary", "#FFFFFF", "#1F7A5A");
assertAA("brand-on-light على أبيض", "#146C4E", "#FFFFFF");
assertAA("brand-on-light على عاجي", "#146C4E", "#F2F4F3");

assertAA("نص ليلي على سطح", "#F8FAFC", "#1B2421");
assertAA("مكتوم ليلي على سطح", "#C5D0CB", "#1B2421");
assertAA("حبر داكن على نعناعي ليلي", "#06231A", "#4FB48B");

assert.match(gate, /\.home-page-hero \.m2030-btn--ghost/, "نفحص زر الهيرو الشبح فوق الطية");
assert.doesNotMatch(gate, /selector:\s*"\.m2030-customize"/, "ممنوع تأكيد customize الكسول كـ NOT_FOUND");
assert.match(gate, /bottom-nav__tab\.is-active/, "فحص شريط سفلي نشط");
assert.match(gate, /contrastAudit|data-contrast-audit/, "وضع تدقيق بدون حركات");
assert.match(homeBrand, /data-contrast-audit/, "CSS يكشف أزرار الهيرو أثناء التدقيق");
assert.match(nav, /brand-on-light/, "شريط سفلي نشط يستخدم أخضر AA");
assert.match(sheet, /color-primary-contrast|mj-on-brand/, "أزرار التحديث من التوكنز");

console.log("design-token-contrast-aa: ok");
