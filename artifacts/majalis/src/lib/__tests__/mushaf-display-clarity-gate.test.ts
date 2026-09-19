/**
 * بوابة صفاء العرض (Phase 18) — حدة النص ثابتة؛ will-change مقيّد بالحركة فقط.
 * القواعد في reader-page-chrome.css (بعد mushaf-reader.css) لتجنّب قفل سياسة mushaf*.css.
 * Run: node --import tsx src/lib/__tests__/mushaf-display-clarity-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const chrome = read("src/styles/reader-page-chrome.css");
const mushafCss = read("src/features/mushaf-reader/mushaf-reader.css");
const pager = read("src/features/mushaf-reader/useMushafPager.ts");
const page = read("src/features/mushaf-reader/MushafPage.tsx");
const layout = read("src/features/mushaf-reader/useStableMushafLayout.ts");
const preset = read("src/features/mushaf-reader/sunnah-mushaf-signature-preset.ts");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");

/* 0) ترتيب التحميل: chrome بعد mushaf-reader */
{
  const a = reader.indexOf('import "./mushaf-reader.css"');
  const b = reader.indexOf("reader-page-chrome.css");
  assert.ok(a >= 0 && b > a, "reader-page-chrome.css must load after mushaf-reader.css");
}

/* 1) لا Scale على النص/المسار */
assert.doesNotMatch(chrome, /transform:\s*scale\(/);
assert.doesNotMatch(pager, /scale\(/);
assert.match(preset, /pageScale:\s*1/);
assert.match(layout, /data-page-scale/);

/* 2) حدة QPC ثابتة عبر chrome override */
assert.match(chrome, /\.nm-page__body\s*\{[\s\S]*?text-rendering:\s*geometricPrecision/);
assert.match(chrome, /\.nm-page__body\s*\{[\s\S]*?-webkit-font-smoothing:\s*auto/);

/* 3) افتراضي will-change:auto على المسار في طبقة الصفاء */
assert.match(chrome, /\.nm-pager-track[\s\S]{0,80}?will-change:\s*auto/);

/* 4) ترقية فقط أثناء السحب / قبل الاستقرار */
assert.match(chrome, /\.nm-pager-scroller\.is-panning \.nm-pager-track/);
assert.match(chrome, /data-mushaf-panning="1"\] \.nm-pager-track/);
assert.match(chrome, /data-pager-settled="0"\] \.nm-pager-track/);
assert.ok(
  /\.nm-pager-scroller\.is-panning[\s\S]{0,800}will-change:\s*transform/.test(chrome),
  "panning block must promote will-change:transform",
);
assert.ok(
  /data-pager-settled="1"]:not\(\[data-mushaf-panning="1"\]\)[\s\S]{0,500}will-change:\s*auto/.test(
    chrome,
  ),
  "settled block must demote will-change:auto",
);

/* 5) يهزم will-change الدائم من ultra-smooth بعد الاستقرار */
assert.match(
  chrome,
  /data-ultra-smooth="1"\]\[data-pager-settled="1"]:not\(\[data-mushaf-panning="1"\]\)[\s\S]{0,200}?will-change:\s*auto/,
);

/* 6) ممنوع Filter/Blur على الصفحة */
assert.match(chrome, /data-mushaf-panning="1"\] \.nm-page[\s\S]{0,200}?filter:\s*none/);
assert.match(chrome, /data-pager-settled="1"\] \.nm-page[\s\S]{0,200}?backdrop-filter:\s*none/);

/* 7) قفل بكسل + snap */
assert.match(pager, /snapPx/);
assert.match(pager, /Math\.round\(w\)/);
assert.match(pager, /translate3d/);

/* 8) عقود مجمّدة من mushaf-reader (لا نعيد تصميمها هنا) */
assert.doesNotMatch(mushafCss, /is-panning[^}]*opacity:\s*0\.[0-9]/);
assert.match(page, /منع layout shift عند قلب الصفحة/);
assert.match(layout, /data-mushaf-font-locked/);
assert.match(mushafCss, /data-ultra-smooth/);

console.log("mushaf-display-clarity-gate.test.ts: ok");
