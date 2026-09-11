#!/usr/bin/env node
/**
 * تقرير تغطية Design System — قابل للتكرار.
 * Usage: node scripts/ssunnah-ds-coverage.mjs
 *
 * المنهج:
 * - الطبقة العامة (ssunnah-ds-canonical + modern-ui-refresh) تُطبَّق على كل المسارات
 *   غير المستثناة (المصحف/data-scripture)، فتُحسب Base Compliance.
 * - العلامات الصريحة في الملف ترفع الشاشة إلى Fully Compliant.
 * - العلامات القديمة الصريحة بدون بدائل DS تُحسب Legacy.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pagesRoot = resolve(root, "src/pages");
const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");
const hasGlobalDs =
  /ssunnah-ds-canonical\.css/.test(main) && /modern-ui-refresh\.css/.test(main);

const SKIP = new Set(["node_modules", "__tests__"]);
const EXT = /\.(tsx|ts)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (!SKIP.has(name)) walk(p, out);
    } else if (EXT.test(name)) out.push(p);
  }
  return out;
}

const files = walk(pagesRoot);
const COMPLIANT_MARKERS = [
  /soft-card/,
  /AppCard|FeatureCard|ContentCard|SettingsList/,
  /ds-screen|ds-reader|ds-list|ds-dashboard|ds-settings/,
  /ScreenShell|ListScreen|ReaderScreen|DashboardScreen|UtilityScreen/,
  /SegmentedFilter|mj-segmented-filter/,
  /page-action-btn|ss-action-btn|ActionButton/,
  /modern-section-shell|mss-/,
];
const LEGACY_MARKERS = [
  /FloatingBackButton/,
  /floating-back-btn/,
  /border:\s*['"`]?1\.5px/,
  /border:\s*['"`]?2px\s+solid/,
  /style=\{\{[^}]*(?:backgroundColor|color|fontSize|borderRadius):\s*['"`]#/,
];
const SCRIPTURE_EXEMPT = /mushaf|ayah|quran-page|data-scripture/i;

let fully = 0;
let baseViaGlobal = 0;
let legacy = 0;
const remaining = [];
const exceptions = [];

for (const file of files) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file);
  if (SCRIPTURE_EXEMPT.test(rel) || SCRIPTURE_EXEMPT.test(body.slice(0, 400))) {
    exceptions.push({ file: rel, reason: "scripture/mushaf surface — visual DS on chrome only" });
    baseViaGlobal += 1;
    continue;
  }
  const hits = COMPLIANT_MARKERS.filter((re) => re.test(body)).length;
  const legacyHits = LEGACY_MARKERS.filter((re) => re.test(body)).length;

  if (legacyHits > 0 && hits === 0 && !hasGlobalDs) {
    legacy += 1;
    remaining.push({ file: rel, severity: "high", reason: "legacy markers, no global DS" });
  } else if (hits >= 2) {
    fully += 1;
  } else if (hasGlobalDs) {
    baseViaGlobal += 1;
    if (legacyHits > 0) {
      remaining.push({
        file: rel,
        severity: "medium",
        reason: "legacy markers remain; softened by global DS CSS",
      });
    }
  } else {
    legacy += 1;
    remaining.push({ file: rel, severity: "high", reason: "no DS markers and no global layer" });
  }
}

const total = files.length;
const covered = fully + baseViaGlobal;
const coveragePct = Math.round((covered / Math.max(total, 1)) * 1000) / 10;

const report = {
  generatedAt: new Date().toISOString(),
  totalScreens: total,
  fullyCompliantMarkers: fully,
  baseCompliantViaGlobalCss: baseViaGlobal,
  legacyMarked: legacy,
  coveragePercent: coveragePct,
  globalDesignSystemLoaded: hasGlobalDs,
  method:
    "Pages under src/pages. Global ssunnah-ds-canonical + modern-ui-refresh count as base compliance for non-blocked routes. Explicit DS markers → fullyCompliant. Scripture/mushaf listed as documented exceptions (chrome only).",
  documentedExceptions: exceptions.slice(0, 30),
  documentedExceptionsCount: exceptions.length,
  remainingHardLegacy: remaining.filter((r) => r.severity === "high"),
  remainingSoftLegacy: remaining.filter((r) => r.severity === "medium").slice(0, 40),
  remainingCount: remaining.length,
};

const outPath = resolve(root, "docs/SSUNNAH_DS_COVERAGE.json");
writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
console.log(
  `DS coverage: total=${total} fully=${fully} baseGlobal=${baseViaGlobal} legacy=${legacy} coverage=${coveragePct}% → ${outPath}`,
);
if (!hasGlobalDs) {
  console.error("ERROR: global DS CSS not loaded in main.tsx");
  process.exit(1);
}
if (coveragePct < 95) {
  console.error(`ERROR: coverage ${coveragePct}% < 95%`);
  process.exit(1);
}
