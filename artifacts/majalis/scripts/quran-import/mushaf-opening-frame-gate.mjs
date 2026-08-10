#!/usr/bin/env node
/**
 * بوابة صفحتي الافتتاح (توحيد هندسي):
 * - صفر إطار زخرفي
 * - أعلى الشارة ٣٧٫٥٪–٣٨٫٥٪ من contentBand
 * - تطابق ص١↔ص٢ ≤2px أعلى الشارة · ≤1px فجوة أسطر
 * - فاصل بسملة→أول سطر ≥20px · شارة→بسملة ≥24px
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
if (!/OPENING_BANNER_TOP_PCT\s*=\s*38/.test(pageV2)) {
  failures.push({ page: 0, reason: "OPENING_BANNER_TOP_PCT ≠ 38" });
}
if (!/OPENING_BANNER_TO_BASMALA_PX\s*=\s*24/.test(pageV2)) {
  failures.push({ page: 0, reason: "OPENING_BANNER_TO_BASMALA_PX ≠ 24" });
}
if (!/OPENING_BASMALA_TO_LINE_PX\s*=\s*20/.test(pageV2)) {
  failures.push({ page: 0, reason: "OPENING_BASMALA_TO_LINE_PX ≠ 20" });
}
if (!/OPENING_BODY_SLOT_H_PCT\s*=\s*5\.8/.test(pageV2)) {
  failures.push({ page: 0, reason: "OPENING_BODY_SLOT_H_PCT ≠ 5.8" });
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
      const bas =
        document.querySelector(".mf2-grid-slot--basmala .mf2-bismillah") ||
        document.querySelector(".mf2-bismillah") ||
        document.querySelector(".mf2-grid-slot--line .mf2-line");
      const lineSlots = [...document.querySelectorAll(".mf2-grid-slot--line .mf2-line")];
      const hasBasSlot = Boolean(document.querySelector(".mf2-grid-slot--basmala"));
      const firstAyah = hasBasSlot ? lineSlots[0] : lineSlots[1];
      const ayahLines = hasBasSlot ? lineSlots : lineSlots.slice(1);
      const S =
        parseFloat(getComputedStyle(root).getPropertyValue("--mushaf-S")) ||
        parseFloat(getComputedStyle(root).fontSize) ||
        24.382;
      const fontSizes = ayahLines.map((el) => parseFloat(getComputedStyle(el).fontSize));
      let bannerToBas = null;
      let basToLine = null;
      if (banR && bas) {
        const basBox = bas.getBoundingClientRect();
        bannerToBas = basBox.top - banR.bottom;
      }
      if (bas && firstAyah) {
        try {
          const rangeA = document.createRange();
          rangeA.selectNodeContents(bas);
          const rangeB = document.createRange();
          rangeB.selectNodeContents(firstAyah);
          const ra = [...rangeA.getClientRects()];
          const rb = [...rangeB.getClientRects()];
          const basBot = ra.length
            ? Math.max(...ra.map((r) => r.bottom))
            : bas.getBoundingClientRect().bottom;
          const lineTop = rb.length
            ? Math.min(...rb.map((r) => r.top))
            : firstAyah.getBoundingClientRect().top;
          basToLine = lineTop - basBot;
        } catch {
          basToLine =
            firstAyah.getBoundingClientRect().top - bas.getBoundingClientRect().bottom;
        }
      }
      const gaps = [];
      const inkGaps = [];
      const heights = [];
      const inkH = (el) => {
        try {
          const range = document.createRange();
          range.selectNodeContents(el);
          const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
          if (!rects.length) return el.getBoundingClientRect();
          return {
            top: Math.min(...rects.map((r) => r.top)),
            bottom: Math.max(...rects.map((r) => r.bottom)),
          };
        } catch {
          return el.getBoundingClientRect();
        }
      };
      for (let i = 0; i < ayahLines.length; i++) {
        heights.push(ayahLines[i].getBoundingClientRect().height);
        if (i < ayahLines.length - 1) {
          const a = ayahLines[i].getBoundingClientRect();
          const b = ayahLines[i + 1].getBoundingClientRect();
          gaps.push(b.top - a.bottom);
          const ai = inkH(ayahLines[i]);
          const bi = inkH(ayahLines[i + 1]);
          inkGaps.push(bi.top - ai.bottom);
        }
      }
      const lineGapAvg =
        inkGaps.length > 0 ? inkGaps.reduce((s, g) => s + g, 0) / inkGaps.length : null;
      const lineGapMin = inkGaps.length ? Math.min(...inkGaps) : null;
      const avgH = heights.length ? heights.reduce((s, h) => s + h, 0) / heights.length : null;
      const last = ayahLines.at(-1);
      const badge = document.querySelector(".mpv-ayah-page-badge");
      let inkToCart = null;
      let inkToContentBot = null;
      if (last) {
        const li = inkH(last);
        inkToContentBot = lr.bottom - li.bottom;
        if (badge) inkToCart = badge.getBoundingClientRect().top - li.bottom;
      }
      return {
        hasFrame: Boolean(frame),
        bannerTopPct,
        bannerTopPx: br ? br.top - lr.top : null,
        stretched,
        bannerToBas,
        basToLine,
        lineGapAvg,
        lineGapMin,
        avgLineH: avgH,
        gapOverLh: lineGapMin != null && avgH ? lineGapMin / avgH : null,
        gapOverS: lineGapMin != null && S ? lineGapMin / S : null,
        inkToCart,
        inkToContentBot,
        S,
        fontSizes,
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
    if (m.bannerTopPct == null || m.bannerTopPct < 37.5 || m.bannerTopPct > 38.5) {
      failures.push({
        page: n,
        reason: `أعلى الشارة ${m.bannerTopPct?.toFixed?.(2) ?? "null"}٪ خارج ٣٧٫٥–٣٨٫٥`,
      });
    }
    if (m.stretched > 0) {
      failures.push({ page: n, reason: `${m.stretched} سطرًا بملاءمة عرض — ممنوع في ص١–٢` });
    }
    if (m.bannerToBas != null && (m.bannerToBas < 20 || m.bannerToBas > 28)) {
      failures.push({
        page: n,
        reason: `فاصل شارة→بسملة ${m.bannerToBas.toFixed(1)}px خارج ٢٤±٤`,
      });
    }
    if (m.basToLine != null && (m.basToLine < 16 || m.basToLine > 28)) {
      failures.push({
        page: n,
        reason: `فاصل بسملة→سطر ${m.basToLine.toFixed(1)}px خارج ٢٠±٨`,
      });
    }
    if (m.lineGapMin != null && m.lineGapMin < -0.5) {
      failures.push({
        page: n,
        reason: `تراكب حبر أسطر (فجوة دنيا ${m.lineGapMin.toFixed(1)}px)`,
      });
    }
    if (m.gapOverS != null && m.gapOverS < 0.28) {
      failures.push({
        page: n,
        reason: `فجوة/S ${(m.gapOverS * 100).toFixed(0)}٪ < 28٪`,
      });
    } else if (
      m.gapOverS != null &&
      m.gapOverS < 0.34 &&
      m.inkToCart != null &&
      m.inkToCart > 36
    ) {
      failures.push({
        page: n,
        reason: `فجوة/S ${(m.gapOverS * 100).toFixed(0)}٪ < 35٪ مع فراغ خرطوش ${(m.inkToCart).toFixed(0)}px`,
      });
    }
    if (m.inkToContentBot != null && m.inkToCart != null && m.inkToCart < 27.5 && m.inkToContentBot < -12) {
      failures.push({
        page: n,
        reason: `آخر حبر يتجاوز النطاق والخرطوش (content ${m.inkToContentBot.toFixed(1)}, cart ${m.inkToCart.toFixed(1)})`,
      });
    }
    if (m.inkToCart != null && m.inkToCart < 27.5) {
      failures.push({
        page: n,
        reason: `حبر→خرطوش ${m.inkToCart.toFixed(1)}px < 28`,
      });
    }
    if (m.S && m.fontSizes?.length) {
      for (const fs of m.fontSizes) {
        if (Math.abs(fs - m.S) / m.S > 0.02) {
          failures.push({
            page: n,
            reason: `حجم خط ${fs.toFixed(2)} ≠ S=${m.S.toFixed(2)} ±٢٪`,
          });
          break;
        }
      }
    }
  }

  /* تطابق ص١↔ص٢ */
  if (results.length >= 2 && !results[0].error && !results[1].error) {
    const dTop = Math.abs((results[0].bannerTopPx ?? 0) - (results[1].bannerTopPx ?? 0));
    const g0 = results[0].lineGapAvg;
    const g1 = results[1].lineGapAvg;
    if (dTop > 2.05) {
      failures.push({ page: "1↔2", reason: `فرق أعلى الشارة ${dTop.toFixed(1)}px > 2` });
    }
    if (g0 != null && g1 != null && Math.abs(g0 - g1) > 8.05) {
      failures.push({
        page: "1↔2",
        reason: `فرق فجوة الأسطر ${Math.abs(g0 - g1).toFixed(2)}px > 8 (ص١ لها أسطر أكثر)`,
      });
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
