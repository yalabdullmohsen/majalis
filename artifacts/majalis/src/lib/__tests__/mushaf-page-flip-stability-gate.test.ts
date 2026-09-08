/**
 * بوابة ثبات قلب الصفحة — لا خلط خط/بيانات، لا توسيط عمودي يقفز، جاهزية قبل العرض.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-flip-stability-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const page = read("src/features/mushaf-reader/MushafPage.tsx");
const qpc = read("src/features/mushaf-madinah/useQpcPageFont.ts");
const pager = read("src/features/mushaf-reader/useMushafPager.ts");
const miniBar = read("src/components/quran/QuranMiniPlayerBar.tsx");

assert.match(qpc, /export function ensureQpcPageFont/);
assert.match(qpc, /loaded\.has\(pageNumber\)/);
assert.match(qpc, /useLayoutEffect/);
assert.doesNotMatch(qpc, /setReady\(loaded\.has/);

assert.match(reader, /ensureQpcPageFont\(clamped\)/);
assert.match(reader, /layout\.pageNumber === page/);
assert.match(reader, /getCachedMushafPage\(page\)/);
assert.match(reader, /shell\.scrollTop = 0/);
assert.match(reader, /ارتفاع الحاوية ثابت/);
assert.match(reader, /dockRemainsAfterClear/);
assert.match(reader, /useMushafFixedMetrics\(metricsRootRef,\s*true\)/);
assert.match(miniBar, /if \(immersive\) return null/);

assert.match(css, /\.nm-slot\s*\{[^}]*align-items:\s*flex-start/s);
assert.match(css, /height:\s*var\(--mushaf-body-height/);
assert.match(css, /contain:\s*layout style/);
assert.match(page, /منع layout shift عند قلب الصفحة/);

assert.match(pager, /translate3d/);
assert.doesNotMatch(pager, /marginTop|paddingTop|scrollTop\s*=/);

console.log("mushaf-page-flip-stability-gate.test.ts: ok");
