#!/usr/bin/env node
/**
 * بوابة المقاسات الأربعة — اكتمال · صفر اقتطاع · صفر تقاطع · صفر تجاوز أفقي.
 * يعيد استخدام محرّك القياس الواحد مع viewport لكل مقاس.
 *
 * Env:
 *   MUSHAF_GATE_BASE_URL — معاينة خارجية
 *   MUSHAF_MULTI_VP_PAGES — قائمة صفحات اختيارية
 *   MUSHAF_MULTI_VP_OUT — مسار تقرير JSON
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  ACTIVE_LINES_WAIT_SEL,
  ACTIVE_PAGE_BROWSER_SOURCE,
} from "./mushaf-gate-active-page.mjs";
import { MUSHAF_SINGLE_PASS_MEASURE_SOURCE } from "./mushaf-single-pass-measure-fn.mjs";
import {
  MUSHAF_GATE_VIEWPORTS,
  MUSHAF_MULTI_VIEWPORT_PAGES,
} from "./mushaf-viewports.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const PAGES_DIR = join(ROOT, "public/data/quran-v2/pages");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || process.env.PORT || "4183";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT =
  process.env.MUSHAF_MULTI_VP_OUT ||
  join(ROOT, "artifacts/mushaf-multi-viewport/report.json");
const DIST_INDEX = join(ROOT, "dist/index.html");

const pages = (process.env.MUSHAF_MULTI_VP_PAGES || MUSHAF_MULTI_VIEWPORT_PAGES.join(","))
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n >= 1 && n <= 604);

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

function expectedAyahLines(pageNum) {
  const file = join(PAGES_DIR, `page-${String(pageNum).padStart(3, "0")}.json`);
  if (!existsSync(file)) return null;
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(data)) return null;
  const lines = new Set();
  for (const ayah of data) {
    for (const w of ayah.words || []) {
      const ln = w.line_number ?? w.lineNumber;
      if (Number.isFinite(ln) && ln >= 1) lines.add(ln);
    }
  }
  return lines.size;
}

function assertMeasure(vp, m) {
  const fails = [];
  if (m.error) {
    fails.push({ gate: "measure", reason: m.error });
    return fails;
  }
  const expected = expectedAyahLines(m.page);
  const expectCount = expected ?? m.lineDom;
  if (
    m.clipped > 0 ||
    m.missingInk > 0 ||
    (expectCount != null && m.visibleFull < expectCount) ||
    (m.overflowBad && m.overflowBad.length > 0)
  ) {
    fails.push({
      gate: "completeness",
      reason: m.overflowBad?.length
        ? "overflowY hidden"
        : `visible=${m.visibleFull} expected=${expectCount} clipped=${m.clipped} missing=${m.missingInk}`,
    });
  }
  if (m.hOverflow?.length) {
    fails.push({
      gate: "horizontal-overflow",
      reason: m.hOverflow
        .slice(0, 3)
        .map((h) => `slot${h.slot}`)
        .join(","),
    });
  }
  if (m.inkOverlaps?.length) {
    fails.push({
      gate: "ink-collision",
      reason: m.inkOverlaps.map((o) => `${o.a}×${o.b}`).join(","),
    });
  }
  return fails.map((f) => ({
    viewport: `${vp.width}x${vp.height}`,
    viewportId: vp.id,
    page: m.page,
    ...f,
  }));
}

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
    `multi-viewport-gate: ${usePreview ? "preview" : "vite"} @ ${BASE} · pages=${pages.join(",")} · viewports=${MUSHAF_GATE_VIEWPORTS.length}`,
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

const failures = [];
const summary = [];
const t0 = Date.now();

try {
  for (const vp of MUSHAF_GATE_VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      locale: "ar",
    });
    await context.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });
    await context.addInitScript({ content: MUSHAF_SINGLE_PASS_MEASURE_SOURCE });
    const page = await context.newPage();
    let ok = 0;
    for (const pageNum of pages) {
      await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await page.waitForSelector(ACTIVE_LINES_WAIT_SEL, { timeout: 45_000 });
      await page.evaluate(() => document.fonts.ready);
      await sleep(pageNum <= 3 ? 900 : 400);
      const data = await page.evaluate(
        (n) => window.__mushafSinglePassMeasure(n),
        pageNum,
      );
      const fails = assertMeasure(vp, data);
      if (fails.length) failures.push(...fails);
      else ok += 1;
      summary.push({
        viewport: vp.id,
        page: pageNum,
        clipped: data.clipped ?? null,
        visibleFull: data.visibleFull ?? null,
        hOverflow: data.hOverflow?.length ?? 0,
        inkOverlaps: data.inkOverlaps?.length ?? 0,
        contentBand: data.contentBand?.height ?? null,
        ok: fails.length === 0,
      });
    }
    await context.close();
    console.log(
      `  ${vp.label} (${vp.width}×${vp.height}): ${ok}/${pages.length} صفحات خضراء`,
    );
  }
} finally {
  await browser.close();
  killServer();
}

mkdirSync(dirname(OUT), { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  elapsedMs: Date.now() - t0,
  viewports: MUSHAF_GATE_VIEWPORTS,
  pages,
  failures: failures.length,
  failureList: failures.slice(0, 100),
  summary,
};
writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ failures: failures.length, out: OUT, elapsedMs: report.elapsedMs }, null, 2));

if (failures.length) {
  console.error(`multi-viewport-gate: FAIL ${failures.length}`);
  for (const f of failures.slice(0, 20)) {
    console.error(`  [${f.viewport}] ص${f.page} ${f.gate}: ${f.reason}`);
  }
  process.exit(1);
}
console.log(
  `multi-viewport-gate: ok · ${MUSHAF_GATE_VIEWPORTS.length} مقاسات × ${pages.length} صفحات`,
);
