#!/usr/bin/env node
/**
 * بوابة شارة السورة البسيطة: بلا أرابيسك · شريط عاجي · ارتفاع خانة ±٥٪ · موضع ص١–٢.
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
  resolveGatePages,
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
const BANNER_PAGES = [1, 2, 599, 600, 601];
const GRID_PAGES = [3, 4, 100, 283, 306, 400, 500, 588, 596, 599, 600, 601, 604];
/** الشارة البسيطة (simple-strip) — لا كثافة جناح */
const SIMPLE_STRIP = "simple-strip";
const TAN = { r: 227, g: 210, b: 180 };
/* أقل من مسافة حشو الميدالية (#EDE0C4≈٢٣) حتى يُحسب الحشو حبرًا */
const TAN_DIST = 20;

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

  return page.evaluate(
    ({ tan, tanDist, baselinesPct, slotHeightPct }) => {
      const lines = __mushafLinesRoot();
      const header = document.querySelector(".mpv-ayah-header");
      const footer = document.querySelector(".mpv-ayah-footer");
      if (!lines || !header || !footer) return { error: "missing chrome" };
      const hr = header.getBoundingClientRect();
      const fr = footer.getBoundingClientRect();
      const lr = lines.getBoundingClientRect();
      const blockH = Math.max(1, lr.height);
      const slotH = Math.max(1, fr.top - hr.bottom);

      const banner = lines.querySelector(".mf2-surah-banner");
      let density = null;
      let bannerTopPct = null;
      let bannerHRatio = null;
      let ornament = null;
      let wingOk = null;

      if (banner) {
        ornament = banner.getAttribute("data-ornament");
        const br = banner.getBoundingClientRect();
        bannerTopPct = ((br.top - lr.top) / blockH) * 100;
        const expectedSlotH = blockH * (slotHeightPct / 100);
        bannerHRatio = expectedSlotH > 0 ? br.height / expectedSlotH : 0;

        const svg = banner.querySelector("svg");
        const patterns = svg?.querySelectorAll("pattern").length ?? 0;
        const medallions =
          svg?.querySelectorAll('[data-wing-part="medallion"]').length ?? 0;
        const meshes =
          svg?.querySelectorAll('[data-wing-part="mesh"]').length ?? 0;
        const spirals =
          svg?.querySelectorAll('[data-wing-part="spiral"]').length ?? 0;
        const knots =
          svg?.querySelectorAll('[data-wing-part="knot"]').length ?? 0;
        wingOk =
          patterns === 0 &&
          medallions === 0 &&
          spirals === 0 &&
          knots === 0 &&
          meshes === 0 &&
          ornament === "simple-strip" &&
          !!banner.querySelector(".mf2-surah-banner__bar");

        /* الشريط البسيط: لا قياس كثافة جناح */
        density = null;
      }

      /* انحراف خطوط الأساس — أسطر الآيات فقط (الشارة/البسملة تُزاح عمداً) */
      let maxDev = 0;
      for (const el of lines.querySelectorAll(".mf2-grid-slot--line[data-grid-slot]")) {
        const slot = Number(el.getAttribute("data-grid-slot"));
        const expected = baselinesPct[slot - 1];
        if (expected == null) continue;
        const r = el.getBoundingClientRect();
        const centerY = r.top + r.height / 2;
        const actualPct = ((centerY - lr.top) / blockH) * 100;
        maxDev = Math.max(maxDev, Math.abs(actualPct - expected) * (blockH / 100));
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
        maxGapPct = Math.max(
          maxGapPct,
          ((ordered[0].top - lr.top) / blockH) * 100,
        );
      }

      return {
        densityMeta: density,
        bannerTopPct,
        bannerHRatio,
        ornament,
        wingOk,
        maxDev,
        maxGapPct,
        slotH,
        blockH,
      };
    },
    {
      tan: TAN,
      tanDist: TAN_DIST,
      baselinesPct: GRID.baselinesPct,
      slotHeightPct: GRID.slotHeightPct,
    },
  );
}

async function rasterDensity(page, meta) {
  if (!meta?.xml) return null;
  return page.evaluate(async (m) => {
    /* تضمين ألوان CSS vars — Image لا يرث متغيرات الوثيقة */
    let xml = m.xml
      .replace(/var\(--color-mushaf-ornament-bg[^)]*\)/g, "#E3D2B4")
      .replace(/var\(--color-mushaf-ornament-mid[^)]*\)/g, "#EDE0C4")
      .replace(/var\(--color-mushaf-ornament-line[^)]*\)/g, "#FFFFFF")
      .replace(/var\(--color-mushaf-gold-strong[^)]*\)/g, "#A67C3D")
      .replace(/var\(--color-mushaf-panel[^)]*\)/g, "#FAF3E8");
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = m.scale;
    const full = document.createElement("canvas");
    full.width = Math.floor(320 * scale);
    full.height = Math.floor(m.vbH * scale);
    const fctx = full.getContext("2d");
    /* أرضية تان صريحة قبل الرسم حتى لا تُحسب الشفافية حبرًا */
    fctx.fillStyle = `rgb(${m.tan.r},${m.tan.g},${m.tan.b})`;
    fctx.fillRect(0, 0, full.width, full.height);
    fctx.drawImage(img, 0, 0, full.width, full.height);
    const w = Math.max(1, Math.floor(m.wingW * scale));
    const h = Math.max(1, Math.floor((m.wingH ?? m.vbH) * scale));
    const x = Math.max(0, Math.floor(m.wingX * scale));
    const y = Math.max(0, Math.floor((m.wingY ?? 0) * scale));
    const data = fctx.getImageData(x, y, w, h).data;
    let ink = 0;
    const total = w * h;
    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i] - m.tan.r;
      const dg = data[i + 1] - m.tan.g;
      const db = data[i + 2] - m.tan.b;
      if (Math.hypot(dr, dg, db) > m.tanDist) ink += 1;
    }
    return ink / total;
  }, meta);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });
  const results = [];
  const failures = [];

  const allPages = [...new Set([...BANNER_PAGES, ...GRID_PAGES])].sort(
    (a, b) => a - b,
  );

  for (const n of allPages) {
    try {
      const raw = await measureBanner(page, n);
      if (raw.error) {
        failures.push({ page: n, reason: raw.error });
        continue;
      }
      let density = null;
      if (raw.densityMeta) {
        density = await rasterDensity(page, raw.densityMeta);
      }
      const shot = join(OUT_DIR, `page-${String(n).padStart(3, "0")}.png`);
      await page.locator(".qs-mushaf-body-inner, .mf2-lines").first().screenshot({
        path: shot,
      });

      const row = {
        page: n,
        density,
        bannerTopPct: raw.bannerTopPct,
        bannerHRatio: raw.bannerHRatio,
        ornament: raw.ornament,
        wingOk: raw.wingOk,
        maxDevPx: raw.maxDev,
        maxGapPct: raw.maxGapPct,
        shot,
      };
      results.push(row);

      if (BANNER_PAGES.includes(n)) {
        if (raw.ornament !== SIMPLE_STRIP) {
          failures.push({ page: n, reason: `شارة ليست simple-strip (got ${raw.ornament})` });
        }
        if (raw.wingOk === false) {
          failures.push({ page: n, reason: "زخارف متبقية أو شريط بسيط ناقص" });
        }
        if (raw.bannerHRatio != null && n !== 1 && n !== 2) {
          if (raw.bannerHRatio < 0.95 || raw.bannerHRatio > 1.05) {
            failures.push({
              page: n,
              reason: `ارتفاع الشارة ${(raw.bannerHRatio * 100).toFixed(1)}% من الخانة (المطلوب ±٥٪)`,
            });
          }
        }
        if ((n === 1 || n === 2) && raw.bannerTopPct != null) {
          /* ص١–٢: أعلى الشارة ١٤–١٨٪ من contentBand */
          if (raw.bannerTopPct < 14 || raw.bannerTopPct > 18) {
            failures.push({
              page: n,
              reason: `أعلى الشارة ${raw.bannerTopPct.toFixed(1)}% خارج 14–18% (افتتاح)`,
            });
          }
        }
      }

      if (GRID_PAGES.includes(n) && raw.maxDev > 2) {
        failures.push({
          page: n,
          reason: `انحراف خط أساس ${raw.maxDev.toFixed(2)}px > 2`,
        });
      }
      const opening = n === 1 || n === 2;
      if (!opening && GRID_PAGES.includes(n) && raw.maxGapPct > 6) {
        failures.push({
          page: n,
          reason: `فراغ متصل ${raw.maxGapPct.toFixed(1)}% > 6%`,
        });
      }
    } catch (e) {
      failures.push({ page: n, reason: String(e?.message || e) });
    }
  }

  await browser.close();
  const report = { base: BASE, results, failures };
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
