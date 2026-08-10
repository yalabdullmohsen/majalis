#!/usr/bin/env node
/**
 * بوابة سلّم الخطوط الموحّد — كل حجم مقيس ضمن ±٣٪ من نسبته من S.
 *   pnpm run test:mushaf-typescale
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24243";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-typescale");
const VIEWPORT = { width: 390, height: 844 };
const RATIOS = {
  body: 1,
  surahBanner: 0.78,
  pageNumeral: 0.46,
  headerMeta: 0.42,
  footerHizb: 0.4,
};
const TOL = 0.03;

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
const typeSrc = readFileSync(join(ROOT, "src/features/mushaf/typescale.ts"), "utf8");
if (!/surahBannerName:\s*0\.78/.test(typeSrc)) failures.push({ reason: "typescale surah 0.78" });
if (!/pageNumeral:\s*0\.46/.test(typeSrc)) failures.push({ reason: "typescale numeral 0.46" });
if (!/headerMeta:\s*0\.42/.test(typeSrc)) failures.push({ reason: "typescale header 0.42" });
if (!/footerHizb:\s*0\.4/.test(typeSrc)) failures.push({ reason: "typescale footer 0.40" });

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
const measured = [];
if (failures.length === 0) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
  try {
    await page.goto(`${BASE}/mushaf/page/2`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(".mf2-lines", { timeout: 45_000 });
    await page.waitForSelector(".mf2-surah-banner__name", { timeout: 45_000 });
    await sleep(1200);
    const m = await page.evaluate((ratios) => {
      const px = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) || 0 : 0);
      const lines = document.querySelector(".mf2-lines");
      const S = px(lines);
      const bannerName = document.querySelector(".mf2-surah-banner__name");
      const numeral = document.querySelector(".mpv-ayah-page-badge__num");
      const header = document.querySelector(".mpv-ayah-header");
      const footer = document.querySelector(".mpv-ayah-footer__meta");
      const bas = document.querySelector(".mf2-bismillah");
      return {
        S,
        body: S,
        basmala: bas ? px(bas) : null,
        surahBanner: px(bannerName),
        pageNumeral: px(numeral),
        headerMeta: px(header),
        footerHizb: px(footer),
        ratios,
      };
    }, RATIOS);
    measured.push(m);
    const check = (label, value, ratio) => {
      if (value == null || !(m.S > 0)) return;
      const expect = m.S * ratio;
      const dev = Math.abs(value - expect) / expect;
      if (dev > TOL) {
        failures.push({
          reason: `${label}: ${value.toFixed(2)} vs ${expect.toFixed(2)} (dev ${(dev * 100).toFixed(1)}%)`,
        });
      }
    };
    check("body", m.body, RATIOS.body);
    check("surahBanner", m.surahBanner, RATIOS.surahBanner);
    check("pageNumeral", m.pageNumeral, RATIOS.pageNumeral);
    check("headerMeta", m.headerMeta, RATIOS.headerMeta);
    if (m.footerHizb > 0) check("footerHizb", m.footerHizb, RATIOS.footerHizb);
    if (m.basmala != null) check("basmala", m.basmala, RATIOS.body);
  } finally {
    await browser.close();
    killServer();
  }
}

const report = { base: BASE, measured, failures };
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-typescale-gate: ok");
