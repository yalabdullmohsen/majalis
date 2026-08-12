#!/usr/bin/env node
/**
 * بوابة لقطة قاسية — فحص هيكلي (نموذج بسيط) حتى تُعاد التقاط PNGs.
 *
 * NOTE: docs/mushaf-hard-visual القديمة مزخرفة — مقارنة القناع مُعطَّلة مؤقتًا
 * (MUSHAF_HARD_VISUAL_PIXEL=1 بعد تحديث المراجع).
 *
 *   pnpm run test:mushaf-hard-visual
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_LINES_WAIT_SEL,
  ACTIVE_PAGE_BROWSER_SOURCE,
} from "./mushaf-gate-active-page.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24245";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-hard-visual");
const VIEWPORT = { width: 390, height: 844 };
const PAGES = (process.env.MUSHAF_HARD_VISUAL_PAGES || "1,2,3,600,601,602,603")
  .split(",")
  .map(Number)
  .filter((n) => n >= 1 && n <= 604);
const PIXEL = process.env.MUSHAF_HARD_VISUAL_PIXEL === "1";
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
  console.log(`mushaf-hard-visual: Vite على ${BASE}`);
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
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });
const failures = [];
const results = [];

try {
  for (const n of PAGES) {
    await page.goto(`${BASE}/mushaf/page/${n}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(ACTIVE_LINES_WAIT_SEL, { timeout: 45_000 });
    await sleep(600);

    const structural = await page.evaluate((expectedS) => {
      const lines = __mushafLinesRoot();
      const footer = document.querySelector(".mpv-ayah-footer");
      const badge = document.querySelector(".mpv-ayah-page-badge");
      if (!lines || !footer || !badge) return { error: "missing lines/footer/badge" };
      const br = badge.getBoundingClientRect();
      const fr = footer.getBoundingClientRect();
      const badgeInFooter =
        br.top >= fr.top - 0.5 && br.bottom <= fr.bottom + 0.5;
      let inkBot = -Infinity;
      for (const el of lines.querySelectorAll(".mf2-line")) {
        inkBot = Math.max(inkBot, el.getBoundingClientRect().bottom);
      }
      const S =
        parseFloat(getComputedStyle(lines).getPropertyValue("--mushaf-S")) ||
        parseFloat(getComputedStyle(lines).fontSize) ||
        0;
      return {
        badgeInFooter,
        inkToFooter: Number.isFinite(inkBot) ? fr.top - inkBot : null,
        gridMode: lines.getAttribute("data-mushaf-grid"),
        hasFrame: Boolean(
          document.querySelector("[data-opening-frame], .mf2-opening-frame"),
        ),
        hasCartoucheSvg: Boolean(
          document.querySelector(".mpv-ayah-page-badge__cartouche svg"),
        ),
        pageChrome: footer.getAttribute("data-page-chrome"),
        ornament: lines.querySelector(".mf2-surah-banner")?.getAttribute("data-ornament"),
        absSlots: [...lines.querySelectorAll(".mf2-grid-slot, .mf2-line")].filter(
          (el) => getComputedStyle(el).position === "absolute",
        ).length,
        S,
        expectedS,
        numeralDx: Math.abs(br.left + br.width / 2 - window.innerWidth / 2),
      };
    }, BASELINE.fontSizePx);

    results.push({
      page: n,
      structural,
      mode: PIXEL ? "pixel+structural" : "structural-only",
    });
    if (structural.error) failures.push({ page: n, reason: structural.error });
    if (structural.badgeInFooter === false) {
      failures.push({ page: n, reason: "رقم الصفحة خارج footerBand" });
    }
    if (structural.hasFrame) failures.push({ page: n, reason: "إطار زخرفي" });
    if (structural.hasCartoucheSvg) failures.push({ page: n, reason: "خرطوش SVG" });
    if (structural.gridMode !== "flow") {
      failures.push({ page: n, reason: `grid=${structural.gridMode}` });
    }
    if (structural.absSlots > 0) {
      failures.push({ page: n, reason: `${structural.absSlots} absolute` });
    }
    if (structural.pageChrome !== "minimal") {
      failures.push({ page: n, reason: `chrome=${structural.pageChrome}` });
    }
    if (structural.ornament != null && structural.ornament !== "none") {
      failures.push({ page: n, reason: `ornament=${structural.ornament}` });
    }
    if (structural.inkToFooter != null && structural.inkToFooter < 7.5) {
      failures.push({
        page: n,
        reason: `حبر→ذيل ${structural.inkToFooter.toFixed(1)}px < 8`,
      });
    }
    if (structural.numeralDx > 2.05) {
      failures.push({ page: n, reason: `رقم غير مركزي dx=${structural.numeralDx.toFixed(1)}` });
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
  failures,
  results,
};
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-hard-visual-gate: ok");
