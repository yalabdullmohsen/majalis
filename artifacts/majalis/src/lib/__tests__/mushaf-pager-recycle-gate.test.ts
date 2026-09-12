/**
 * بوابة: إعادة تدوير ألواح التقليب (key=pageNumber) تمنع remount/reflow عند الالتزام.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-pager-recycle-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pager = read("src/features/mushaf-reader/MushafPager.tsx");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const metrics = read("src/features/mushaf-reader/useStableMushafLayout.ts");
const cache = read("src/features/mushaf-reader/mushaf-page-render-cache.ts");
const font = read("src/features/mushaf-madinah/useQpcPageFont.ts");
const css = read("src/features/mushaf-reader/mushaf-reader.css");

assert.match(pager, /key=\{pageNumber\}/, "لوحات التقليب تُفتاح برقم الصفحة");
assert.match(pager, /data-pager-recycle/, "علامة إعادة التدوير");
assert.match(pager, /renderPage/, "واجهة renderPage للإنتاج");
assert.doesNotMatch(pager, /transform:\s*scale\(/);

assert.match(reader, /renderPage=\{/, "القارئ الإنتاجي يستخدم renderPage");
assert.match(reader, /PrefetchPage/, "PrefetchPage موحّد لكل الألواح");
assert.match(reader, /selectionEnabled=\{pagerSettled/, "لا تحديد أثناء القلب");
assert.doesNotMatch(reader, /pageSlot=\{/, "لا pageSlot منفصل يعيد mount الصفحة");
assert.doesNotMatch(reader, /key=\{page\}/);
assert.doesNotMatch(reader, /key=\{pageNumber\}/);

assert.match(metrics, /data-pager-settled/);
assert.match(metrics, /lockedSizeRef|lockedWidthRef|WIDTH_LOCK/);
assert.match(cache, /geometryKey/);
assert.match(font, /display:\s*["']block["']/);
assert.match(font, /ensureQpcPageFont|loaded\.has/);

/* مفتاح الهندسة لا يعتمد على رقم الصفحة */
const geoEffect = reader.match(
  /setMushafGeometryKey\([\s\S]{0,200}?\}, \[([^\]]*)\]/,
);
assert.ok(geoEffect, "يوجد أثر setMushafGeometryKey");
assert.doesNotMatch(geoEffect[1], /\bpage\b/, "deps لـ geometry لا تتضمن page");
assert.match(reader, /لا يُربط برقم الصفحة/);

assert.match(css, /\.nm-pager-scroller/);
assert.match(css, /--nm-pager-w/);
assert.doesNotMatch(css, /\.nm-page-text[^{]*\{[^}]*transition:\s*[^;]*(font-size|line-height)/s);

assert.match(reader, /neighborsReady/, "لا سحب قبل جاهزية الجيران");
assert.match(reader, /loadMushafPage\(page \+ 1\)/);
assert.match(reader, /isQpcPageFontReady\(page \+ 1\)/);

console.log("mushaf-pager-recycle-gate.test.ts: ok");
