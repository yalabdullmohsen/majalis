#!/usr/bin/env node
/**
 * بوابة تطابق صفحات المرجع — فحص هيكلي (نموذج بسيط).
 *
 * NOTE: تجميد page-311-freeze.png و مقارنة البكسل مُعطَّلة حتى تُعاد التقاط PNGs
 * (MUSHAF_311_PIXEL=1 بعد التحديث). يثبت: flow · S ثابت · ornament=none · بلا خرطوش.
 *
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/quran-import/mushaf-311-parity-gate.mjs
 */
import { chromium } from "playwright";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_PAGE_BROWSER_SOURCE,
} from "./mushaf-gate-active-page.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const BASE =
  process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") ||
  "https://majlisilm.com";
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR ||
  join(ROOT, ".local/mushaf-311-parity");
const BASELINE_PATH = join(ROOT, "src/features/mushaf/mushaf-baseline.json");
const VIEWPORT = { width: 390, height: 844 };
const PAGES = (process.env.MUSHAF_GATE_PAGES ||
  "1,2,3,600,601,602,603,283,311")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => n >= 1 && n <= 604);
const FONT_DEV = 0.05;
const PIXEL = process.env.MUSHAF_311_PIXEL === "1";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function measurePage(page, pageNum, baseline) {
  await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mf2-lines .mf2-line", { timeout: 45_000 });
  await sleep(800);
  await page.addStyleTag({
    content: `.mpv-toolbar,.mpv-navbar,.mpv-resume-banner,.qs-toast{display:none!important}`,
  });
  await sleep(100);

  const metrics = await page.evaluate((baseFont) => {
    const linesRoot = __mushafLinesRoot();
    const header = document.querySelector(".mpv-ayah-header");
    const footer = document.querySelector(".mpv-ayah-footer");
    if (!linesRoot || !header || !footer) return { error: "missing chrome" };
    const fontSizePx = parseFloat(getComputedStyle(linesRoot).fontSize) || 0;
    const badge = document.querySelector(".mpv-ayah-page-badge");
    const br = badge?.getBoundingClientRect();
    const pageW = document.documentElement.clientWidth;
    const numeralOffsetPx = br ? br.left + br.width / 2 - pageW / 2 : 999;
    const banner = document.querySelector(".mf2-surah-banner");
    const ornament = banner?.getAttribute("data-ornament") || null;
    const hasWing = Boolean(banner?.querySelector("[data-wing-part]"));

    let overflowX = 0;
    const rootRect = linesRoot.getBoundingClientRect();
    for (const w of linesRoot.querySelectorAll(".mf2-word")) {
      const r = w.getBoundingClientRect();
      overflowX = Math.max(
        overflowX,
        r.right - rootRect.right - 1.5,
        rootRect.left - r.left - 1.5,
      );
    }

    return {
      fontSizePx,
      numeralOffsetPx,
      ornament,
      hasWing,
      hasFrame: Boolean(
        document.querySelector("[data-opening-frame], .mf2-opening-frame"),
      ),
      hasCartoucheSvg: Boolean(
        document.querySelector(".mpv-ayah-page-badge__cartouche svg"),
      ),
      gridMode: linesRoot.getAttribute("data-mushaf-grid"),
      board: linesRoot.getAttribute("data-board"),
      pageChrome: footer.getAttribute("data-page-chrome"),
      absSlots: [...linesRoot.querySelectorAll(".mf2-grid-slot, .mf2-line")].filter(
        (el) => getComputedStyle(el).position === "absolute",
      ).length,
      overflowX: Math.max(0, overflowX),
      baseFontHint: baseFont,
    };
  }, baseline.fontSizePx);

  const shotPath = join(OUT_DIR, `page-${String(pageNum).padStart(3, "0")}.png`);
  await page.locator(".qs-mushaf-body-inner, .mf2-lines").first().screenshot({
    path: shotPath,
  });

  return { pageNum, shotPath, ...metrics };
}

function evaluate(results, baseline) {
  const failures = [];
  const table = [];

  for (const r of results) {
    if (r.error) {
      failures.push({ page: r.pageNum, reason: r.error });
      continue;
    }
    const fontDev = Math.abs(r.fontSizePx - baseline.fontSizePx) / baseline.fontSizePx;
    table.push({
      page: r.pageNum,
      fontSizePx: Number(r.fontSizePx.toFixed(3)),
      fontDevPct: Number((fontDev * 100).toFixed(2)),
      numeralOffsetPx: Number(r.numeralOffsetPx.toFixed(2)),
      ornament: r.ornament,
      gridMode: r.gridMode,
    });

    if (fontDev > FONT_DEV) {
      failures.push({
        page: r.pageNum,
        reason: `fontSize انحراف ${(fontDev * 100).toFixed(2)}% > ${FONT_DEV * 100}%`,
      });
    }
    if (Math.abs(r.numeralOffsetPx) > 2.05) {
      failures.push({
        page: r.pageNum,
        reason: `رقم الصفحة غير مركزي: offset=${r.numeralOffsetPx.toFixed(1)}px`,
      });
    }
    if (r.overflowX > 2) {
      failures.push({
        page: r.pageNum,
        reason: `تجاوز أفقي ${r.overflowX.toFixed(2)}px`,
      });
    }
    if (r.gridMode !== "flow") {
      failures.push({ page: r.pageNum, reason: `grid=${r.gridMode}` });
    }
    if (r.hasFrame) failures.push({ page: r.pageNum, reason: "إطار زخرفي" });
    if (r.hasCartoucheSvg) failures.push({ page: r.pageNum, reason: "خرطوش SVG" });
    if (r.hasWing) failures.push({ page: r.pageNum, reason: "جناح شارة" });
    if (r.ornament != null && r.ornament !== "none") {
      failures.push({ page: r.pageNum, reason: `ornament=${r.ornament}` });
    }
    if (r.absSlots > 0) {
      failures.push({ page: r.pageNum, reason: `${r.absSlots} absolute slots` });
    }
    if (r.pageChrome !== "minimal") {
      failures.push({ page: r.pageNum, reason: `chrome=${r.pageChrome}` });
    }
  }

  return { failures, table };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  console.log(`[mushaf-311-parity] base=${BASE}`);
  console.log(`[mushaf-311-parity] baseline font=${baseline.fontSizePx} (structural; pixel=${PIXEL})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: "ar-SA",
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });
  const results = [];

  try {
    for (const n of PAGES) {
      process.stdout.write(`  صفحة ${n}… `);
      const r = await measurePage(page, n, baseline);
      results.push(r);
      if (r.error) console.log(`خطأ: ${r.error}`);
      else {
        console.log(
          `font=${r.fontSizePx.toFixed(1)} grid=${r.gridMode} ornament=${r.ornament} numeral=${r.numeralOffsetPx.toFixed(1)}`,
        );
      }
    }
  } finally {
    await browser.close();
  }

  const { failures, table } = evaluate(results, baseline);

  const report = {
    base: BASE,
    generatedAt: new Date().toISOString(),
    baseline,
    pixelCompare: PIXEL,
    note: "PNGs will be refreshed for the minimal layout; structural invariants only until then.",
    freezePages: [1, 2, 3, 600, 601, 602, 603],
    table,
    failures,
    ok: failures.length === 0,
  };
  writeFileSync(join(OUT_DIR, "parity-report.json"), JSON.stringify(report, null, 2));
  if (failures.length) {
    console.error("[mushaf-311-parity] FAIL");
    for (const f of failures) console.error(`  ص${f.page}: ${f.reason}`);
    process.exit(1);
  }
  console.log("[mushaf-311-parity] OK");
}

main().catch((err) => {
  console.error("[mushaf-311-parity] ERROR:", err?.message || err);
  process.exit(1);
});
