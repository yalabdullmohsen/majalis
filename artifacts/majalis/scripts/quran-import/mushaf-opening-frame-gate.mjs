#!/usr/bin/env node
/**
 * بوابة صفحتي الافتتاح — نموذج التدفق البسيط:
 * - صفر إطار زخرفي (.mf2-opening-frame / OpeningPageFrame)
 * - نفس شبكة التدفق (data-mushaf-grid=flow · 15 صفًا) كباقي الصفحات
 * - بلا زخارف افتتاح منفصلة · حجم خط = S الثابت
 *
 *   pnpm run test:mushaf-opening-frame
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_LINES_WAIT_SEL,
  ACTIVE_PAGE_BROWSER_SOURCE,
} from "./mushaf-gate-active-page.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24241";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-opening-frame");
const VIEWPORT = { width: 390, height: 844 };
const OPENING = [1, 2];
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

const failures = [];
if (existsSync(join(ROOT, "src/components/quran/OpeningPageFrame.tsx"))) {
  failures.push({ page: 0, reason: "OpeningPageFrame.tsx لا يزال موجودًا — يجب حذفه" });
}
const pageV2 = readFileSync(join(ROOT, "src/components/quran/MushafPageV2.tsx"), "utf8");
if (/OpeningPageFrame|data-opening-frame|OPENING_FRAME_TOP/.test(pageV2)) {
  failures.push({ page: 0, reason: "MushafPageV2 ما زال يشير لإطار الافتتاح" });
}
if (/OPENING_BANNER_TOP_PCT/.test(pageV2)) {
  failures.push({ page: 0, reason: "OPENING_BANNER_TOP_PCT ما زال موجودًا — أُلغي مع النموذج البسيط" });
}
if (!/data-mushaf-grid="flow"/.test(pageV2)) {
  failures.push({ page: 0, reason: "MushafPageV2 بلا data-mushaf-grid=flow" });
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
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: VIEWPORT });
await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });
const results = [];

try {
  for (const n of OPENING) {
    await page.goto(`${BASE}/mushaf/page/${n}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(ACTIVE_LINES_WAIT_SEL, { timeout: 45_000 });
    await sleep(1200);
    await page.addStyleTag({ content: `.mpv-toolbar--ayah{display:none!important}` });

    const m = await page.evaluate((expectedS) => {
      const leaf = __mushafActiveRoot();
      const root = __mushafLinesRoot();
      if (!root) return { error: "no lines" };
      const frame = (leaf || document).querySelector(
        "[data-opening-frame], .mf2-opening-frame",
      );
      const gridMode = root.getAttribute("data-mushaf-grid");
      const banner = root.querySelector(".mf2-surah-banner");
      const ornament = banner?.getAttribute("data-ornament") || null;
      const lineSlots = [...root.querySelectorAll(".mf2-grid-slot--line .mf2-line")];
      const S =
        parseFloat(getComputedStyle(root).getPropertyValue("--mushaf-S")) ||
        parseFloat(getComputedStyle(root).fontSize) ||
        expectedS;
      const fontSizes = lineSlots.map((el) => parseFloat(getComputedStyle(el).fontSize));
      const absSlots = [...root.querySelectorAll(".mf2-grid-slot, .mf2-line")].filter(
        (el) => getComputedStyle(el).position === "absolute",
      ).length;
      const rowCount = getComputedStyle(root).gridTemplateRows.split(/\s+/).filter(Boolean).length;
      return {
        hasFrame: Boolean(frame),
        gridMode,
        ornament,
        absSlots,
        rowCount,
        S,
        fontSizes,
        lineCount: lineSlots.length,
        openingClass: root.classList.contains("mf2-lines--opening"),
      };
    }, BASELINE.fontSizePx);

    results.push({ page: n, ...m });
    await page.screenshot({ path: join(OUT_DIR, `page-${String(n).padStart(3, "0")}.png`) });

    if (m.error) {
      failures.push({ page: n, reason: m.error });
      continue;
    }
    if (m.hasFrame) failures.push({ page: n, reason: "إطار زخرفي ما زال مرسومًا (.mf2-opening-frame)" });
    if (m.gridMode !== "flow") {
      failures.push({ page: n, reason: `data-mushaf-grid=${m.gridMode} ≠ flow` });
    }
    if (m.absSlots > 0) {
      failures.push({ page: n, reason: `${m.absSlots} slot/line بـ position:absolute` });
    }
    if (m.ornament != null && m.ornament !== "none") {
      failures.push({ page: n, reason: `شارة ornament=${m.ornament} ≠ none` });
    }
    if (m.rowCount < 15) {
      failures.push({ page: n, reason: `صفوف الشبكة ${m.rowCount} < 15` });
    }
    if (m.S && m.fontSizes?.length) {
      for (const fs of m.fontSizes) {
        if (Math.abs(fs - m.S) / m.S > 0.04) {
          failures.push({
            page: n,
            reason: `حجم خط ${fs.toFixed(2)} ≠ S=${m.S.toFixed(2)} ±٤٪`,
          });
          break;
        }
      }
    }
  }
} finally {
  await browser.close();
  killServer();
}

const report = { base: BASE, results, failures, model: "flow-opening-no-frame" };
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-opening-frame-gate: ok");
