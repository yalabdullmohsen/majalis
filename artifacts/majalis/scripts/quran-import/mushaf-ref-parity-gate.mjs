#!/usr/bin/env node
/**
 * بوابة مطابقة المراجع — شبكة تدفق + شارة بسيطة + S ثابت.
 * صفحات التجميد: 1,2,3,600,601,602,603 (+ عيّنة إضافية).
 *
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/quran-import/mushaf-ref-parity-gate.mjs
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
  join(ROOT, ".local/mushaf-ref-parity");
const BASELINE = JSON.parse(
  readFileSync(join(ROOT, "src/features/mushaf/mushaf-baseline.json"), "utf8"),
);
const VIEWPORT = { width: 390, height: 844 };
const PAGES = [1, 2, 3, 4, 100, 283, 311, 400, 500, 586, 596, 599, 600, 601, 602, 603, 604];
const MAX_DEAD_GAP_PCT = 8;
const FONT_TOL = 0.04;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function measurePage(page, pageNum) {
  await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mf2-lines [data-grid-slot], .mf2-lines .mf2-line", {
    timeout: 45_000,
  });
  await sleep(900);
  await page.addStyleTag({
    content: `.mpv-toolbar,.mpv-navbar,.mpv-resume-banner,.qs-toast{display:none!important}`,
  });
  await sleep(120);

  const metrics = await page.evaluate((expectedS) => {
    const linesRoot = __mushafLinesRoot();
    const header = document.querySelector(".mpv-ayah-header");
    const footer = document.querySelector(".mpv-ayah-footer");
    const surahHeader = document.querySelector(".mpv-ayah-header__surah");
    if (!linesRoot || !header || !footer) return { error: "missing chrome" };
    const cr = linesRoot.getBoundingClientRect();
    const blockH = Math.max(1, cr.height);
    const slots = [...linesRoot.querySelectorAll("[data-grid-slot]")];
    const gridMode = linesRoot.getAttribute("data-mushaf-grid");
    const board = linesRoot.getAttribute("data-board");

    const ordered = slots
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.height > 0)
      .sort((a, b) => a.top - b.top);
    let maxGapPct = 0;
    for (let i = 1; i < ordered.length; i++) {
      const gap = ordered[i].top - ordered[i - 1].bottom;
      maxGapPct = Math.max(maxGapPct, (gap / blockH) * 100);
    }
    if (ordered.length) {
      maxGapPct = Math.max(maxGapPct, ((ordered[0].top - cr.top) / blockH) * 100);
    }

    const banner = linesRoot.querySelector(".mf2-surah-banner");
    const ornament = banner?.getAttribute("data-ornament") || null;
    const bannerStyle = banner?.getAttribute("data-banner-style") || null;
    const hasWing =
      Boolean(banner?.querySelector('[data-wing-part], svg [data-wing-part]')) ||
      (ornament || "").includes("wing");

    const S =
      parseFloat(getComputedStyle(linesRoot).getPropertyValue("--mushaf-S")) ||
      parseFloat(getComputedStyle(linesRoot).fontSize) ||
      0;
    const lineFonts = [...linesRoot.querySelectorAll(".mf2-grid-slot--line .mf2-line")].map(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    );
    const absSlots = [...linesRoot.querySelectorAll(".mf2-grid-slot, .mf2-line")].filter(
      (el) => getComputedStyle(el).position === "absolute",
    ).length;

    return {
      gridMode,
      board,
      maxGapPct,
      ornament,
      bannerStyle,
      hasWing,
      S,
      expectedS,
      lineFonts,
      absSlots,
      headerSurah: (surahHeader?.textContent || "")
        .replace(/[\u00A0]/g, " ")
        .replace(/ +/g, (m) => (m.length >= 2 ? "  " : " "))
        .trim(),
      slotCount: slots.length,
      blockH,
    };
  }, BASELINE.fontSizePx);

  const shotPath = join(OUT_DIR, `page-${String(pageNum).padStart(3, "0")}.png`);
  await page.locator(".qs-mushaf-body-inner, .mf2-lines").first().screenshot({
    path: shotPath,
  });
  return { pageNum, shotPath, ...metrics };
}

function expectedHeader(pageNum) {
  if (pageNum === 311) return "مريم";
  if (pageNum === 600) return "القارعة  التكاثر";
  if (pageNum === 601) return "العصر  الهمزة  الفيل";
  return null;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });
  const results = [];
  const failures = [];

  for (const n of PAGES) {
    try {
      const r = await measurePage(page, n);
      results.push(r);
      if (r.error) {
        failures.push({ page: n, reason: r.error });
        continue;
      }
      if (r.gridMode !== "flow") {
        failures.push({ page: n, reason: `data-mushaf-grid=${r.gridMode} ≠ flow` });
      }
      if (r.board && r.board !== "1000x1618") {
        failures.push({ page: n, reason: `data-board=${r.board} ≠ 1000x1618` });
      }
      if (r.absSlots > 0) {
        failures.push({ page: n, reason: `${r.absSlots} slot/line absolute` });
      }
      const opening = n === 1 || n === 2;
      if (!opening && r.maxGapPct > MAX_DEAD_GAP_PCT) {
        failures.push({
          page: n,
          reason: `فراغ متصل ${r.maxGapPct.toFixed(1)}% > ${MAX_DEAD_GAP_PCT}%`,
        });
      }
      if (r.ornament != null && r.ornament !== "none") {
        failures.push({ page: n, reason: `ornament=${r.ornament} ≠ none` });
      }
      if (r.hasWing) {
        failures.push({ page: n, reason: "شارة ما زالت تحمل جناحًا زخرفيًا" });
      }
      if (r.S > 0) {
        const rel = Math.abs(r.S - BASELINE.fontSizePx) / BASELINE.fontSizePx;
        if (rel > FONT_TOL) {
          failures.push({
            page: n,
            reason: `S=${r.S.toFixed(2)} ≠ baseline ${BASELINE.fontSizePx} (±${FONT_TOL * 100}%)`,
          });
        }
      }
      const exp = expectedHeader(n);
      if (exp && r.headerSurah !== exp) {
        failures.push({
          page: n,
          reason: `رأس السور «${r.headerSurah}» ≠ «${exp}»`,
        });
      }
    } catch (e) {
      failures.push({ page: n, reason: String(e?.message || e) });
    }
  }

  await browser.close();

  const report = {
    base: BASE,
    baselineFont: BASELINE.fontSizePx,
    freezePages: [1, 2, 3, 600, 601, 602, 603],
    results: results.map((r) => ({
      page: r.pageNum,
      gridMode: r.gridMode,
      ornament: r.ornament,
      S: r.S,
      maxGapPct: r.maxGapPct,
      headerSurah: r.headerSurah,
      shot: r.shotPath,
    })),
    failures,
  };
  writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) {
    console.error(`FAIL ${failures.length} issue(s)`);
    process.exit(1);
  }
  console.log("mushaf-ref-parity-gate: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
