#!/usr/bin/env node
/**
 * بوابة صفحتي الافتتاح (مرجع نهائي):
 * - صفر إطار زخرفي
 * - أعلى الشارة ٢٦٪–٣٠٪ من contentBand
 * - بلا ملاءمة عرض · فاصل بسملة ≥20px
 *
 *   pnpm run test:mushaf-opening-frame
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24241";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-opening-frame");
const VIEWPORT = { width: 390, height: 844 };
const OPENING = [1, 2];

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
if (!/OPENING_BANNER_TOP_PCT\s*=\s*28/.test(pageV2)) {
  failures.push({ page: 0, reason: "OPENING_BANNER_TOP_PCT ≠ 28" });
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
const results = [];

try {
  for (const n of OPENING) {
    await page.goto(`${BASE}/mushaf/page/${n}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(".mf2-lines", { timeout: 45_000 });
    await sleep(1200);
    await page.addStyleTag({ content: `.mpv-toolbar--ayah{display:none!important}` });

    const m = await page.evaluate(() => {
      const root = document.querySelector(".mf2-lines");
      if (!root) return { error: "no lines" };
      const lr = root.getBoundingClientRect();
      const frame = document.querySelector("[data-opening-frame], .mf2-opening-frame");
      const banner = document.querySelector(".mf2-grid-slot--banner");
      const br = banner?.getBoundingClientRect();
      const bannerTopPct = br && lr.height > 0 ? ((br.top - lr.top) / lr.height) * 100 : null;
      const stretched = [...document.querySelectorAll(".mf2-line")].filter((el) => {
        const sx = getComputedStyle(el).getPropertyValue("--mf2-line-sx").trim();
        return sx && sx !== "1" && Number(sx) > 1.02;
      }).length;
      const banR = banner?.getBoundingClientRect();
      const ink =
        document.querySelector(".mf2-bismillah") ||
        document.querySelector(".mf2-grid-slot--line .mf2-line");
      let gap = null;
      if (banR && ink) {
        const ir = ink.getBoundingClientRect();
        gap = ir.top - banR.bottom;
      }
      return {
        hasFrame: Boolean(frame),
        bannerTopPct,
        stretched,
        basmalaGap: gap,
        contentH: lr.height,
        openingFlag: root.dataset.mf2OpeningNoFrame || null,
      };
    });

    results.push({ page: n, ...m });
    await page.screenshot({ path: join(OUT_DIR, `page-${String(n).padStart(3, "0")}.png`) });

    if (m.error) {
      failures.push({ page: n, reason: m.error });
      continue;
    }
    if (m.hasFrame) failures.push({ page: n, reason: "إطار زخرفي ما زال مرسومًا" });
    if (m.bannerTopPct == null || m.bannerTopPct < 26 || m.bannerTopPct > 30) {
      failures.push({
        page: n,
        reason: `أعلى الشارة ${m.bannerTopPct?.toFixed?.(2) ?? "null"}٪ خارج ٢٦–٣٠`,
      });
    }
    if (m.stretched > 0) {
      failures.push({ page: n, reason: `${m.stretched} سطرًا بملاءمة عرض — ممنوع في ص١–٢` });
    }
    if (m.basmalaGap != null && m.basmalaGap < 19.5) {
      failures.push({ page: n, reason: `فاصل بسملة ${m.basmalaGap.toFixed(1)}px < 20` });
    }
  }
} finally {
  await browser.close();
  killServer();
}

const report = { base: BASE, results, failures };
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-opening-frame-gate: ok");
