#!/usr/bin/env node
/**
 * بوابة تجاوز أفقي حيّة (بعد document.fonts.ready):
 * حبر كل سطر يبقى داخل .mf2-lines بهامش ≥ sideMarginPx (افتراضي ٢px).
 * تقيس Range/getClientRects بعد scaleX — لا scrollWidth الاصطناعي.
 *
 *   pnpm run test:mushaf-live-overflow
 *   MUSHAF_GATE_PAGES=2,3,228 pnpm run test:mushaf-live-overflow
 *   MUSHAF_GATE_FULL=1 pnpm run test:mushaf-live-overflow   # ٦٠٤ صفحة
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24244";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-live-overflow");
const VIEWPORT = { width: 390, height: 844 };
const GRID = JSON.parse(
  readFileSync(join(ROOT, "src/features/mushaf/mushaf-grid.json"), "utf8"),
);
const CLEARANCE = Number(process.env.MUSHAF_GATE_CLEARANCE || GRID.sideMarginPx || 2);

const PAGES = (
  process.env.MUSHAF_GATE_PAGES ||
  (process.env.MUSHAF_GATE_FULL === "1"
    ? Array.from({ length: 604 }, (_, i) => String(i + 1)).join(",")
    : "1,2,3,50,228,235,283,588,599,600,601,604")
)
  .split(",")
  .map(Number)
  .filter((n) => n >= 1 && n <= 604);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function waitForServer(url, timeoutMs = 60_000) {
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

let server = null;
const killServer = () => {
  if (!server?.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    /* ignore */
  }
};

mkdirSync(OUT_DIR, { recursive: true });

if (!EXTERNAL_BASE) {
  console.log(`mushaf-live-overflow: Vite على ${BASE}`);
  server = spawn(
    "pnpm",
    ["exec", "vite", "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", PORT],
    {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT, BASE_PATH: "/" },
      detached: true,
    },
  );
  await waitForServer(BASE);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: VIEWPORT });
const failures = [];
const results = [];

try {
  for (const n of PAGES) {
    await page.goto(`${BASE}/mushaf/page/${n}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(
      "[data-mushaf-active-leaf] .mf2-lines, .mf2-lines",
      { timeout: 45_000 },
    );
    await page.evaluate(() => document.fonts.ready);
    await sleep(n <= 3 || n === 228 ? 1200 : 600);

    const m = await page.evaluate((clearance) => {
      const root =
        document.querySelector("[data-mushaf-active-leaf='1'] .mf2-lines") ||
        document.querySelector(".mf2-lines");
      if (!root) return { error: "missing .mf2-lines" };
      const lr = root.getBoundingClientRect();
      const lines = [...root.querySelectorAll(".mf2-line")];
      const bad = [];
      for (const el of lines) {
        let inkL = Infinity;
        let inkR = -Infinity;
        for (const node of el.querySelectorAll(".mf2-word")) {
          const r = node.getBoundingClientRect();
          if (r.width <= 0 && r.height <= 0) continue;
          inkL = Math.min(inkL, r.left);
          inkR = Math.max(inkR, r.right);
        }
        if (!Number.isFinite(inkL)) {
          const run = el.querySelector(".mf2-line__run");
          if (run) {
            const r = run.getBoundingClientRect();
            inkL = r.left;
            inkR = r.right;
          } else {
            const box = el.getBoundingClientRect();
            inkL = box.left;
            inkR = box.right;
          }
        }
        const clearL = inkL - lr.left;
        const clearR = lr.right - inkR;
        const overL = Math.max(0, clearance - clearL);
        const overR = Math.max(0, clearance - clearR);
        if (overL > 0.25 || overR > 0.25) {
          bad.push({
            line: el.getAttribute("data-line"),
            clearL: +clearL.toFixed(2),
            clearR: +clearR.toFixed(2),
            overL: +overL.toFixed(2),
            overR: +overR.toFixed(2),
            sx: el.style.getPropertyValue("--mf2-line-sx") || "1",
          });
        }
      }
      return {
        lineCount: lines.length,
        badCount: bad.length,
        bad: bad.slice(0, 8),
        contentBand: root.dataset?.mf2ContentBand || null,
      };
    }, CLEARANCE);

    results.push({ page: n, ...m });
    if (m.error) failures.push({ page: n, reason: m.error });
    else if (m.badCount > 0) {
      failures.push({
        page: n,
        reason: `تجاوز أفقي ${m.badCount} سطرًا (هامش < ${CLEARANCE}px)`,
        sample: m.bad,
      });
    }
  }
} finally {
  await browser.close();
  killServer();
}

const report = { base: BASE, clearance: CLEARANCE, pages: PAGES.length, failures, results };
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ base: BASE, clearance: CLEARANCE, failures, sample: results.slice(0, 3) }, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-live-overflow-gate: ok");
