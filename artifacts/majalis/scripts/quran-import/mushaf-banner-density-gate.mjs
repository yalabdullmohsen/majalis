#!/usr/bin/env node
/**
 * بوابة الشارة البسيطة (بدل كثافة الجناح):
 * - data-ornament=none · data-banner-style=minimal-rule
 * - بلا SVG أجنحة / data-wing-part
 * - ارتفاع الشارة ≈ خانة سطر واحدة (±12٪)
 * - شبكة تدفق 15 صفًا متساويًا
 *
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/quran-import/mushaf-banner-density-gate.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_LINES_WAIT_SEL,
  ACTIVE_PAGE_BROWSER_SOURCE,
} from "./mushaf-gate-active-page.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const BASE =
  process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") ||
  "https://majlisilm.com";
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR ||
  join(ROOT, ".local/mushaf-banner-density");
const GRID = JSON.parse(
  readFileSync(join(ROOT, "src/features/mushaf/mushaf-grid.json"), "utf8"),
);
const VIEWPORT = { width: 390, height: 844 };
const BANNER_PAGES = [1, 2, 599, 600, 601, 602, 603];
const GRID_PAGES = [3, 4, 100, 283, 306, 400, 500, 588, 596, 599, 600, 601, 602, 603, 604];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function measureBanner(page, pageNum) {
  await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(ACTIVE_LINES_WAIT_SEL, { timeout: 45_000 });
  await sleep(900);
  await page.addStyleTag({
    content: `.mpv-toolbar,.mpv-navbar,.mpv-resume-banner,.qs-toast{display:none!important}`,
  });
  await sleep(120);

  return page.evaluate(({ slotHeightPct }) => {
    const lines = __mushafLinesRoot();
    const header = document.querySelector(".mpv-ayah-header");
    const footer = document.querySelector(".mpv-ayah-footer");
    if (!lines || !header || !footer) return { error: "missing chrome" };
    const lr = lines.getBoundingClientRect();
    const blockH = Math.max(1, lr.height);

    const gridMode = lines.getAttribute("data-mushaf-grid");
    const banner = lines.querySelector(".mf2-surah-banner");
    let ornament = null;
    let bannerStyle = null;
    let bannerHRatio = null;
    let hasWingSvg = false;
    let hasWingParts = false;

    if (banner) {
      ornament = banner.getAttribute("data-ornament");
      bannerStyle = banner.getAttribute("data-banner-style");
      const br = banner.getBoundingClientRect();
      const expectedSlotH = blockH * (slotHeightPct / 100);
      bannerHRatio = expectedSlotH > 0 ? br.height / expectedSlotH : 0;
      const svg = banner.querySelector("svg");
      hasWingSvg = Boolean(svg);
      hasWingParts = Boolean(
        svg?.querySelector('[data-wing-part], [data-ornament*="wing"]'),
      );
    }

    /* أكبر فراغ متصل داخل الكتلة */
    const ordered = [...lines.querySelectorAll("[data-grid-slot]")]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.height > 0)
      .sort((a, b) => a.top - b.top);
    let maxGapPct = 0;
    for (let i = 1; i < ordered.length; i++) {
      maxGapPct = Math.max(
        maxGapPct,
        ((ordered[i].top - ordered[i - 1].bottom) / blockH) * 100,
      );
    }
    if (ordered.length) {
      maxGapPct = Math.max(maxGapPct, ((ordered[0].top - lr.top) / blockH) * 100);
    }

    const absSlots = [...lines.querySelectorAll(".mf2-grid-slot, .mf2-line")].filter(
      (el) => getComputedStyle(el).position === "absolute",
    ).length;

    return {
      gridMode,
      bannerHRatio,
      ornament,
      bannerStyle,
      hasWingSvg,
      hasWingParts,
      maxGapPct,
      absSlots,
      blockH,
      hasBanner: Boolean(banner),
    };
  }, { slotHeightPct: GRID.slotHeightPct });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });
  const results = [];
  const failures = [];

  const allPages = [...new Set([...BANNER_PAGES, ...GRID_PAGES])].sort((a, b) => a - b);

  for (const n of allPages) {
    try {
      const raw = await measureBanner(page, n);
      if (raw.error) {
        failures.push({ page: n, reason: raw.error });
        continue;
      }
      const shot = join(OUT_DIR, `page-${String(n).padStart(3, "0")}.png`);
      await page.locator(".qs-mushaf-body-inner, .mf2-lines").first().screenshot({
        path: shot,
      });

      const row = { page: n, ...raw, shot };
      results.push(row);

      if (raw.gridMode !== "flow") {
        failures.push({ page: n, reason: `data-mushaf-grid=${raw.gridMode} ≠ flow` });
      }
      if (raw.absSlots > 0) {
        failures.push({ page: n, reason: `${raw.absSlots} عنصرًا بـ position:absolute على slot/line` });
      }

      if (BANNER_PAGES.includes(n) && raw.hasBanner) {
        if (raw.ornament !== "none") {
          failures.push({
            page: n,
            reason: `data-ornament=${raw.ornament} ≠ none`,
          });
        }
        if (raw.bannerStyle !== "minimal-rule") {
          failures.push({
            page: n,
            reason: `data-banner-style=${raw.bannerStyle} ≠ minimal-rule`,
          });
        }
        if (raw.hasWingSvg || raw.hasWingParts) {
          failures.push({ page: n, reason: "شارة ما زالت تحمل SVG جناح" });
        }
        if (raw.bannerHRatio != null) {
          if (raw.bannerHRatio < 0.7 || raw.bannerHRatio > 1.2) {
            failures.push({
              page: n,
              reason: `ارتفاع الشارة ${(raw.bannerHRatio * 100).toFixed(1)}% من الخانة (المطلوب ≈ خانة واحدة)`,
            });
          }
        }
      }

      const opening = n === 1 || n === 2;
      if (!opening && GRID_PAGES.includes(n) && raw.maxGapPct > 8) {
        failures.push({
          page: n,
          reason: `فراغ متصل ${raw.maxGapPct.toFixed(1)}% > 8%`,
        });
      }
    } catch (e) {
      failures.push({ page: n, reason: String(e?.message || e) });
    }
  }

  await browser.close();
  const report = { base: BASE, results, failures, model: "minimal-banner" };
  writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) {
    console.error(`FAIL ${failures.length}`);
    process.exit(1);
  }
  console.log("mushaf-banner-density-gate: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
