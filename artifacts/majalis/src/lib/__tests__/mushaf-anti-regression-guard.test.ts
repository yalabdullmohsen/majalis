/**
 * حماية ضد رجوع مشكلة تكبير/تصغير المصحف.
 * تفشل إن وُجد scale / zoom / transition على font-size|line-height|width|height
 * أو قياس متأخر يغيّر الحجم بعد الرسم (setTimeout → font-size / fit).
 *
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-anti-regression-guard.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const SCAN_DIRS = [
  "src/features/mushaf-reader",
  "src/features/mushaf-madinah",
] as const;

const EXT = new Set([".css", ".tsx", ".ts"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__" || name.endsWith(".test.ts") || name.endsWith(".test.tsx")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.has(name.slice(name.lastIndexOf(".")))) out.push(p);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(resolve(root, d)));
assert.ok(files.length > 20, `ملفات المصحف للفحص: ${files.length}`);

const FORBIDDEN: Array<{ re: RegExp; why: string; allowIn?: RegExp }> = [
  {
    re: /transform\s*:\s*[^;]*\bscale\s*\(/i,
    why: "transform:scale على نص/حاوية المصحف ممنوع",
    allowIn: /Pressable|native-feel|soft-card|mm-audio-dock|mm-page-edge|quran-sheet|ayah-action/,
  },
  {
    re: /\bzoom\s*:/i,
    why: "zoom ممنوع على المصحف",
  },
  {
    re: /transition\s*:[^;]*(font-size|line-height)/i,
    why: "transition على font-size أو line-height يسبب تكبير/تصغير مزعج",
  },
  {
    re: /transition\s*:[^;]*\b(width|height)\b/i,
    why: "transition على width/height لحاوية المصحف ممنوع",
    allowIn: /mm-audio-dock|quran-sheet|ayah-action|nm-controls|bottom-nav/,
  },
  {
    re: /setTimeout\s*\(\s*(?:async\s*)?\(?[^)]*\)?\s*=>\s*\{[^}]*(font-size|fitPage|mm-qpc-size|mushaf-font-size|--mm-qpc)/is,
    why: "قياس متأخر عبر setTimeout يغيّر حجم الصفحة بعد الرسم",
  },
];

const failures: string[] = [];

for (const file of files) {
  const rel = relative(root, file);
  const src = readFileSync(file, "utf8");
  for (const rule of FORBIDDEN) {
    if (rule.allowIn && rule.allowIn.test(rel)) continue;
    /* استثناء: انتقالات الشفافية/الترجمة فقط في pager */
    if (rule.why.includes("width/height") && /pager|nm-pager|mm-pager/.test(rel)) continue;
    const m = src.match(rule.re);
    if (m) {
      failures.push(`${rel}: ${rule.why} → «${m[0].slice(0, 80)}»`);
    }
  }
}

assert.equal(
  failures.length,
  0,
  `حماية المصحف فشلت:\n${failures.map((f) => ` - ${f}`).join("\n")}`,
);

/* رموز القياس الإلزامية — مصدر واحد */
const metrics = readFileSync(resolve(root, "src/features/mushaf-reader/useStableMushafLayout.ts"), "utf8");
for (const token of [
  "--mushaf-page-width",
  "--mushaf-font-size",
  "--mushaf-line-height",
  "--mushaf-bottom-safe-space",
]) {
  assert.match(metrics, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `رمز ${token}`);
}

assert.match(metrics, /export function useStableMushafLayout/);
assert.match(metrics, /data-pager-settled/);
assert.match(metrics, /lockedWidthRef|WIDTH_LOCK/);
assert.match(metrics, /data-mushaf-font-locked/);
assert.doesNotMatch(metrics, /setTimeout/);
assert.match(
  readFileSync(resolve(root, "src/features/mushaf-reader/useMushafFixedMetrics.ts"), "utf8"),
  /useStableMushafLayout/,
);

const fitHook = readFileSync(resolve(root, "src/features/mushaf-madinah/useMushafPageFontFit.ts"), "utf8");
assert.match(fitHook, /data-mushaf-font-locked/);
assert.match(fitHook, /stable-inherit/);

const pager = readFileSync(resolve(root, "src/features/mushaf-reader/useMushafPager.ts"), "utf8");
assert.match(pager, /SETTLE_MS = 160/);
assert.match(pager, /prefers-reduced-motion|prefersReducedMotion/);
assert.doesNotMatch(pager, /bounce|spring/i);

const reader = readFileSync(resolve(root, "src/features/mushaf-reader/NewMushafReader.tsx"), "utf8");
assert.match(reader, /useStableMushafLayout/);
assert.match(reader, /stableView/);
assert.match(reader, /PrefetchPage/);
assert.match(reader, /nm-page-placeholder--frame/);
assert.doesNotMatch(
  reader,
  /const go = useCallback\(\s*\(next: number\) => \{[^}]*recitation\.stop\(\)/s,
  "قلب الصفحة لا يوقف التلاوة",
);

const tafsir = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafTafsirSheet.tsx"), "utf8");
assert.match(tafsir, /brief|مختصر/);
assert.match(tafsir, /full|مطول/);
assert.match(tafsir, /لم يتوفر تفسير لهذه الآية حاليًا/);
assert.match(tafsir, /saveMushafTafsirEdition|DEPTH_PREF_KEY/);

const sheetCss = readFileSync(
  resolve(root, "src/features/mushaf-madinah/quran-sheet/quran-sheet.css"),
  "utf8",
);
assert.match(sheetCss, /68dvh/);

console.log(`mushaf-anti-regression-guard.test.ts: ok (${files.length} files)`);
