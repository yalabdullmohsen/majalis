#!/usr/bin/env node
/**
 * بوابة مطابقة المراجع ٣١١ / ٦٠٠ / ٦٠١ — شبكة + شارة + رأس سور.
 *
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/quran-import/mushaf-ref-parity-gate.mjs
 */
import { chromium } from "playwright";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const BASE =
  process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") ||
  "https://majlisilm.com";
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR ||
  join(ROOT, ".local/mushaf-ref-parity");
const GRID_PATH = join(ROOT, "src/features/mushaf/mushaf-grid.json");
const VIEWPORT = { width: 390, height: 844 };
const PAGES = [1, 2, 3, 4, 100, 283, 311, 400, 500, 586, 596, 599, 600, 601, 604];
const MAX_BASELINE_DEV_PX = 2;
const MAX_DEAD_GAP_PCT = 6;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function measurePage(page, pageNum, grid) {
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

  const metrics = await page.evaluate((baselinesPct) => {
    const linesRoot = document.querySelector(".mf2-lines");
    const header = document.querySelector(".mpv-ayah-header");
    const footer = document.querySelector(".mpv-ayah-footer");
    const surahHeader = document.querySelector(".mpv-ayah-header__surah");
    if (!linesRoot || !header || !footer) return { error: "missing chrome" };
    const cr = linesRoot.getBoundingClientRect();
    const blockH = Math.max(1, cr.height);
    const slots = [...linesRoot.querySelectorAll("[data-grid-slot]")];
    const deviations = [];
    for (const el of slots) {
      const slot = Number(el.getAttribute("data-grid-slot"));
      const expected = baselinesPct[slot - 1];
      if (expected == null) continue;
      const r = el.getBoundingClientRect();
      const centerY = r.top + r.height / 2;
      const actualPct = ((centerY - cr.top) / blockH) * 100;
      const devPx = Math.abs(actualPct - expected) * (blockH / 100);
      deviations.push({ slot, expected, actualPct, devPx });
    }
    const maxDev = deviations.reduce((m, d) => Math.max(m, d.devPx), 0);

    let contentTop = Infinity;
    let contentBot = -Infinity;
    for (const el of slots) {
      const r = el.getBoundingClientRect();
      if (r.height <= 0) continue;
      contentTop = Math.min(contentTop, r.top);
      contentBot = Math.max(contentBot, r.bottom);
    }
    const hr = header.getBoundingClientRect();
    const fr = footer.getBoundingClientRect();
    const slotH = Math.max(1, fr.top - hr.bottom);
    const topDead = Number.isFinite(contentTop)
      ? Math.max(0, (contentTop - hr.bottom) / slotH) * 100
      : 100;
    const midDead = Number.isFinite(contentTop) && Number.isFinite(contentBot)
      ? Math.max(0, (slotH - (contentBot - contentTop) - (contentTop - hr.bottom)) / slotH) * 100
      : 100;

    /* أكبر فراغ متصل داخل الكتلة بين عناصر مرتّبة */
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
      maxGapPct = Math.max(
        maxGapPct,
        ((ordered[0].top - cr.top) / blockH) * 100,
      );
    }

    const banner = linesRoot.querySelector(".mf2-surah-banner");
    let bannerTopPct = null;
    let wingOk = null;
    if (banner) {
      const br = banner.getBoundingClientRect();
      bannerTopPct = ((br.top - cr.top) / blockH) * 100;
      const svg = banner.querySelector("svg");
      const medallions =
        svg?.querySelectorAll('[data-wing-part="medallion"]').length ?? 0;
      const meshes =
        svg?.querySelectorAll('[data-wing-part="mesh"]').length ?? 0;
      const knots = svg?.querySelectorAll('[data-wing-part="knot"]').length ?? 0;
      const patterns = svg?.querySelectorAll("pattern").length ?? 0;
      const dense =
        (banner.getAttribute("data-ornament") || "").includes("wing-dense");
      wingOk =
        patterns === 0 &&
        dense &&
        medallions === 2 &&
        meshes === 4 &&
        knots === 2;
    }

    return {
      maxDev,
      deviations,
      topDead,
      midDead,
      maxGapPct,
      bannerTopPct,
      wingOk,
      headerSurah: (surahHeader?.textContent || "").replace(/[\u00A0]/g, " ").replace(/ +/g, (m) => m.length >= 2 ? "  " : " ").trim(),
      slotCount: slots.length,
      blockH,
      ornament: banner?.getAttribute("data-ornament") || null,
    };
  }, grid.baselinesPct);

  const shotPath = join(OUT_DIR, `page-${String(pageNum).padStart(3, "0")}.png`);
  await page.locator(".qs-mushaf-body-inner, .mf2-lines").first().screenshot({
    path: shotPath,
  });
  return { pageNum, shotPath, ...metrics };
}

function expectedHeader(pageNum) {
  /* أسماء بدون «سورة» — فاصل مسافتان في المصدر */
  if (pageNum === 311) return "مريم";
  if (pageNum === 600) return "القارعة  التكاثر";
  if (pageNum === 601) return "العصر  الهمزة  الفيل";
  return null;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const grid = JSON.parse(readFileSync(GRID_PATH, "utf8"));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
  const results = [];
  const failures = [];

  for (const n of PAGES) {
    try {
      const r = await measurePage(page, n, grid);
      results.push(r);
      if (r.error) {
        failures.push({ page: n, reason: r.error });
        continue;
      }
      if (r.maxDev > MAX_BASELINE_DEV_PX) {
        failures.push({
          page: n,
          reason: `انحراف خط أساس ${r.maxDev.toFixed(2)}px > ${MAX_BASELINE_DEV_PX}`,
        });
      }
      const opening = n === 1 || n === 2;
      if (!opening && r.maxGapPct > MAX_DEAD_GAP_PCT) {
        failures.push({
          page: n,
          reason: `فراغ متصل ${r.maxGapPct.toFixed(1)}% > ${MAX_DEAD_GAP_PCT}%`,
        });
      }
      if (opening && r.bannerTopPct != null) {
        if (r.bannerTopPct < 2 || r.bannerTopPct > 14) {
          failures.push({
            page: n,
            reason: `أعلى الشارة ${r.bannerTopPct.toFixed(1)}% خارج 2–14% (افتتاح/ضلع علوي)`,
          });
        }
      }
      if (r.wingOk === false) {
        failures.push({
          page: n,
          reason: "عناصر الجناح ≠ ميدالية+شبكة+عقدة (wing-dense)",
        });
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
    grid,
    results: results.map((r) => ({
      page: r.pageNum,
      maxDevPx: r.maxDev,
      maxGapPct: r.maxGapPct,
      bannerTopPct: r.bannerTopPct,
      wingOk: r.wingOk,
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
