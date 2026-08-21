/**
 * بوابة: CSS الإقلاع غير حاجب + حجز CLS مضمّن ≤14KiB.
 * تشغيل: node --import tsx src/lib/__tests__/defer-entry-css-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  INLINE_CSS_BUDGET,
  applyEntryCssDefer,
  deferStylesheets,
  hasBlockingStylesheet,
  inlineStyleBytes,
  readCriticalCss,
} from "../../../scripts/defer-entry-css.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const vite = readFileSync(resolve(root, "vite.config.ts"), "utf8");
const htmlSrc = readFileSync(resolve(root, "index.html"), "utf8");
const pkg = readFileSync(resolve(root, "package.json"), "utf8");

assert.match(vite, /deferEntryCssPlugin/, "إضافة Vite تؤجّل CSS الإقلاع");
assert.match(pkg, /"test:defer-entry-css"/, "أمر البوابة موجود");
assert.match(
  (htmlSrc.split(/<head[^>]*>/i)[1] ?? "").trimStart(),
  /^<meta charset="UTF-8"\s*\/?>/i,
  "charset أول عنصر في head",
);

const critical = readCriticalCss();
assert.match(critical, /--ticker-h/, "حجز الشريط من الرمز");
assert.match(critical, /--content-pb/, "حجز padding-block-end للمحتوى");
assert.match(critical, /#main-content\.app-main/, "حجز كروم main قبل CSS المؤجّل");
assert.match(critical, /\.bottom-nav/, "حجز شريط التنقّل السفلي ثابت");
assert.match(critical, /mj-home-lcp-ph__start-here/, "حجز ابدأ من هنا");
assert.ok(
  Buffer.byteLength(critical, "utf8") <= INLINE_CSS_BUDGET,
  `CSS الحجز ${Buffer.byteLength(critical, "utf8")} > ${INLINE_CSS_BUDGET}`,
);

const sample = `<!DOCTYPE html><html><head>
<link rel="stylesheet" crossorigin href="/assets/index-abc.css">
<link rel="modulepreload" href="/assets/vendor.js">
<link rel="preload" href="/fonts/ui/amiri-400-ar.woff2" as="font">
<script type="module" src="/assets/index.js"></script>
</head><body></body></html>`;
const out = applyEntryCssDefer(sample);
assert.match(out, /id="mj-cls-reserve"/, "يُحقن حجز CLS");
assert.match(out, /media="print"/, "stylesheet بـ print");
assert.match(out, /onload="this\.onload=null;this\.media='all'"/, "onload يعيد media=all");
assert.match(out, /<noscript><link rel="stylesheet"/, "noscript للزحف بلا JS");
assert.equal(hasBlockingStylesheet(out), false, "لا stylesheet حاجب بعد التحويل");
assert.doesNotMatch(out, /rel="modulepreload"[^>]*media="print"/, "modulepreload لا يُؤجَّل");
assert.ok(inlineStyleBytes(out) <= INLINE_CSS_BUDGET, "المضمّن ≤14KiB");

const already = deferStylesheets(
  `<link rel="stylesheet" href="/a.css" media="print" onload="this.media='all'">`,
);
assert.equal(
  already.match(/media="print"/g)?.length,
  1,
  "لا يُضاعف التحويل على رابط مؤجَّل",
);

const head = htmlSrc.split("</head>")[0];
for (const m of head.matchAll(/<script\b([^>]*)>/gi)) {
  const attrs = m[1];
  const type = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1] || "";
  assert.ok(
    type === "application/ld+json" || type === "module" || /\basync\b|\bdefer\b/i.test(attrs),
    `سكربت حاجب في <head>: ${attrs.trim() || "(بدون صفات)"}`,
  );
}

const distHtml = resolve(root, "dist/index.html");
if (existsSync(distHtml)) {
  const built = readFileSync(distHtml, "utf8");
  if (!built.includes('id="mj-cls-reserve"')) {
    console.log("defer-entry-css-gate.test.ts: dist قديم — فحص HTML بعد البناء عبر test-critical-css-budget");
  } else {
    assert.equal(hasBlockingStylesheet(built), false, "dist/index.html بلا CSS حاجب");
    assert.ok(inlineStyleBytes(built) <= INLINE_CSS_BUDGET, "style المضمّن في dist ≤14KiB");
    const href = built.match(/href="(\/assets\/index-[^"]+\.css)"/)?.[1];
    if (href) {
      const cssPath = resolve(root, "dist", href.slice(1));
      if (existsSync(cssPath)) {
        assert.doesNotMatch(
          readFileSync(cssPath, "utf8"),
          /@import/,
          "صفر @import في CSS المُسلَّم",
        );
      }
    }
  }
}

console.log("defer-entry-css-gate.test.ts: ok");
