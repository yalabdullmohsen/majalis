#!/usr/bin/env node
/**
 * Single-pass mushaf measurement: one Chromium, one navigate+evaluate per page.
 * Writes JSON for Node-side gate asserts (no re-render per gate).
 *
 * Env:
 *   MUSHAF_GATE_FULL=1       — all 604 pages
 *   MUSHAF_GATE_PAGES=…      — comma list
 *   MUSHAF_GATE_SHARD=k      — 1-based shard index
 *   MUSHAF_GATE_SHARDS=n     — total shards (default 1)
 *   MUSHAF_SINGLE_PASS_OUT   — output JSON path
 *   MUSHAF_GATE_BASE_URL     — external preview/vite (skip spawn)
 *   PORT / BASE_PATH         — Vite (default 4179 / /)
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  ACTIVE_LINES_WAIT_SEL,
  ACTIVE_PAGE_BROWSER_SOURCE,
  applyGateShard,
  resolveGatePages,
  resolveGateMode,
} from "./mushaf-gate-active-page.mjs";
import { MUSHAF_SINGLE_PASS_MEASURE_SOURCE } from "./mushaf-single-pass-measure-fn.mjs";
import { resolveGateViewport } from "./mushaf-viewports.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || process.env.PORT || "4179";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT =
  process.env.MUSHAF_SINGLE_PASS_OUT ||
  join(ROOT, "artifacts/mushaf-single-pass/measurements.json");
const VIEWPORT = resolveGateViewport();
const DIST_INDEX = join(ROOT, "dist/index.html");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function waitForServer(url, timeoutMs = 90_000) {
  const start = Date.now();
  return new Promise((resolveOk, reject) => {
    const tryOnce = () => {
      fetch(url, { redirect: "manual" })
        .then(() => resolveOk())
        .catch(() => {
          if (Date.now() - start > timeoutMs) reject(new Error(`no server ${url}`));
          else setTimeout(tryOnce, 400);
        });
    };
    tryOnce();
  });
}

const allPages = resolveGatePages();
const { pages, shard, shards } = applyGateShard(allPages);
const mode = resolveGateMode();

if (pages.length === 0) {
  console.error("single-pass-measure: no pages in this shard");
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });

let server = null;
const killServer = () => {
  if (!server?.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    /* ignore */
  }
};

if (!EXTERNAL_BASE) {
  const usePreview =
    process.env.MUSHAF_GATE_USE_PREVIEW === "1" || existsSync(DIST_INDEX);
  const args = usePreview
    ? ["exec", "vite", "preview", "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", PORT]
    : ["exec", "vite", "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", PORT];
  console.log(
    `single-pass-measure: ${usePreview ? "preview" : "vite"} على ${BASE} · صفحات=${pages.length} (shard ${shard}/${shards}) · viewport=${VIEWPORT.width}×${VIEWPORT.height}`,
  );
  server = spawn("pnpm", args, {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT, BASE_PATH: process.env.BASE_PATH || "/" },
    detached: true,
  });
  try {
    await waitForServer(BASE);
  } catch (e) {
    killServer();
    console.error(e.message);
    process.exit(1);
  }
}

const browser = await chromium.launch({
  headless: true,
  args: ["--font-render-hinting=none", "--disable-lcd-text"],
});
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
  locale: "ar",
});
await context.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });
await context.addInitScript({ content: MUSHAF_SINGLE_PASS_MEASURE_SOURCE });
const page = await context.newPage();

const results = [];
const t0 = Date.now();

try {
  for (const pageNum of pages) {
    await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(ACTIVE_LINES_WAIT_SEL, { timeout: 45_000 });
    await page.evaluate(() => document.fonts.ready);
    await sleep(pageNum <= 3 || pageNum === 528 || pageNum === 228 ? 900 : 350);
    const data = await page.evaluate(
      (n) => window.__mushafSinglePassMeasure(n),
      pageNum,
    );
    results.push(data);
    if (data.error) console.error(`page ${pageNum}: ${data.error}`);
    else if (pageNum % 50 === 0 || pageNum <= 3) {
      console.log(
        `ص${pageNum}: lines=${data.lineDom} visible=${data.visibleFull} clipped=${data.clipped}`,
      );
    }
  }
} finally {
  await browser.close();
  killServer();
}

const payload = {
  generatedAt: new Date().toISOString(),
  mode,
  shard,
  shards,
  viewport: { id: VIEWPORT.id, width: VIEWPORT.width, height: VIEWPORT.height, label: VIEWPORT.label },
  pageCount: results.length,
  pageNumbers: pages,
  elapsedMs: Date.now() - t0,
  draws: results.length,
  pages: results,
};
writeFileSync(OUT, JSON.stringify(payload), "utf8");
console.log(
  `single-pass-measure: ${results.length} draws (shard ${shard}/${shards}) @ ${VIEWPORT.width}×${VIEWPORT.height} → ${OUT} in ${payload.elapsedMs}ms`,
);
