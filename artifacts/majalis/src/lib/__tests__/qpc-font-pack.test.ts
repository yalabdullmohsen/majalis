/**
 * اختبار خطة خطوط QPC — نافذة الذاكرة والتنزيل.
 * تشغيل: node --import tsx src/lib/__tests__/qpc-font-pack.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  estimateWindowBytes,
  pagesInWindow,
  QPC_FONT_MEMORY_WINDOW,
  QPC_FONT_PREFETCH_RADIUS,
  QPC_PAGE_COUNT,
  qpcFontPath,
} from "@/lib/qpc-font-pack";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const fontsDir = resolve(root, "public/fonts/qpc-v2");

assert.equal(QPC_PAGE_COUNT, 604);
assert.equal(QPC_FONT_MEMORY_WINDOW, 5);
assert.equal(QPC_FONT_PREFETCH_RADIUS, 2);

{
  const w = pagesInWindow(1, 2);
  assert.deepEqual(w, [1, 2, 3]);
  const mid = pagesInWindow(50, 2);
  assert.deepEqual(mid, [48, 49, 50, 51, 52]);
  assert.ok(mid.length <= QPC_FONT_MEMORY_WINDOW);
  const end = pagesInWindow(604, 2);
  assert.deepEqual(end, [602, 603, 604]);
}

assert.match(qpcFontPath(12), /p12\.woff2$/);
assert.ok(estimateWindowBytes(5) < 8 * 1024 * 1024, "نافذة ٥ مضغوطة ≪ ٨MB");

const files = readdirSync(fontsDir).filter((f) => f.endsWith(".woff2"));
assert.equal(files.length, 604, "٦٠٤ ملف WOFF2");
let total = 0;
for (const f of files) total += statSync(resolve(fontsDir, f)).size;
assert.ok(total > 80 * 1024 * 1024, "الحجم الكلي الحالي ~٩٣MB قبل الاستبعاد من الحزمة الأصلية");
assert.ok(existsSync(resolve(fontsDir, "p1.woff2")));
/* تحقق أن الملف WOFF2 وليس TTF */
const magic = readFileSync(resolve(fontsDir, "p1.woff2")).subarray(0, 4);
assert.equal(magic.toString("ascii"), "wOF2");

const hook = readFileSync(resolve(root, "src/hooks/useMushafPageFont.ts"), "utf8");
assert.match(hook, /QPC_FONT_MEMORY_WINDOW/);
assert.match(hook, /QPC_FONT_PREFETCH_RADIUS/);
assert.match(hook, /pruneOutsideWindow/);
assert.match(hook, /unloadFontFace/);
assert.match(hook, /resolveQpcFontFaceSource/);
assert.match(hook, /revokeQpcFontBlob/);

const packSrc = readFileSync(resolve(root, "src/lib/qpc-font-pack.ts"), "utf8");
assert.match(packSrc, /qpcFontRemoteUrl/);
assert.match(packSrc, /probeLocalQpcFonts/);
assert.match(packSrc, /revokeQpcFontBlob/);

const fontReady = readFileSync(resolve(root, "src/lib/font-ready.ts"), "utf8");
assert.match(fontReady, /export function unloadFontFace/);

const strip = readFileSync(resolve(root, "scripts/native-strip-qpc-fonts.mjs"), "utf8");
assert.match(strip, /ios\/App\/App\/public\/fonts\/qpc-v2/);
assert.match(strip, /android\/app\/src\/main\/assets\/public\/fonts\/qpc-v2/);

const view = readFileSync(resolve(root, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
assert.match(view, /QpcFontPackBanner/);

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
assert.match(pkg.scripts["mobile:sync"], /native:strip-qpc-fonts/);

console.log("qpc-font-pack.test.ts: ok", {
  files: files.length,
  totalMiB: Math.round((total / 1024 / 1024) * 100) / 100,
  windowEstMiB: Math.round((estimateWindowBytes(5) / 1024 / 1024) * 100) / 100,
});
