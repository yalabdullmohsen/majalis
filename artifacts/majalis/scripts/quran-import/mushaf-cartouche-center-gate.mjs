#!/usr/bin/env node
/**
 * بوابة خرطوش آية: فردي يمين · زوجي يسار · بلا تقاطع مع الذيل/الشريط.
 *   pnpm run test:mushaf-cartouche-center
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_LINES_WAIT_SEL,
  ACTIVE_PAGE_BROWSER_SOURCE,
  resolveGatePages,
} from "./mushaf-gate-active-page.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24242";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-cartouche-parity");
const VIEWPORT = { width: 390, height: 844 };
const SAMPLE = resolveGatePages();

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

const failures = [];
const viewSrc = readFileSync(join(ROOT, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
const css = readFileSync(join(ROOT, "src/styles/quran.css"), "utf8");
if (!/data-page-parity/.test(viewSrc)) {
  failures.push({ page: 0, reason: "data-page-parity مفقود — مطلوب تناوب آية" });
}
if (!/data-cartouche-align="parity"/.test(viewSrc)) {
  failures.push({ page: 0, reason: "وسم parity للخرطوش مفقود" });
}
if (!/data-page-parity="odd"/.test(css) || !/data-page-parity="even"/.test(css)) {
  failures.push({ page: 0, reason: "CSS تناوب الخرطوش مفقود" });
}
if (/data-cartouche-side="center"/.test(viewSrc)) {
  failures.push({ page: 0, reason: "خرطوش مركزي ما زال موجودًا — المرجع آية يرفضه" });
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

if (!EXTERNAL_BASE && failures.length === 0) {
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
const sample = [];
if (failures.length === 0) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });
  try {
    for (const n of SAMPLE) {
      await page.goto(`${BASE}/mushaf/page/${n}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await page.waitForSelector(".mpv-ayah-page-badge", { timeout: 45_000 });
      await sleep(n <= 3 ? 900 : 400);
      const m = await page.evaluate((pageNum) => {
        const badge = document.querySelector(".mpv-ayah-page-badge");
        const footer = document.querySelector(".mpv-ayah-footer");
        const toolbar = document.querySelector(".mpv-toolbar--ayah");
        const lines = [...__mushafQueryAll(".mf2-grid-slot--line .mf2-line")];
        if (!badge || !footer) return { error: "missing" };
        const br = badge.getBoundingClientRect();
        const fr = footer.getBoundingClientRect();
        const mid = br.left + br.width / 2;
        const w = window.innerWidth;
        const odd = pageNum % 2 === 1;
        const midPct = (mid / w) * 100;
        const sideOk = odd ? midPct >= 70 : midPct <= 30;
        let lastInkBot = 0;
        for (const el of lines) {
          const r = el.getBoundingClientRect();
          if (r.height > 0) lastInkBot = Math.max(lastInkBot, r.bottom);
        }
        const gapToCart = lastInkBot > 0 ? br.top - lastInkBot : null;
        const tr = toolbar?.getBoundingClientRect();
        const toolbarTop = tr && tr.height > 1 ? tr.top : fr.bottom;
        const gapToToolbar = toolbarTop - br.bottom;
        const bandsOk =
          fr.bottom <= toolbarTop + 1 &&
          (gapToCart == null || gapToCart >= 8) &&
          gapToToolbar >= 6;
        return {
          midPct,
          odd,
          sideOk,
          gapToCart,
          gapToToolbar,
          ok: sideOk && bandsOk,
        };
      }, n);
      sample.push({ page: n, ...m });
      if (m.error || !m.ok) {
        failures.push({
          page: n,
          reason: `midPct=${m.midPct?.toFixed?.(1)} sideOk=${m.sideOk} gapCart=${m.gapToCart?.toFixed?.(1)} gapTb=${m.gapToToolbar?.toFixed?.(1)}`,
        });
      }
    }
  } finally {
    await browser.close();
    killServer();
  }
}

const report = { base: BASE, sample, failures, parityPages: 604 };
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-cartouche-parity-gate: ok");
