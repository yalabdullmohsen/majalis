/**
 * شريط أدوات المصحف (نمط آية): أربعة أزرار ظاهرة + ⋯، بلا التفاف نص،
 * وعائم تحت رأس الجزء/الحزب.
 * تشغيل: npx tsx src/lib/__tests__/mushaf-toolbar-layout.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const viewSrc = readFileSync(resolve(appRoot, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
const quranCss = readFileSync(resolve(appRoot, "src/styles/quran.css"), "utf8");

const toolbarBlock = viewSrc.match(
  /className=\{`mpv-toolbar mpv-toolbar--ayah[\s\S]*?<\/div>\s*\{bookmarkStatus/,
);
assert.ok(toolbarBlock, "كتلة شريط الأدوات موجودة في MushafPageView");

const primaryAria = [
  'aria-label="رجوع"',
  'aria-label="فهرس السور"',
  'aria-label="التسميع"',
  'aria-label="إعدادات القراءة"',
  'aria-label="المزيد من الأدوات"',
];
for (const a of primaryAria) {
  assert.match(toolbarBlock[0], new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(toolbarBlock[0], /MoreHorizontal/);
assert.match(toolbarBlock[0], /mpv-toolbar__menu/);
assert.match(toolbarBlock[0], /أقسام/);
assert.match(toolbarBlock[0], /السابقة/);
assert.match(toolbarBlock[0], /التالية/);

/** الأزرار المباشرة في الشريط (خارج القائمة) — رجوع/فهرس/تسميع/إعدادات + ⋯ */
const directBtns = toolbarBlock[0].match(/mpv-toolbar__btn/g) ?? [];
assert.ok(directBtns.length >= 5, `خمسة أزرار ظاهرة على الأقل (4 + ⋯)، وُجد ${directBtns.length}`);
assert.ok(
  !toolbarBlock[0].includes("mpv-toolbar__menu-item") ||
    (toolbarBlock[0].match(/mpv-toolbar__menu-item/g)?.length ?? 0) >= 3,
  "القائمة الإضافية تحتوي عناصر خلف ⋯",
);

assert.match(quranCss, /\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[\s\S]*?position:\s*absolute/);
assert.match(quranCss, /\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[\s\S]*?flex-wrap:\s*nowrap/);
assert.match(quranCss, /\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[\s\S]*?max-width:\s*calc\(100%/);
assert.match(quranCss, /\.mpv-toolbar--ayah\s+\.mpv-toolbar__btn\s*\{[\s\S]*?white-space:\s*nowrap/);
assert.match(quranCss, /\.mpv-toolbar--ayah\s+\.mpv-toolbar__label\s*\{[\s\S]*?white-space:\s*nowrap/);
assert.match(quranCss, /@media\s*\(max-width:\s*480px\)/);
assert.match(quranCss, /\.mpv-ayah-header\s*\{[\s\S]*?z-index:\s*32/);
assert.match(
  quranCss,
  /\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[\s\S]*?top:\s*calc\(var\(--inset-top\)\s*\+\s*2\.75rem\)/,
);

console.log("mushaf-toolbar-layout.test.ts: ok");
