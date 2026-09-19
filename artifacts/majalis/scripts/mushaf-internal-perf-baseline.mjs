#!/usr/bin/env node
/**
 * يلتقط أحجام MushafReaderPage من dist بعد البناء.
 *   node artifacts/majalis/scripts/mushaf-internal-perf-baseline.mjs --write
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
const outDir = join(repoRoot, "docs/mushaf/baseline/internal-perf-pr1");
const ENTRY_BUDGET = 120 * 1024 + 320;
const MUSHAF_SOFT = 40 * 1024;

if (!existsSync(assetsDir)) {
  console.error("mushaf-internal-perf-baseline: dist/assets مفقود");
  process.exit(1);
}

const files = readdirSync(assetsDir);
function gzOf(f) {
  const buf = readFileSync(join(assetsDir, f));
  return { raw: buf.length, gz: gzipSync(buf, { level: 9 }).length };
}

const entryFiles = files.filter((f) => /^index-.*\.js$/.test(f));
let entry = null;
for (const f of entryFiles) {
  const m = gzOf(f);
  if (!entry || m.gz > entry.gz) entry = { f, ...m };
}
const mushafJs = files.filter((f) => /^MushafReaderPage-.*\.js$/.test(f)).map((f) => ({ f, ...gzOf(f) }));
const mushafCss = files
  .filter((f) => /^MushafReaderPage-.*\.css$/.test(f))
  .map((f) => ({ f, ...gzOf(f) }));

if (!entry || mushafJs.length === 0) {
  console.error("mushaf-internal-perf-baseline: entry أو MushafReaderPage ناقص");
  process.exit(1);
}

const primary = mushafJs.sort((a, b) => b.gz - a.gz)[0];
if (entry.gz > ENTRY_BUDGET) {
  console.error(`entry gzip ${entry.gz} > ${ENTRY_BUDGET}`);
  process.exit(1);
}
if (primary.gz > MUSHAF_SOFT) {
  console.error(`MushafReaderPage gzip ${primary.gz} > soft ${MUSHAF_SOFT}`);
  process.exit(1);
}

let commit = "unknown";
try {
  commit = execSync("git rev-parse HEAD", { cwd: repoRoot }).toString().trim();
} catch {
  /* ignore */
}

const payload = {
  program: "sunnah-mushaf-internal-architecture-performance-fluidity",
  stage: 1,
  stageName: "baseline-instrumentation-guards",
  measuredAt: new Date().toISOString(),
  commit,
  branchBase: "origin/main",
  reader: "new-mushaf-reader",
  presetId: "sunnah-mushaf-signature-v1",
  bundle: {
    entryJs: {
      file: entry.f,
      rawBytes: entry.raw,
      gzipBytes: entry.gz,
      gzipKiB: +(entry.gz / 1024).toFixed(2),
      note: "app entry — mushaf stays lazy",
    },
    mushafReaderPageJs: {
      file: primary.f,
      rawBytes: primary.raw,
      gzipBytes: primary.gz,
      gzipKiB: +(primary.gz / 1024).toFixed(2),
    },
    mushafReaderPageCss: mushafCss[0]
      ? {
          file: mushafCss[0].f,
          rawBytes: mushafCss[0].raw,
          gzipBytes: mushafCss[0].gz,
          gzipKiB: +(mushafCss[0].gz / 1024).toFixed(2),
        }
      : null,
  },
  caches: {
    renderModelMaxEntries: 16,
    layoutCacheMax: 12,
    renderCacheProbe: "docs/mushaf/baseline/next-gen-pr1/render-cache-probe.json",
  },
  geometryBaseline: {
    source: "docs/mushaf/baseline/next-gen-pr1/summary.json",
    pagesSample: [1, 2, 5, 100, 221, 459, 604],
    overflowFalse: true,
    overlapFalse: true,
    fontCheckTrue: true,
  },
  budgetsLocked: {
    entryJsGzipBytes: ENTRY_BUDGET,
    mushafReaderPageJsGzipBytesSoft: MUSHAF_SOFT,
    note: "entry = 120KiB+320B؛ soft لمسار MushafReaderPage = 40KiB gzip",
  },
  notMeasuredThisRun: [
    "tapToRouteStartMs",
    "routeChunkLoadMs",
    "fontReadyMs",
    "firstPageRenderMs",
    "firstInteractiveFrameMs",
    "touchToMoveMsDevice",
    "swipeFpsDevice",
    "pageCommitLatencyMsDevice",
    "transitionSettledMsDevice",
    "memoryAfter25TurnsMb",
    "memoryAfter100TurnsMb",
    "darkModeMeasure",
    "reducedMotionTransitionMs",
    "physicalIphoneIpad",
  ],
};

console.log(
  `mushaf-internal-perf-baseline: entry=${payload.bundle.entryJs.gzipKiB}KiB mushafJs=${payload.bundle.mushafReaderPageJs.gzipKiB}KiB`,
);

if (process.argv.includes("--write")) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "metrics.json"), JSON.stringify(payload, null, 2) + "\n");
  writeFileSync(
    join(outDir, "route-chunks.json"),
    JSON.stringify(
      {
        measuredAt: payload.measuredAt,
        commit: payload.commit,
        entryJs: { f: entry.f, raw: entry.raw, gz: entry.gz },
        mushafJs,
        mushafCss,
        renderCacheMaxEntries: 16,
        layoutCacheMax: 12,
      },
      null,
      2,
    ) + "\n",
  );
  console.log("wrote", outDir);
}
