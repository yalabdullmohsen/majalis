/**
 * بوابة: صقل الوضع الليلي الفاخر — سُنّة
 * تشغيل: node --import tsx src/lib/__tests__/premium-dark-theme-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

function assertAA(label: string, fg: string, bg: string, min = 4.5) {
  const ratio = contrast(fg, bg);
  assert.ok(ratio >= min, `${label}: ${fg} على ${bg} = ${ratio.toFixed(2)} (يلزم ≥${min})`);
  console.log(`  ✓ ${label}: ${ratio.toFixed(2)}:1`);
}

assert.equal(
  existsSync(resolve(root, "src/styles/premium-dark-refine.css")),
  true,
  "ملف صقل الليلي الفاخر موجود",
);

const refine = read("src/styles/premium-dark-refine.css");
assert.match(refine, /--pd-bg-1:/, "توكن خلفية مستوى 1");
assert.match(refine, /--pd-bg-2:/, "توكن خلفية مستوى 2");
assert.match(refine, /--pd-card:\s*#24302b/, "بطاقة = سطح مرتفع مقفل");
assert.match(refine, /--pd-elevated:/, "توكن سطح مرتفع تفاعلي");
assert.match(refine, /--pd-emerald:/, "زمرد أساسي");
assert.match(refine, /--pd-gold:/, "ذهب ناعم");
assert.match(refine, /--pd-ink:/, "حبر دافئ");
assert.match(refine, /--mj-brand-deep-ink:/, "حبر brand-deep مقروء");
assert.match(refine, /--mj-brand-deep:\s*var\(--elite-forest/, "brand-deep ليلي = غابة مقروءة لا #0E1C17");
assert.match(refine, /\[class\$="__glow"\]/, "قمع الوهج الزخرفي");
assert.match(refine, /--pd-elev-1:/, "ارتفاع سطح L1");
assert.match(refine, /--pd-elev-2:/, "ارتفاع مميز L2");
assert.match(refine, /--pd-elev-3:/, "ارتفاع مودال L3");
assert.doesNotMatch(refine, /-1[4-9]px/, "بلا انتشار سالب يقطع ظلًا مستطيلًا");
assert.match(refine, /\.app-back-btn--bar/, "صقل زر الرجوع");
assert.match(refine, /\.bottom-nav__tab\.is-active/, "حالة نشطة للشريط السفلي");
assert.match(refine, /\.quran-hub-hero/, "صقل قرآن");
assert.match(refine, /\.lesson-card/, "صقل بطاقات الدروس");
assert.doesNotMatch(refine, /filter:\s*invert/, "بلا invert");

const theme = read("src/app/styles/theme.css");
assert.match(theme, /--surface-elevated:\s*#24302[Bb]/, "سطح مرتفع مقفل");
assert.match(theme, /--mj-ink:\s*#EDE8DF/, "حبر ليلي دافئ");
assert.match(theme, /--surface-app:\s*#0F1613/, "غابة عميقة");
assert.match(theme, /--mj-accent:\s*#C9A86C/, "ذهب ناعم");

const recovery = read("src/styles/dark-mode-recovery.css");
assert.match(recovery, /--dm-bg:\s*#0f1613/, "خلفية استرداد عميقة");
assert.match(recovery, /--dm-text-primary:\s*#ede8df/, "نص استرداد دافئ");
assert.match(recovery, /--dm-accent-gold:\s*#c9a86c/, "ذهب استرداد");
assert.match(recovery, /--dm-bottom-nav:\s*#0c1210/, "شريط سفلي أغمق متكامل");
assert.match(
  recovery,
  /0 1px 2px rgba\(0, 0, 0, 0\.16\),\s*0 4px 14px rgba\(0, 0, 0, 0\.18\)/,
  "ظل بطاقة سفلي ناعم",
);

const ds = read("src/styles/dark-design-system.css");
assert.match(ds, /--text-primary:\s*#ede8df/);
assert.match(
  ds,
  /box-shadow:\s*0 1px 2px rgba\(0, 0, 0, 0\.16\),\s*0 4px 14px rgba\(0, 0, 0, 0\.18\)/,
);
assert.match(ds, /background-image:\s*none\s*!important/, "هيرو بلا وهج شعاعي");

const main = read("src/main.tsx");
assert.match(main, /premium-dark-refine\.css/, "الصقل محمّل من main");

const provider = read("src/components/ThemePreferenceProvider.tsx");
assert.match(provider, /premium-dark-refine\.css/, "الصقل محمّل عند التبديل لليلي");

const docs = read("docs/PREMIUM_DARK_THEME.md");
assert.match(docs, /Before \/ After/, "قائمة مقارنة لقطات");
assert.match(docs, /WCAG/, "توثيق تباين");

console.log("\n=== تباين لوحة Premium Dark (AA) ===");
assertAA("حبر دافئ على غابة", "#EDE8DF", "#0F1613");
assertAA("حبر دافئ على سطح", "#EDE8DF", "#1B2421");
assertAA("حبر دافئ على بطاقة", "#EDE8DF", "#24302B");
assertAA("ثانوي على سطح", "#D8D0C4", "#1B2421");
assertAA("مكتوم على سطح", "#B5ADA0", "#1B2421");
assertAA("ذهب على شريط سفلي", "#C9A86C", "#0C1210");
assertAA("زمرد رابط على سطح", "#8FD4B0", "#1B2421");
assertAA("حبر على زمرد", "#06231A", "#4FB48B");
assertAA("قرآن حبر على لوحة", "#EBE4D8", "#15201C");
assertAA("غابة على بطاقة", "#8FD4B0", "#24302B");
assertAA("حبر brand-deep على بطاقة", "#EDE8DF", "#24302B");
assert.match(refine, /--pd-success:/, "توكن نجاح");
assert.match(refine, /--pd-warning:/, "توكن تحذير");
assert.match(refine, /--pd-surface-elevated:/, "سطح مرتفع موحّد");
assert.match(refine, /\.hus-field:focus-within/, "تركيز بحث أوضح");
assert.match(refine, /pts-countdown|pts-next/, "صقل عدّاد الصلاة");

console.log("premium-dark-theme-gate.test.ts: ok");
