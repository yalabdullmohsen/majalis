/**
 * بوابة مصدر الحركة الواحد + رموز اللمس.
 * تشغيل: node --import tsx src/lib/__tests__/motion-single-source.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MOTION_DURATION_MS,
  MOTION_EASING,
  MOTION_ENTER_MS,
  MOTION_EXIT_MS,
  MOTION_NAV,
  MOTION_SHEET,
  MOTION_TOUCH,
  MOTION_CSS_VARS,
} from "@/design/motion";

assert.equal(MOTION_DURATION_MS.instant, 100);
assert.equal(MOTION_DURATION_MS.fast, 160);
assert.equal(MOTION_DURATION_MS.base, 220);
assert.equal(MOTION_DURATION_MS.slow, 320);
assert.equal(MOTION_DURATION_MS.page, 280);
assert.ok(MOTION_EASING.standard.includes("cubic-bezier"));
assert.ok(MOTION_EASING.spring.includes("cubic-bezier"));
assert.equal(MOTION_ENTER_MS, MOTION_DURATION_MS.base, "الدخول أبطأ");
assert.equal(MOTION_EXIT_MS, MOTION_DURATION_MS.fast, "الخروج أسرع");
assert.equal(MOTION_SHEET.dismissRatio, 0.3);
assert.equal(MOTION_SHEET.dismissVelocity, 0.5);
assert.equal(MOTION_SHEET.rubberBand, 0.55);
assert.equal(MOTION_NAV.edgeCompleteRatio, 0.35);
assert.equal(MOTION_TOUCH.minTargetPx, 44);
assert.equal(MOTION_TOUCH.pressFeedbackMs, 50);

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "../../..");
const motionCss = readFileSync(join(appRoot, "src/design/motion.css"), "utf8");
for (const v of MOTION_CSS_VARS) {
  assert.match(motionCss, new RegExp(v.replace(/-/g, "\\-")), `CSS var ${v}`);
}
assert.match(motionCss, /prefers-reduced-motion:\s*reduce/, "reduced-motion");
assert.match(motionCss, /\.mj-hit-slop/, "hit-slop utility");

const sheetCss = readFileSync(join(appRoot, "src/styles/components/app-bottom-sheet.css"), "utf8");
assert.match(sheetCss, /var\(--motion-sheet\)/, "sheet uses motion token");
assert.doesNotMatch(sheetCss, /transition:\s*transform\s+\d+ms/, "no hard-coded sheet ms");

const sheetSrc = readFileSync(join(appRoot, "src/components/ui/AppBottomSheet.tsx"), "utf8");
assert.match(sheetSrc, /MOTION_SHEET/, "sheet uses MOTION_SHEET");
assert.match(sheetSrc, /dismissRatio|rubberBand/, "sheet thresholds from tokens");
assert.doesNotMatch(sheetSrc, /useState\(0\)/, "لا useState لإزاحة السحب");

const hapticsSrc = readFileSync(join(appRoot, "src/lib/haptics.ts"), "utf8");
assert.match(hapticsSrc, /@capacitor\/haptics|capacitor-utils/, "Capacitor haptics path");
assert.match(hapticsSrc, /navigator\.vibrate/, "web vibrate fallback");

const instant = readFileSync(join(appRoot, "src/styles/components/instant-interaction.css"), "utf8");
assert.match(instant, /--mj-motion-instant/, "press feedback uses instant token");

const appSrc = readFileSync(join(appRoot, "src/App.tsx"), "utf8");
assert.match(appSrc, /RouteTransition/, "route transition wired");
assert.match(appSrc, /useEdgeBackGesture/, "edge back wired");

const ALLOW_CUBIC = new Set([
  "src/design/motion.ts",
  "src/design/motion.css",
  "src/app/styles/theme.css", // توافق mj-ease التاريخي
  "src/index.css", // --motion-* aliases فقط
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(css|ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const offenders: string[] = [];
for (const file of walk(join(appRoot, "src"))) {
  const rel = relative(appRoot, file).replace(/\\/g, "/");
  if (ALLOW_CUBIC.has(rel)) continue;
  if (rel.includes("mushaf") || rel.includes("brand-reveal") || rel.includes("quran")) continue;
  if (rel.includes("__tests__")) continue;
  const src = readFileSync(file, "utf8");
  if (/cubic-bezier\s*\(/.test(src)) offenders.push(rel);
}

assert.ok(
  offenders.length <= 80,
  `cubic-bezier خارج المصدر (${offenders.length}) — خفّض تدريجيًا. عيّنة: ${offenders.slice(0, 8).join(", ")}`,
);

console.log(
  `motion-single-source.test.ts: ok (cubic leftovers soft-cap=${offenders.length})`,
);
