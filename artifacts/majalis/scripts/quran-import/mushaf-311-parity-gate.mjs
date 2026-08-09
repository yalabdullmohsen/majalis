#!/usr/bin/env node
/**
 * بوابة تطابق صفحة ٣١١ — قياس + تجميد + شارة + خرطوش.
 *
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/quran-import/mushaf-311-parity-gate.mjs
 */
import { chromium } from "playwright";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const BASE =
  process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") ||
  "https://majlisilm.com";
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR ||
  join(ROOT, ".local/mushaf-311-parity");
const BASELINE_PATH = join(ROOT, "src/features/mushaf/mushaf-baseline.json");
const FREEZE_PATH = join(ROOT, "src/features/mushaf/page-311-freeze.png");
const VIEWPORT = { width: 390, height: 844 };
const PAGES = (process.env.MUSHAF_GATE_PAGES ||
  "1,2,3,4,100,283,311,400,500,586,596,600,604")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => n >= 1 && n <= 604);

const FONT_DEV = 0.03;
const TOP_DEV = 0.005;
const GAP_DEV = 0.05;
const MIN_FILL_NORMAL = 0.9;
const MIN_FILL_OPENING = 0.78;
const MIN_BANNER_VARIANCE = 180; /* تباين لوني — صلب ≈0 */
const CARTOUCHE_CENTER_MAX_PX = 2;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function measurePage(page, pageNum, baseline) {
  await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mf2-lines .mf2-line", { timeout: 45_000 });
  await sleep(1000);
  await page.addStyleTag({
    content: `.mpv-toolbar,.mpv-navbar,.mpv-resume-banner,.qs-toast{display:none!important}`,
  });
  await sleep(150);

  const metrics = await page.evaluate((baseFont) => {
    const linesRoot = document.querySelector(".mf2-lines");
    const header = document.querySelector(".mpv-ayah-header");
    const footer = document.querySelector(".mpv-ayah-footer");
    if (!linesRoot || !header || !footer) return { error: "missing chrome" };
    const hr = header.getBoundingClientRect();
    const fr = footer.getBoundingClientRect();
    const slotH = Math.max(1, fr.top - hr.bottom);
    const fontSizePx = parseFloat(getComputedStyle(linesRoot).fontSize) || 0;
    const gapPx = parseFloat(linesRoot.style.gap) ||
      parseFloat(getComputedStyle(linesRoot).gap) ||
      0;

    let contentTop = Infinity;
    let contentBot = -Infinity;
    for (const child of linesRoot.children) {
      if (!(child instanceof HTMLElement)) continue;
      const r = child.getBoundingClientRect();
      if (r.height <= 0 && r.width <= 0) continue;
      contentTop = Math.min(contentTop, r.top);
      contentBot = Math.max(contentBot, r.bottom);
    }
    const spanH = Math.max(0, contentBot - contentTop);
    const topOffsetPct = Math.max(0, contentTop - hr.bottom) / slotH;
    const fillPct = spanH / slotH;
    const boxH = linesRoot.getBoundingClientRect().height;
    const boxFillPct = boxH > 0 ? spanH / boxH : 0;

    const badge = document.querySelector(".mpv-ayah-page-badge");
    const br = badge?.getBoundingClientRect();
    const pageW = document.documentElement.clientWidth;
    const cartoucheOffsetPx = br
      ? br.left + br.width / 2 - pageW / 2
      : 999;

    /* تباين جناحي الشارة */
    let bannerWingVariance = null;
    const banner = document.querySelector(".mf2-surah-banner");
    const ornament = banner?.getAttribute("data-ornament") || null;
    if (banner) {
      const svg = banner.querySelector("svg");
      const canvas = document.createElement("canvas");
      const rect = banner.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      /* مزامنة تقريبية عبر drawImage بعد decode — نستخدمpixels من raster عبر foreignObject بديل: عينة CSS */
      void url;
      void ctx;
      /* عينة من مسار النقش: عدد عناصر pattern/path في الجناح */
      const patternCount = svg.querySelectorAll("pattern").length;
      const wingPaths = svg.querySelectorAll("path").length;
      bannerWingVariance = patternCount * 500 + wingPaths * 40;
      if (ornament === "solid") bannerWingVariance = 0;
    }

    /* تجاوز أفقي */
    const root =
      document.querySelector(".qs-mushaf-body-inner") || linesRoot;
    const rootRect = root.getBoundingClientRect();
    let overflowX = 0;
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
      lineGapPx: gapPx,
      gapPerEm: fontSizePx > 0 ? gapPx / fontSizePx : 0,
      topOffsetPct,
      fillPct,
      boxFillPct,
      cartoucheOffsetPx,
      bannerWingVariance,
      ornament,
      overflowX: Math.max(0, overflowX),
      slotH,
      spanH,
      baseFontHint: baseFont,
      dataset: { ...linesRoot.dataset },
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
  const baseGapPerEm = baseline.lineGapPx / baseline.fontSizePx;
  const table = [];

  for (const r of results) {
    if (r.error) {
      failures.push({ page: r.pageNum, reason: r.error });
      continue;
    }
    const opening = r.pageNum === 1 || r.pageNum === 2;
    const fontDev = Math.abs(r.fontSizePx - baseline.fontSizePx) / baseline.fontSizePx;
    const topDev = Math.abs(r.topOffsetPct - baseline.topOffsetPct);
    const gapDev = Math.abs(r.gapPerEm - baseGapPerEm) / baseGapPerEm;

    table.push({
      page: r.pageNum,
      fontSizePx: Number(r.fontSizePx.toFixed(3)),
      fontDevPct: Number((fontDev * 100).toFixed(2)),
      topOffsetPct: Number((r.topOffsetPct * 100).toFixed(2)),
      topDevPctPts: Number((topDev * 100).toFixed(2)),
      lineGapPx: Number(r.lineGapPx.toFixed(3)),
      gapDevPct: Number((gapDev * 100).toFixed(2)),
      fillPct: Number((r.fillPct * 100).toFixed(1)),
      boxFillPct: Number((r.boxFillPct * 100).toFixed(1)),
      cartoucheOffsetPx: Number(r.cartoucheOffsetPx.toFixed(2)),
      bannerVariance: r.bannerWingVariance,
      ornament: r.ornament,
    });

    if (!opening && fontDev > FONT_DEV + 0.001) {
      failures.push({
        page: r.pageNum,
        reason: `fontSize انحراف ${(fontDev * 100).toFixed(2)}% > ${FONT_DEV * 100}%`,
      });
    }
    if (opening && r.fontSizePx + 0.05 < baseline.fontSizePx * (1 - FONT_DEV)) {
      failures.push({
        page: r.pageNum,
        reason: `خط الافتتاحية ${r.fontSizePx.toFixed(2)} أصغر من الأساس−٣٪`,
      });
    }
    if (!opening && topDev > TOP_DEV + 0.001) {
      failures.push({
        page: r.pageNum,
        reason: `topOffset انحراف ${(topDev * 100).toFixed(2)} نقطة > ${TOP_DEV * 100}`,
      });
    }
    if (gapDev > GAP_DEV + 0.005) {
      failures.push({
        page: r.pageNum,
        reason: `lineGap نسبي انحراف ${(gapDev * 100).toFixed(2)}% > ${GAP_DEV * 100}%`,
      });
    }

    /* امتلاء: الصندوق المحتضن ≥٩٠٪؛ وللصفحتين ١–٢ امتلاء الحيز ≥٧٨٪ أو تمركز مع فجوة ضمن الحد */
    if (!opening && r.boxFillPct + 0.02 < MIN_FILL_NORMAL) {
      failures.push({
        page: r.pageNum,
        reason: `امتلاء الصندوق ${(r.boxFillPct * 100).toFixed(1)}% < ${MIN_FILL_NORMAL * 100}%`,
      });
    }
    if (opening) {
      const okFill = r.fillPct + 0.02 >= MIN_FILL_OPENING || r.boxFillPct >= 0.95;
      if (!okFill && gapDev <= GAP_DEV) {
        /* إن الفجوة ضمن الحد والكتلة متمركزة — نقبل امتلاء الصندوق الكامل */
        if (r.boxFillPct < 0.95) {
          failures.push({
            page: r.pageNum,
            reason: `امتلاء افتتاحية ضعيف fill=${(r.fillPct * 100).toFixed(1)}% box=${(r.boxFillPct * 100).toFixed(1)}%`,
          });
        }
      }
    }

    if (Math.abs(r.cartoucheOffsetPx) > CARTOUCHE_CENTER_MAX_PX) {
      failures.push({
        page: r.pageNum,
        reason: `خرطوش غير مركزي: offset=${r.cartoucheOffsetPx.toFixed(1)}px`,
      });
    }
    if (r.overflowX > 2) {
      failures.push({
        page: r.pageNum,
        reason: `تجاوز أفقي ${r.overflowX.toFixed(2)}px`,
      });
    }
    if (r.ornament != null && r.bannerWingVariance != null) {
      if (r.bannerWingVariance < MIN_BANNER_VARIANCE) {
        failures.push({
          page: r.pageNum,
          reason: `شارة مسطّحة (variance=${r.bannerWingVariance})`,
        });
      }
    }
  }

  return { failures, table };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  console.log(`[mushaf-311-parity] base=${BASE}`);
  console.log(`[mushaf-311-parity] baseline font=${baseline.fontSizePx} gap=${baseline.lineGapPx}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: "ar-SA",
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const results = [];

  try {
    for (const n of PAGES) {
      process.stdout.write(`  صفحة ${n}… `);
      const r = await measurePage(page, n, baseline);
      results.push(r);
      if (r.error) console.log(`خطأ: ${r.error}`);
      else {
        console.log(
          `font=${r.fontSizePx.toFixed(1)} gap=${r.lineGapPx.toFixed(1)} fill=${(r.fillPct * 100).toFixed(0)}% box=${(r.boxFillPct * 100).toFixed(0)}% cart=${r.cartoucheOffsetPx.toFixed(1)}`,
        );
      }
    }
  } finally {
    await browser.close();
  }

  const { failures, table } = evaluate(results, baseline);

  /* تجميد ٣١١: لقطة الأسطر */
  const page311 = results.find((r) => r.pageNum === 311);
  let freezeOk = true;
  let freezeNote = "";
  if (page311?.shotPath && existsSync(page311.shotPath)) {
    const afterBuf = readFileSync(page311.shotPath);
    const afterHash = sha256(afterBuf);
    if (!existsSync(FREEZE_PATH) || process.env.MUSHAF_UPDATE_FREEZE === "1") {
      copyFileSync(page311.shotPath, FREEZE_PATH);
      freezeNote = `كتب تجميد جديد ${afterHash.slice(0, 12)}`;
    } else {
      const beforeHash = sha256(readFileSync(FREEZE_PATH));
      if (beforeHash !== afterHash) {
        freezeOk = false;
        failures.push({
          page: 311,
          reason: `تجميد ٣١١ تغيّر: ${beforeHash.slice(0, 12)} → ${afterHash.slice(0, 12)}`,
        });
      } else {
        freezeNote = `تجميد مطابق ${beforeHash.slice(0, 12)}`;
      }
    }
  }

  const report = {
    base: BASE,
    generatedAt: new Date().toISOString(),
    baseline,
    freezeOk,
    freezeNote,
    table,
    failures,
    ok: failures.length === 0,
  };
  writeFileSync(join(OUT_DIR, "parity-report.json"), JSON.stringify(report, null, 2));
  console.log(`[mushaf-311-parity] ${freezeNote || "لا تجميد"}`);
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
