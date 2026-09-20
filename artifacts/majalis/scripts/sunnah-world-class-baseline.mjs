#!/usr/bin/env node
/**
 * يلتقط مقاييس Bundle لبرنامج Sunnah World-Class Product Polish (PR-1).
 * لا يخترع أرقام Runtime. --write يحدّث docs/performance/sunnah-world-class-baseline-metrics.json
 *
 *   node artifacts/majalis/scripts/sunnah-world-class-baseline.mjs
 *   node artifacts/majalis/scripts/sunnah-world-class-baseline.mjs --write
 */
import { gzipSync } from "node:zlib";
import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const majalisRoot = resolve(__dirname, "..");
const repoRoot = resolve(majalisRoot, "../..");
const assetsDir = join(majalisRoot, "dist", "assets");
const outPath = join(repoRoot, "docs/performance/sunnah-world-class-baseline-metrics.json");

const ENTRY_BUDGET = 120 * 1024 + 320;
const ICONS_BUDGET = 30 * 1024;
const CSS_BUDGET = 100 * 1024;
const MUSHAF_PAGE_SOFT = 40 * 1024;

if (!existsSync(assetsDir)) {
  console.error("sunnah-world-class-baseline: dist/assets مفقود — شغّل build أولًا");
  process.exit(1);
}

const files = readdirSync(assetsDir);
function biggest(re) {
  let best = null;
  for (const f of files.filter((x) => re.test(x))) {
    const buf = readFileSync(join(assetsDir, f));
    const gz = gzipSync(buf, { level: 9 }).length;
    if (!best || gz > best.gz) best = { f, raw: buf.length, gz };
  }
  return best;
}

const entry = biggest(/^index-.*\.js$/);
const css = biggest(/^index-.*\.css$/);
const icons = biggest(/^icons-.*\.js$/);
const mushafJs = biggest(/^MushafReaderPage-.*\.js$/);
const mushafCss = biggest(/^MushafReaderPage-.*\.css$/);
if (!entry || !css) {
  console.error("sunnah-world-class-baseline: index assets ناقصة");
  process.exit(1);
}

const soft = [];
for (const f of files.filter((x) => x.endsWith(".js"))) {
  const buf = readFileSync(join(assetsDir, f));
  const gz = gzipSync(buf, { level: 9 }).length;
  if (gz > 150 * 1024) soft.push({ chunk: f, gzipKiB: +(gz / 1024).toFixed(1) });
}
soft.sort((a, b) => b.gzipKiB - a.gzipKiB);

let commit = "unknown";
try {
  commit = execSync("git rev-parse HEAD", { cwd: repoRoot }).toString().trim();
} catch {
  /* ignore */
}

const payload = {
  program: "sunnah-world-class-product-polish",
  stage: 1,
  stageName: "quality-baseline-measure",
  measuredAt: new Date().toISOString(),
  commit,
  branchBase: "origin/main",
  environment: "local-agent-build",
  productRoot: "artifacts/majalis",
  appStoreNote:
    "التطبيق قيد مراجعة Apple — هذا الخط أساس للإصدار التالي فقط؛ لا تعديل لـBuild المقدمة.",
  commands: {
    build: "PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build",
    bundleBudget: "pnpm --filter @workspace/majalis run test:bundle-budget",
    capture: "node artifacts/majalis/scripts/sunnah-world-class-baseline.mjs --write",
  },
  bundle: {
    entryJs: {
      file: entry.f,
      rawBytes: entry.raw,
      gzipBytes: entry.gz,
      gzipKiB: +(entry.gz / 1024).toFixed(2),
      budgetKiB: 120,
      zlibSlackBytes: 320,
      gate: entry.gz <= ENTRY_BUDGET ? "pass" : "fail",
    },
    iconsJs: icons
      ? {
          file: icons.f,
          rawBytes: icons.raw,
          gzipBytes: icons.gz,
          gzipKiB: +(icons.gz / 1024).toFixed(2),
          budgetKiB: 30,
          gate: icons.gz <= ICONS_BUDGET ? "pass" : "fail",
        }
      : null,
    mainCss: {
      file: css.f,
      rawBytes: css.raw,
      gzipBytes: css.gz,
      gzipKiB: +(css.gz / 1024).toFixed(2),
      budgetKiB: 100,
      gate: css.gz <= CSS_BUDGET ? "pass" : "fail",
    },
    mushafReaderPageJs: mushafJs
      ? {
          file: mushafJs.f,
          rawBytes: mushafJs.raw,
          gzipBytes: mushafJs.gz,
          gzipKiB: +(mushafJs.gz / 1024).toFixed(2),
          softCeilingKiB: 40,
          gate: mushafJs.gz <= MUSHAF_PAGE_SOFT ? "pass" : "fail",
        }
      : null,
    mushafReaderPageCss: mushafCss
      ? {
          file: mushafCss.f,
          rawBytes: mushafCss.raw,
          gzipBytes: mushafCss.gz,
          gzipKiB: +(mushafCss.gz / 1024).toFixed(2),
        }
      : null,
    softWarnings: soft.slice(0, 8).map((s) => ({
      ...s,
      note: "lazy content chunk فوق soft 150 KiB — ليس فشل بوابة entry",
    })),
  },
  budgetsLocked: {
    entryJsGzipBytes: ENTRY_BUDGET,
    iconsJsGzipBytes: ICONS_BUDGET,
    mainCssGzipBytes: CSS_BUDGET,
    mushafReaderPageJsGzipBytesSoft: MUSHAF_PAGE_SOFT,
    note: "120*1024+320 · 30*1024 · 100*1024 · mushaf soft 40KiB — لا تُرفع في هذا البرنامج",
  },
  relatedBaselines: [
    "docs/performance/WHOLE_APP_BASELINE.md",
    "docs/performance/ARCHITECTURE_BASELINE.md",
    "docs/mushaf/MUSHAF_INTERNAL_PERFORMANCE_BASELINE.md",
    "artifacts/majalis/docs/design/SUNNAH_VISUAL_LANGUAGE.md",
  ],
  historicalPsiReferenceOnly: {
    source: "artifacts/majalis/scripts/perf-baseline.json",
    date: "2026-08-17",
    note: "مرجع تاريخي فقط — لا ادعاء تحسن مقابل هذا البرنامج",
    performance: 58,
    lcpMs: 6300,
    tbtMs: 560,
    cls: 0.033,
  },
  notMeasuredThisRun: [
    "coldStartMs",
    "warmStartMs",
    "resumeMs",
    "deepLinkOpenMs",
    "stableShellReadyMs",
    "firstMeaningfulContentMs",
    "touchToFeedbackMs",
    "touchToNavigationMs",
    "buttonResponseMs",
    "cardResponseMs",
    "filterResponseMs",
    "searchTypingLatencyMs",
    "sheetOpenCloseMs",
    "homeToSectionMs",
    "sectionToDetailMs",
    "searchToResultMs",
    "lessonListToDetailMs",
    "quranHubToMushafMs",
    "prayerToSettingsMs",
    "backNavigationMs",
    "frameDropCount",
    "longTaskCount",
    "layoutShiftSession",
    "renderCountSample",
    "remountCountSample",
    "repaintCostSample",
    "memoryGrowthMb",
    "duplicateRequestCount",
    "lighthouseHomeThisSession",
    "homeNetworkRequestCount",
    "fpsScrollHome",
    "fpsScrollQuranHub",
    "fpsScrollLessons",
  ],
};

if (
  payload.bundle.entryJs.gate === "fail" ||
  payload.bundle.mainCss.gate === "fail" ||
  (payload.bundle.mushafReaderPageJs && payload.bundle.mushafReaderPageJs.gate === "fail")
) {
  console.error("sunnah-world-class-baseline: FAILED budget");
  console.error(JSON.stringify(payload.bundle, null, 2));
  process.exit(1);
}

console.log(
  `sunnah-world-class-baseline: entry=${payload.bundle.entryJs.gzipKiB}KiB css=${payload.bundle.mainCss.gzipKiB}KiB mushafJs=${payload.bundle.mushafReaderPageJs?.gzipKiB ?? "n/a"}KiB`,
);

if (process.argv.includes("--write")) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n");
  console.log("wrote", outPath);
}
