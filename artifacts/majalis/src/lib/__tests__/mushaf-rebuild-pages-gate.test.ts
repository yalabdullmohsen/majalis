/**
 * بوابة صفحات المصحف المعاد بناؤه — هيكل + إطار بلا قص.
 * صفحات: 1,2,3,8,50,57,100,300,604
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-rebuild-pages-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pagesDir = resolve(root, "public/data/quran-v2/pages");
const css = readFileSync(resolve(root, "src/features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const viewport = readFileSync(
  resolve(root, "src/features/mushaf-madinah/VerifiedMushafReader.tsx"),
  "utf8",
);
const pageComp = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafPage.tsx"), "utf8");

const PAGES = [1, 2, 3, 8, 50, 57, 100, 300, 604] as const;

for (const n of PAGES) {
  const file = resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `page-${n} موجود`);
  const font = resolve(root, `public/fonts/qpc-v2/p${n}.woff2`);
  assert.ok(existsSync(font), `خط الصفحة ${n}`);
  const raw = JSON.parse(readFileSync(file, "utf8")) as { pageNumber?: number; lines?: unknown[] };
  assert.equal(raw.pageNumber ?? n, n, `رقم الصفحة ${n}`);
  assert.ok(Array.isArray(raw.lines) ? raw.lines.length > 0 : true, `محتوى الصفحة ${n}`);
}

// قواعد الإطار — عرض كامل آمن بلا قص، بلا aspect-ratio 0.68
assert.doesNotMatch(css, /aspect-ratio:\s*0\.68/);
assert.match(css, /overflow-y:\s*hidden/);
assert.match(css, /overflow-x:\s*(hidden|clip)/);
assert.match(css, /margin-inline:\s*auto/);
assert.match(css, /100svh|100dvh/);
assert.match(css, /var\(--inset-top/);
assert.match(css, /var\(--inset-bottom/);
assert.match(css, /--mm-page-max-w:\s*min\(100%/);
assert.match(css, /\.mm-page-footer|MushafPageFooter/);
assert.match(pageComp, /MushafPageFooter|pageNumber/);
assert.match(pageComp, /useMushafPageFontFit/);
assert.match(viewport, /mushaf-page-frame|mm-page-shell/);
assert.match(viewport, /MushafControls/);
assert.doesNotMatch(viewport, /exitAlwaysVisible/);
assert.match(viewport, /MUSHAF_CHROME_HIDE_MS|3200/);
assert.doesNotMatch(viewport, /scrollIntoView/);
assert.doesNotMatch(
  css,
  /\.mm-viewport\[data-ayah-bar="1"\][^{]*\{[^}]*--mm-chrome-bottom-h:\s*var\(--mm-ayah-bar-h\)/,
);

console.log("mushaf-rebuild-pages-gate.test.ts: ok", PAGES.join(","));
