/**
 * بوابة صفر فيض أفقي — نطاقها الفعلي: اتّساق CSS الثابت (regex على مصدر
 * mushaf-madinah.css) + خوارزمية fitPageFontSize مقابل نفسها عبر measure()
 * تركيبية، بلا DOM أو متصفح حقيقي. تثبت أن الخوارزمية "لا تناقض نفسها"،
 * ولا تثبت أن المتصفح يرسم داخل الحدود فعلاً — لو أضاعت خانة grid الضمنية
 * قيدها (مثال حي: .mm-page__body بلا grid-template-columns، أُصلح في
 * feat/mushaf-round-2)، فهذه البوابة لا ترى شيئًا لأنها لا تفحص القيمة
 * المحسوبة لأي خاصية grid أصلاً — 604 صفحة اجتازتها هنا رغم اقتطاع حقيقي
 * في الإنتاج على الأقل على ص٦٠١.
 *
 * المرجع الحقيقي لـ«صفر سطر مقتطع» الآن: scripts/mushaf-madinah/line-integrity-gate.mjs
 * (`pnpm run test:mushaf-line-integrity`) — Chromium حقيقي، getBoundingClientRect
 * لكل كلمة مقابل والدها الفعلي، مطابقة نصية كاملة مع بيانات المصدر. هذه
 * البوابة تبقى مفيدة لفحوصها الأخرى (بنية CSS، حدود fitPageFontSize، اكتمال
 * بيانات الصفحات) — لا تعتمد عليها وحدها لادّعاء "صفر فيض".
 *
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-line-overflow-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fitPageFontSize, MUSHAF_FIT_LINE_RATIO, MUSHAF_FIT_MAX_PX } from "../../features/mushaf-madinah/fitPageFontSize";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pagesDir = resolve(root, "public/data/quran-v2/pages");
const css = readFileSync(resolve(root, "src/features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const lineSrc = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafAyahLine.tsx"), "utf8");
const fitSrc = readFileSync(resolve(root, "src/features/mushaf-madinah/useMushafPageFontFit.ts"), "utf8");
const fitFn = readFileSync(resolve(root, "src/features/mushaf-madinah/fitPageFontSize.ts"), "utf8");
const pageSrc = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafPage.tsx"), "utf8");

const VIEWPORTS = [320, 390, 430] as const;
/** هامش الحبر من المواصفة: ١٫٥٪ … ٩٨٫٤٪ */
const INK_RATIO = 0.984 - 0.015;

const ayahBlock = css.match(/\.mm-ayah-line\s*\{[^}]+\}/)?.[0] ?? "";
assert.ok(ayahBlock, ".mm-ayah-line");
assert.match(ayahBlock, /display:\s*flex/);
assert.match(ayahBlock, /justify-content:\s*center/);
assert.match(css, /\.mm-ayah-line\[data-fill="true"\][^}]*justify-content:\s*space-between/);
assert.match(ayahBlock, /overflow-x:\s*(hidden|clip)/);
assert.doesNotMatch(ayahBlock, /overflow-x:\s*visible/);
assert.doesNotMatch(ayahBlock, /overflow:\s*visible/);

assert.match(css, /data-centered="true"[^}]*justify-content:\s*center|data-fill="false"[^}]*justify-content:\s*center/);
assert.match(css, /\.mm-viewport\s+\.mm-page\s*\{[^}]*overflow-x:\s*(hidden|clip)/);
assert.match(css, /contain:\s*layout\s+paint/);

assert.match(lineSrc, /data-type=\{(w|word)\.charType\}/);
assert.match(lineSrc, /data-centered=\{centered \? "true" : "false"\}/);
assert.match(pageSrc, /isLastSurahLine/);
assert.match(fitFn, /createElement\("canvas"\)/);
assert.match(fitSrc, /resolveUniformMushafFontSize|fitMushafPageFont/);
assert.match(fitSrc, /ResizeObserver/);
assert.doesNotMatch(fitSrc, /wordSpacing/);

type RawWord = { line_number: number; code_v2?: string };
type RawVerse = { words: RawWord[] };

function measure(fontPx: number, text: string): number {
  return text.length * fontPx * 0.62;
}

assert.equal(fitPageFontSize([], 300, "qpc", measure), 12);
assert.equal(fitPageFontSize(["ا"], 300, "qpc", measure), 34);
assert.ok(fitPageFontSize(["أ".repeat(80)], 200, "qpc", measure) < 34);

{
  const tall = fitPageFontSize(["ا"], 400, "qpc", measure, { blockHeightPx: 525, lineCount: 15 });
  assert.ok(tall <= Math.floor(525 / 15 / 1.85), `قيد الارتفاع: ${tall}`);
  assert.ok(tall >= 12 && tall <= 34, `داخل الحدود: ${tall}`);
}

assert.match(fitFn, /mushaf-fitPageFontSize-v2/);
assert.match(fitFn, /MUSHAF_FIT_MAX_PX = 34/);
assert.match(fitFn, /MUSHAF_FIT_LINE_RATIO = 1.85/);
assert.match(fitFn, /assertMushafPageFontReady/);
assert.match(fitFn, /normalizeMushafFontFamily/);
assert.match(fitSrc, /document\.fonts\.(check|load)/);
assert.match(fitSrc, /loadingdone|orientationchange/);
assert.match(fitSrc, /resolveUniformMushafFontSize/);
assert.doesNotMatch(fitSrc, /opening \? 56/);

let pages = 0;
let checks = 0;

for (let n = 1; n <= 604; n++) {
  const file = resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `ناقصة: صفحة ${n}`);
  const raw = JSON.parse(readFileSync(file, "utf8")) as RawVerse[];
  const byLine = new Map<number, string[]>();
  for (const v of raw) {
    for (const w of v.words) {
      const glyph = w.code_v2 ?? "";
      if (!glyph) continue;
      const arr = byLine.get(w.line_number) ?? [];
      arr.push(glyph);
      byLine.set(w.line_number, arr);
    }
  }
  const lines = [...byLine.values()].map((glyphs) => glyphs.join(""));
  assert.ok(lines.length > 0, `صفحة ${n}: بلا أسطر`);
  const lineCount = n <= 2 ? lines.length : 15;
  const heightRatio = n <= 2 ? 0.748 - 0.277 : 0.911 - 0.119;

  for (const vw of VIEWPORTS) {
    const containerPx = Math.floor(vw * INK_RATIO);
    const blockHeightPx = Math.floor(844 * heightRatio);
    const size = fitPageFontSize(lines, containerPx, `qpc-v2-p${n}`, measure, {
      blockHeightPx,
      lineCount,
    });
    const widest = Math.max(...lines.map((l) => measure(size, l)));
    assert.ok(
      widest <= containerPx,
      `فيض أفقي صفحة ${n} @${vw}px: widest=${widest.toFixed(2)} container=${containerPx} size=${size}`,
    );
    assert.ok(size <= MUSHAF_FIT_MAX_PX, `سقف الحجم صفحة ${n}: ${size}`);
    assert.ok(
      size * MUSHAF_FIT_LINE_RATIO * lineCount <= blockHeightPx + 1,
      `فيض عمودي صفحة ${n}: size=${size} lines=${lineCount} block=${blockHeightPx}`,
    );
    checks += 1;
  }
  pages += 1;
}

assert.equal(pages, 604);
assert.equal(checks, 604 * 3);

console.log(
  `mushaf-line-overflow-gate.test.ts: ok pages=604 viewports=${VIEWPORTS.join("/")} checks=${checks}`,
);
