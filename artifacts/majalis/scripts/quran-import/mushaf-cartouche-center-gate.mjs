#!/usr/bin/env node
/**
 * بوابة رقم الصفحة البسيط (بدل خرطوش مزخرف):
 * - رقم عربي مركزي (±2px) عبر .mpv-ayah-page-badge
 * - data-page-chrome=minimal · بلا خرطوش SVG مطلوب
 * - مسافة مقبولة بين آخر حبر والذيل (≥8px)
 *
 *   pnpm run test:mushaf-cartouche-center
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_PAGE_BROWSER_SOURCE,
  resolveGatePages,
} from "./mushaf-gate-active-page.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24242";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-cartouche-center");
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
if (/data-page-parity/.test(viewSrc)) {
  failures.push({ page: 0, reason: "data-page-parity ما زال موجودًا — أُلغي التناوب" });
}
if (!/data-page-chrome="minimal"/.test(viewSrc)) {
  failures.push({ page: 0, reason: "data-page-chrome=minimal مفقود في MushafPageView" });
}
if (!/data-page-numeral="arabic"/.test(viewSrc)) {
  failures.push({ page: 0, reason: "data-page-numeral=arabic مفقود" });
}
if (!/left:\s*50%/.test(css) || !/translateX\(-50%\)/.test(css)) {
  failures.push({ page: 0, reason: "CSS توسيط رقم الصفحة ناقص" });
}
if (/data-page-parity="odd"/.test(css) || /data-page-parity="even"/.test(css)) {
  failures.push({ page: 0, reason: "CSS تناوب الخرطوش ما زال موجودًا" });
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
      const m = await page.evaluate(() => {
        const badge = document.querySelector(".mpv-ayah-page-badge");
        const footer = document.querySelector(".mpv-ayah-footer");
        const toolbar = document.querySelector(".mpv-toolbar--ayah");
        const lines = [...__mushafQueryAll(".mf2-grid-slot--line .mf2-line")];
        if (!badge || !footer) return { error: "missing" };
        const chrome = footer.getAttribute("data-page-chrome");
        const numeral = badge.getAttribute("data-page-numeral");
        const br = badge.getBoundingClientRect();
        const fr = footer.getBoundingClientRect();
        const mid = br.left + br.width / 2;
        const pageMid = window.innerWidth / 2;
        const dx = Math.abs(mid - pageMid);
        let lastInkBot = 0;
        for (const el of lines) {
          const r = el.getBoundingClientRect();
          if (r.height > 0) lastInkBot = Math.max(lastInkBot, r.bottom);
        }
        const gapToFooter = lastInkBot > 0 ? fr.top - lastInkBot : null;
        const tr = toolbar?.getBoundingClientRect();
        const toolbarTop = tr && tr.height > 1 ? tr.top : fr.bottom;
        const gapToToolbar = toolbarTop - br.bottom;
        const numText = (badge.textContent || "").trim();
        const arabicOk = /^[٠-٩]+$/.test(numText);
        const hasCartoucheSvg = Boolean(
          document.querySelector(".mpv-ayah-page-badge__cartouche svg, [data-cartouche] svg"),
        );
        return {
          dx,
          gapToFooter,
          gapToToolbar,
          chrome,
          numeral,
          arabicOk,
          hasCartoucheSvg,
          mid,
          pageMid,
          ok:
            dx <= 2.05 &&
            (gapToFooter == null || gapToFooter >= 7.5) &&
            gapToToolbar >= 7.5 &&
            chrome === "minimal" &&
            numeral === "arabic" &&
            arabicOk &&
            !hasCartoucheSvg,
        };
      });
      sample.push({ page: n, ...m });
      if (m.error || !m.ok) {
        failures.push({
          page: n,
          reason: `dx=${m.dx?.toFixed?.(1)} gapFoot=${m.gapToFooter?.toFixed?.(1)} gapTb=${m.gapToToolbar?.toFixed?.(1)} chrome=${m.chrome} numeral=${m.numeral} ar=${m.arabicOk} cartSvg=${m.hasCartoucheSvg}`,
        });
      }
    }
  } finally {
    await browser.close();
    killServer();
  }
}

const report = {
  base: BASE,
  sample,
  failures,
  model: "minimal-page-numeral",
  staticCenterPages: 604,
};
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-cartouche-center-gate: ok");
