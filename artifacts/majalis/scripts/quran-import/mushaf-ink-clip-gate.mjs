#!/usr/bin/env node
/**
 * بوابة منع اقتطاع الحبر: لا يلامس حبر أي سطر حافة حاويته (±٢px) على ٦٠٤ صفحة.
 * كذلك يفحص إطار ص١–٢ (≥٨٠٪) وتجميد الانحراف/الفراغ على الصفحات المرجعية.
 *
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/quran-import/mushaf-ink-clip-gate.mjs
 *   MUSHAF_GATE_PAGES=1,2,3,306 node ...
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const BASE =
  process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") ||
  "https://majlisilm.com";
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-ink-clip");
const GRID = JSON.parse(
  readFileSync(join(ROOT, "src/features/mushaf/mushaf-grid.json"), "utf8"),
);
const VIEWPORT = { width: 390, height: 844 };
const CLEARANCE_PX = 2;
const FREEZE_PAGES = [3, 7, 283, 306, 588, 599, 600, 601];
const GRID_SAMPLE_PAGES = [3, 4, 7, 100, 283, 306, 400, 500, 588, 596, 599, 600, 601, 604];
const MAX_BASELINE_DEV_PX = 2;
const MAX_DEAD_GAP_PCT = 6;
const OPENING_FRAME_MIN_PCT = 80;
const SURAH_END_MAX_RATIO = 0.9;

function allPages() {
  const arg = process.env.MUSHAF_GATE_PAGES;
  if (arg) {
    return arg
      .split(",")
      .map(Number)
      .filter((n) => n >= 1 && n <= 604);
  }
  return Array.from({ length: 604 }, (_, i) => i + 1);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function measurePage(page, pageNum) {
  await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mf2-lines[data-mf2-size], .mf2-lines", {
    timeout: 45_000,
  });
  await sleep(pageNum <= 3 || FREEZE_PAGES.includes(pageNum) ? 1100 : 500);
  await page.addStyleTag({
    content: `.mpv-toolbar,.mpv-navbar,.mpv-resume-banner,.qs-toast{display:none!important}`,
  });
  await sleep(60);

  return page.evaluate(
    ({ clearance, baselinesPct, pageNum: n }) => {
      const linesRoot = document.querySelector(".mf2-lines");
      if (!linesRoot) return { error: "missing .mf2-lines" };
      const lr = linesRoot.getBoundingClientRect();
      const blockH = Math.max(1, lr.height);
      const opening = n === 1 || n === 2;

      const clipStyles = [];
      for (const sel of [".mf2-line", ".mf2-grid-slot", ".mf2-lines", ".qs-mushaf-body--ayah"]) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const cs = getComputedStyle(el);
        const oy = cs.overflowY;
        const o = cs.overflow;
        const badY =
          oy === "hidden" ||
          oy === "clip" ||
          oy === "scroll" ||
          oy === "auto" ||
          o === "hidden" ||
          o === "clip";
        if (badY || (cs.clipPath && cs.clipPath !== "none")) {
          clipStyles.push({
            sel,
            overflow: o,
            overflowY: oy,
            clipPath: cs.clipPath,
          });
        }
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const clipped = [];

      function inkClearance(el, slotEl) {
        const sr = slotEl.getBoundingClientRect();
        const box = el.getBoundingClientRect();
        if (sr.height < 4 || box.width < 2) return null;
        const cs = getComputedStyle(el);
        const text = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (!text) return null;
        ctx.font = cs.font;
        const m = ctx.measureText(text);
        const ascent =
          m.actualBoundingBoxAscent ||
          m.fontBoundingBoxAscent ||
          parseFloat(cs.fontSize) * 0.95;
        const descent =
          m.actualBoundingBoxDescent ||
          m.fontBoundingBoxDescent ||
          parseFloat(cs.fontSize) * 0.45;
        const baselineY = box.top + box.height / 2 + (ascent - descent) / 2;
        const inkTop = baselineY - ascent;
        const inkBot = baselineY + descent;
        return {
          topClear: inkTop - sr.top,
          botClear: sr.bottom - inkBot,
          inkTop,
          inkBot,
          slotH: sr.height,
          inkH: ascent + descent,
        };
      }

      for (const slot of linesRoot.querySelectorAll(".mf2-grid-slot--line")) {
        const line = slot.querySelector(".mf2-line");
        if (!line) continue;
        const c = inkClearance(line, slot);
        if (!c) continue;
        if (c.topClear < clearance || c.botClear < clearance) {
          clipped.push({
            kind: "line",
            line: Number(line.getAttribute("data-line") || 0),
            topClear: +c.topClear.toFixed(2),
            botClear: +c.botClear.toFixed(2),
            slotH: +c.slotH.toFixed(2),
            inkH: +c.inkH.toFixed(2),
          });
        }
      }

      /* البسملة — كانت مستثناة سابقًا فمرّ الاقتطاع */
      for (const slot of linesRoot.querySelectorAll(".mf2-grid-slot--basmala")) {
        const bas = slot.querySelector(".mf2-bismillah");
        if (!bas) continue;
        const c = inkClearance(bas, slot);
        if (!c) continue;
        if (c.topClear < clearance || c.botClear < clearance) {
          clipped.push({
            kind: "basmala",
            topClear: +c.topClear.toFixed(2),
            botClear: +c.botClear.toFixed(2),
          });
        }
      }

      /* الشارة — لا يُقصّ اسم السورة داخل إطارها */
      for (const slot of linesRoot.querySelectorAll(".mf2-grid-slot--banner")) {
        const name =
          slot.querySelector(".mf2-surah-banner__name, .mf2-surah-header__name") ||
          slot.querySelector("text, .mf2-surah-banner");
        if (!name) continue;
        const sr = slot.getBoundingClientRect();
        const nr = name.getBoundingClientRect();
        if (nr.height < 2) continue;
        const topClear = nr.top - sr.top;
        const botClear = sr.bottom - nr.bottom;
        if (topClear < clearance || botClear < clearance) {
          clipped.push({
            kind: "banner",
            topClear: +topClear.toFixed(2),
            botClear: +botClear.toFixed(2),
          });
        }
      }

      /* فاصل حبر البسملة عن أسفل الشارة — زوج شارة↔بسملة بالخانة المتجاورة */
      const basmalaGaps = [];
      for (const banner of linesRoot.querySelectorAll(".mf2-grid-slot--banner")) {
        const banRect = banner.getBoundingClientRect();
        const banSlot = Number(banner.getAttribute("data-grid-slot"));
        let inkEl = linesRoot.querySelector(
          `.mf2-grid-slot--basmala[data-grid-slot="${banSlot + 1}"] .mf2-bismillah`,
        );
        if (!inkEl && n <= 2) {
          inkEl = linesRoot.querySelector(".mf2-grid-slot--line .mf2-line");
        }
        if (!inkEl) continue;
        const box = inkEl.getBoundingClientRect();
        const fs = parseFloat(getComputedStyle(inkEl).fontSize) || 24;
        /* أعلى الحبر ≈ مركز المرونة − نصف ارتفاع الحرف مع علامات */
        const inkH = fs * 1.2;
        const inkTop = box.top + Math.max(0, (box.height - inkH) / 2);
        const gap = inkTop - banRect.bottom;
        basmalaGaps.push(+gap.toFixed(2));
      }

      let framePct = null;
      let frameTopPct = null;
      let frameBotPct = null;
      const frame = linesRoot.querySelector("[data-opening-frame]");
      if (frame) {
        const fr = frame.getBoundingClientRect();
        framePct = (fr.height / blockH) * 100;
        frameTopPct = ((fr.top - lr.top) / blockH) * 100;
        frameBotPct = ((fr.bottom - lr.top) / blockH) * 100;
      }

      let maxDev = 0;
      if (!opening) {
        for (const el of linesRoot.querySelectorAll(".mf2-grid-slot--line[data-grid-slot]")) {
          const slot = Number(el.getAttribute("data-grid-slot"));
          const expected = baselinesPct[slot - 1];
          if (expected == null) continue;
          const r = el.getBoundingClientRect();
          const actualPct =
            ((r.top + r.height / 2 - lr.top) / blockH) * 100;
          maxDev = Math.max(
            maxDev,
            Math.abs(actualPct - expected) * (blockH / 100),
          );
        }
      }

      const ordered = [...linesRoot.querySelectorAll("[data-grid-slot]")]
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
      const gapLimit = opening ? 10 : 6;
      const gapFail = maxGapPct > gapLimit;

      const blockW = Math.max(1, lr.width);
      const surahEnds = [];
      for (const line of linesRoot.querySelectorAll(
        ".mf2-line--surah-end, .mf2-line[data-no-stretch='1']",
      )) {
        const r = line.getBoundingClientRect();
        const sxRaw = line.style.getPropertyValue("--mf2-line-sx");
        const sx = sxRaw ? parseFloat(sxRaw) : 1;
        const naturalRatio = sx > 1.01 ? r.width / sx / blockW : r.width / blockW;
        surahEnds.push({
          line: Number(line.getAttribute("data-line") || 0),
          ratio: r.width / blockW,
          naturalRatio,
          sx: Number.isFinite(sx) ? sx : 1,
        });
      }

      return {
        clipped,
        clipStyles,
        framePct,
        frameTopPct,
        frameBotPct,
        maxDev,
        maxGapPct,
        gapFail,
        gapLimit,
        surahEnds,
        basmalaGaps,
      };
    },
    { clearance: CLEARANCE_PX, baselinesPct: GRID.baselinesPct, pageNum },
  );
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const pages = allPages();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
  const results = [];
  const failures = [];
  let clippedTotal = 0;

  for (const n of pages) {
    try {
      const r = await measurePage(page, n);
      if (r.error) {
        failures.push({ page: n, reason: r.error });
        continue;
      }
      clippedTotal += r.clipped.length;
      if (r.clipStyles?.length) {
        failures.push({
          page: n,
          reason: `حاوية تقصّ رأسيًا: ${JSON.stringify(r.clipStyles[0])}`,
        });
      }
      if (r.clipped.length) {
        failures.push({
          page: n,
          reason: `${r.clipped.length} سطرًا بلا هامش ٢px (عيّنة: ${JSON.stringify(r.clipped.slice(0, 2))})`,
        });
      }
      if ((n === 1 || n === 2) && r.framePct != null) {
        failures.push({
          page: n,
          reason: `إطار افتتاح موجود (${r.framePct?.toFixed?.(1)}%) — يجب صفر`,
        });
      }
      if (n === 1 || n === 2) {
        /* لا فحوص نسب إطار — الإطار محذوف */
      }
      for (const g of r.basmalaGaps || []) {
        if (g < 20) {
          failures.push({
            page: n,
            reason: `فاصل حبر البسملة عن الشارة ${g}px < 20px`,
          });
        }
      }
      if (GRID_SAMPLE_PAGES.includes(n) && n > 2 && r.maxDev > MAX_BASELINE_DEV_PX) {
        failures.push({
          page: n,
          reason: `عيّنة شبكة ص٧: انحراف ${r.maxDev.toFixed(2)}px > ${MAX_BASELINE_DEV_PX}`,
        });
      }
      if (FREEZE_PAGES.includes(n) && r.gapFail) {
        failures.push({
          page: n,
          reason: `فراغ متصل ${r.maxGapPct.toFixed(1)}% > ${r.gapLimit}%`,
        });
      }
      for (const e of r.surahEnds || []) {
        const sx = e.sx ?? 1;
        if (sx > 1.02) {
          failures.push({
            page: n,
            reason: `آخر سطر سورة ${e.line} ما زال ممدودًا sx=${sx.toFixed(2)}`,
          });
        } else if ((e.naturalRatio ?? e.ratio) < SURAH_END_MAX_RATIO && e.ratio > SURAH_END_MAX_RATIO) {
          failures.push({
            page: n,
            reason: `آخر سطر سورة ${e.line} عُرض بالمطّ ${(e.ratio * 100).toFixed(1)}% > 90%`,
          });
        }
      }
      if ([1, 2, ...FREEZE_PAGES, ...GRID_SAMPLE_PAGES].includes(n)) {
        await page.locator(".mf2-lines").screenshot({
          path: join(OUT_DIR, `page-${String(n).padStart(3, "0")}.png`),
        });
      }
      results.push({
        page: n,
        clipped: r.clipped.length,
        framePct: r.framePct,
        frameTopPct: r.frameTopPct,
        frameBotPct: r.frameBotPct,
        maxDevPx: r.maxDev,
        maxGapPct: r.maxGapPct,
        surahEnds: r.surahEnds?.length ?? 0,
        basmalaGaps: r.basmalaGaps,
      });
    } catch (e) {
      failures.push({ page: n, reason: String(e?.message || e) });
    }
  }

  await browser.close();
  const report = {
    base: BASE,
    clearancePx: CLEARANCE_PX,
    clippedTotal,
    pages: pages.length,
    grid: GRID,
    results,
    failures,
  };
  writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) {
    console.error(`FAIL ${failures.length} (clipped lines total=${clippedTotal})`);
    process.exit(1);
  }
  console.log(`mushaf-ink-clip-gate: ok — 0 clipped on ${pages.length} pages`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
