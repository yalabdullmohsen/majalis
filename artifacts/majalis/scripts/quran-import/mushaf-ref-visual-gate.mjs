#!/usr/bin/env node
/**
 * بوابة مرجعية بصرية — فحص هيكلي (نموذج بسيط) حتى تُعاد التقاط PNGs.
 *
 * NOTE: لقطات docs/mushaf-reference القديمة مزخرفة — مقارنة البكسل مُعطَّلة مؤقتًا
 * (MUSHAF_REF_PIXEL=1 لإعادة تفعيلها بعد تحديث المراجع).
 * الصفحات: 1,2,3,600,601,602,603 (+ عيّنة اختيارية).
 *
 *   pnpm run test:mushaf-ref-visual
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_PAGE_BROWSER_SOURCE,
} from "./mushaf-gate-active-page.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24243";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-ref-visual");
const VIEWPORT = { width: 390, height: 844 };
const PAGES = (process.env.MUSHAF_REF_PAGES || "1,2,3,600,601,602,603")
  .split(",")
  .map(Number)
  .filter((n) => n >= 1 && n <= 604);
const PIXEL = process.env.MUSHAF_REF_PIXEL === "1";
const BASELINE = JSON.parse(
  readFileSync(join(ROOT, "src/features/mushaf/mushaf-baseline.json"), "utf8"),
);

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

async function structuralSnapshot(page) {
  return page.evaluate((expectedS) => {
    const root = __mushafLinesRoot();
    if (!root) return { error: "no lines" };
    const frame = document.querySelector("[data-opening-frame], .mf2-opening-frame");
    const banner = root.querySelector(".mf2-surah-banner");
    const badge = document.querySelector(".mpv-ayah-page-badge");
    const footer = document.querySelector(".mpv-ayah-footer");
    let numeralDx = null;
    if (badge) {
      const br = badge.getBoundingClientRect();
      numeralDx = Math.abs(br.left + br.width / 2 - window.innerWidth / 2);
    }
    const S =
      parseFloat(getComputedStyle(root).getPropertyValue("--mushaf-S")) ||
      parseFloat(getComputedStyle(root).fontSize) ||
      0;
    return {
      hasFrame: Boolean(frame),
      gridMode: root.getAttribute("data-mushaf-grid"),
      board: root.getAttribute("data-board"),
      ornament: banner?.getAttribute("data-ornament") || null,
      bannerStyle: banner?.getAttribute("data-banner-style") || null,
      pageChrome: footer?.getAttribute("data-page-chrome") || null,
      pageNumeral: badge?.getAttribute("data-page-numeral") || null,
      hasCartoucheSvg: Boolean(
        document.querySelector(".mpv-ayah-page-badge__cartouche svg, [data-cartouche] svg"),
      ),
      absSlots: [...root.querySelectorAll(".mf2-grid-slot, .mf2-line")].filter(
        (el) => getComputedStyle(el).position === "absolute",
      ).length,
      S,
      expectedS,
      numeralDx,
      qpc: root.classList.contains("mf2-lines--qpc-contiguous"),
    };
  }, BASELINE.fontSizePx);
}

const failures = [];
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
  server = spawn(
    "pnpm",
    ["exec", "vite", "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", PORT],
    {
      cwd: ROOT,
      env: { ...process.env, PORT, BASE_PATH: "/", HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
  try {
    await waitForServer(BASE, 60_000);
  } catch (e) {
    killServer();
    console.error(e.message);
    process.exit(1);
  }
}

mkdirSync(OUT_DIR, { recursive: true });
const results = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });

try {
  for (const n of PAGES) {
    await page.goto(`${BASE}/mushaf/page/${n}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(".mf2-lines", { timeout: 60_000 });
    await sleep(700);
    const structural = await structuralSnapshot(page);
    results.push({ page: n, structural, mode: PIXEL ? "pixel+structural" : "structural-only" });

    if (structural.error) {
      failures.push({ page: n, reason: structural.error });
      continue;
    }
    if (structural.hasFrame) failures.push({ page: n, reason: "إطار زخرفي موجود" });
    if (structural.gridMode !== "flow") {
      failures.push({ page: n, reason: `grid=${structural.gridMode}` });
    }
    if (structural.absSlots > 0) {
      failures.push({ page: n, reason: `${structural.absSlots} absolute slots` });
    }
    if (structural.ornament != null && structural.ornament !== "none") {
      failures.push({ page: n, reason: `ornament=${structural.ornament}` });
    }
    if (structural.hasCartoucheSvg) {
      failures.push({ page: n, reason: "خرطوش SVG ما زال مرسومًا" });
    }
    if (structural.pageChrome !== "minimal") {
      failures.push({ page: n, reason: `chrome=${structural.pageChrome}` });
    }
    if (structural.numeralDx != null && structural.numeralDx > 2.05) {
      failures.push({ page: n, reason: `رقم غير مركزي dx=${structural.numeralDx.toFixed(1)}` });
    }
    if (structural.S > 0) {
      const rel = Math.abs(structural.S - BASELINE.fontSizePx) / BASELINE.fontSizePx;
      if (rel > 0.05) {
        failures.push({ page: n, reason: `S=${structural.S.toFixed(2)} ≠ baseline` });
      }
    }

    await page.screenshot({
      path: join(OUT_DIR, `gen-${String(n).padStart(3, "0")}.png`),
    });
  }
} finally {
  await browser.close();
  killServer();
}

const report = {
  base: BASE,
  pixelCompare: PIXEL,
  note: "PNGs will be refreshed for the minimal layout; structural invariants only until then.",
  pages: PAGES,
  results,
  failures,
};
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-ref-visual-gate: ok");
