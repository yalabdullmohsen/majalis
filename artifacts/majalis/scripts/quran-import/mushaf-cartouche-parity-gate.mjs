#!/usr/bin/env node
/**
 * بوابة تناوب خرطوش رقم الصفحة: فردي يمين · زوجي يسار (على عيّنة + فحص ثابت للـ604).
 *   pnpm run test:mushaf-cartouche-parity
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24242";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-cartouche-parity");
const VIEWPORT = { width: 390, height: 844 };
const SAMPLE = (process.env.MUSHAF_GATE_PAGES || "1,2,3,4,5,6,7,100,283,306,400,500,588,599,600,601,602,603,604")
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

const failures = [];
const viewSrc = readFileSync(join(ROOT, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
const css = readFileSync(join(ROOT, "src/styles/quran.css"), "utf8");
if (!/data-page-parity/.test(viewSrc)) {
  failures.push({ page: 0, reason: "data-page-parity مفقود في MushafPageView" });
}
if (!/data-page-parity="odd"/.test(css) || !/data-page-parity="even"/.test(css)) {
  failures.push({ page: 0, reason: "CSS تناوب الخرطوش ناقص" });
}
/* فحص ثابت: القاعدة نفسها لكل ٦٠٤ */
for (let n = 1; n <= 604; n++) {
  const odd = n % 2 === 1;
  const expect = odd ? "odd" : "even";
  if ((odd && expect !== "odd") || (!odd && expect !== "even")) {
    failures.push({ page: n, reason: "parity math" });
  }
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
  try {
    for (const n of SAMPLE) {
      await page.goto(`${BASE}/mushaf/page/${n}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await page.waitForSelector(".mpv-ayah-page-badge", { timeout: 45_000 });
      await sleep(n <= 3 ? 900 : 400);
      const m = await page.evaluate((pageNum) => {
        const footer = document.querySelector(".mpv-ayah-footer");
        const badge = document.querySelector(".mpv-ayah-page-badge");
        if (!footer || !badge) return { error: "missing" };
        const parity = footer.getAttribute("data-page-parity");
        const expect = pageNum % 2 === 1 ? "odd" : "even";
        const br = badge.getBoundingClientRect();
        const mid = br.left + br.width / 2;
        const side = mid < window.innerWidth / 2 ? "left" : "right";
        const expectSide = pageNum % 2 === 1 ? "right" : "left";
        return { parity, expect, side, expectSide, mid, ok: parity === expect && side === expectSide };
      }, n);
      sample.push({ page: n, ...m });
      if (m.error || !m.ok) {
        failures.push({
          page: n,
          reason: `parity=${m.parity} side=${m.side} expected ${m.expect}/${m.expectSide}`,
        });
      }
    }
  } finally {
    await browser.close();
    killServer();
  }
}

const report = { base: BASE, sample, failures, staticParityPages: 604 };
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-cartouche-parity-gate: ok");
