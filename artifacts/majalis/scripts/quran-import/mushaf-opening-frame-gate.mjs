#!/usr/bin/env node
/**
 * بوابة ضبط إطار صفحتي الافتتاح + آخر سطر سورة بلا مطّ + سلامة البسملة بلا رقم.
 *
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/quran-import/mushaf-opening-frame-gate.mjs
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
  process.env.MUSHAF_GATE_OUT_DIR ||
  join(ROOT, ".local/mushaf-opening-frame");
const VIEWPORT = { width: 390, height: 844 };
/** تجميد بصري — صفحة ٢٨٣ مرجع الامتلاء */
const FREEZE = [3, 7, 283, 306, 588, 599, 600, 601];
const GRID = JSON.parse(
  readFileSync(join(ROOT, "src/features/mushaf/mushaf-grid.json"), "utf8"),
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function measureOpening(page, pageNum) {
  await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mf2-lines", { timeout: 45_000 });
  await sleep(1100);
  await page.addStyleTag({
    content: `.mpv-toolbar,.mpv-navbar,.mpv-resume-banner,.qs-toast{display:none!important}`,
  });
  await sleep(80);

  return page.evaluate(() => {
    const root = document.querySelector(".mf2-lines");
    if (!root) return { error: "missing lines" };
    const body =
      document.querySelector(".mpv-body--ayah") ||
      document.querySelector(".qs-mushaf-body--ayah") ||
      root.parentElement;
    if (!body) return { error: "missing page body" };
    const lr = root.getBoundingClientRect();
    const br = body.getBoundingClientRect();
    /* المواصفة: نسب الإطار من كتلة الصفحة (.mpv-body--ayah) لا من .mf2-lines */
    const blockH = Math.max(1, br.height);
    const frame = root.querySelector("[data-opening-frame]");
    if (!frame) return { error: "missing opening frame" };
    const fr = frame.getBoundingClientRect();
    const framePct = (fr.height / blockH) * 100;
    const frameTopPct = ((fr.top - br.top) / blockH) * 100;
    const frameBotPct = ((fr.bottom - br.top) / blockH) * 100;
    const frameTopVsLinesPct = ((fr.top - lr.top) / Math.max(1, lr.height)) * 100;
    const frameBotVsLinesPct = ((fr.bottom - lr.top) / Math.max(1, lr.height)) * 100;

    const rails = frame.querySelectorAll('[data-opening-part="side-rail"] line');
    let sideStraight = rails.length >= 2;
    for (const line of rails) {
      const x1 = Number(line.getAttribute("x1"));
      const x2 = Number(line.getAttribute("x2"));
      if (Math.abs(x1 - x2) > 0.01) sideStraight = false;
    }

    const basmala = root.querySelector(".mf2-bismillah");
    const basmalaHasNumeral = Boolean(
      basmala?.querySelector(
        '.mf2-word--ayah-end, [data-ayah-numeral], .mf2-ayah-marker',
      ),
    );
    let basmalaFontPx = null;
    let ayahFontPx = null;
    if (basmala) {
      basmalaFontPx = parseFloat(getComputedStyle(basmala).fontSize);
    }
    const ayah = root.querySelector(".mf2-grid-slot--line .mf2-line");
    if (ayah) ayahFontPx = parseFloat(getComputedStyle(ayah).fontSize);

    const textBlockW = fr.width - 40 - 14;
    const widths = [];
    const surahEndWidths = [];
    for (const slot of root.querySelectorAll(".mf2-grid-slot--line")) {
      const line = slot.querySelector(".mf2-line");
      if (!line) continue;
      const r = line.getBoundingClientRect();
      const entry = {
        line: Number(line.getAttribute("data-line") || 0),
        w: r.width,
        ratio: textBlockW > 0 ? r.width / textBlockW : 0,
        noStretch:
          line.classList.contains("mf2-line--surah-end") ||
          line.getAttribute("data-no-stretch") === "1",
        natural: line.classList.contains("mf2-line--natural"),
      };
      widths.push(entry);
      if (entry.noStretch) surahEndWidths.push(entry);
    }

    /* فراغات داخل الإطار */
    const items = [...root.querySelectorAll("[data-grid-slot]")]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.height > 0)
      .sort((a, b) => a.top - b.top);
    let maxGapPct = 0;
    for (let i = 1; i < items.length; i++) {
      maxGapPct = Math.max(
        maxGapPct,
        ((items[i].top - items[i - 1].bottom) / fr.height) * 100,
      );
    }
    if (items.length) {
      maxGapPct = Math.max(
        maxGapPct,
        ((items[0].top - fr.top) / fr.height) * 100,
      );
      maxGapPct = Math.max(
        maxGapPct,
        ((fr.bottom - items[items.length - 1].bottom) / fr.height) * 100,
      );
    }

    /* مسافة حبر آخر سطر عن الضلع السفلي */
    let lastInkClearPx = null;
    const lastLine = [...root.querySelectorAll(".mf2-grid-slot--line .mf2-line")].at(-1);
    if (lastLine) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const cs = getComputedStyle(lastLine);
      ctx.font = cs.font;
      const text = (lastLine.textContent || "").trim();
      const m = ctx.measureText(text);
      const descent =
        m.actualBoundingBoxDescent ||
        m.fontBoundingBoxDescent ||
        parseFloat(cs.fontSize) * 0.45;
      const lineRect = lastLine.getBoundingClientRect();
      const ascent =
        m.actualBoundingBoxAscent ||
        m.fontBoundingBoxAscent ||
        parseFloat(cs.fontSize) * 0.95;
      const baselineY =
        lineRect.top + lineRect.height / 2 + (ascent - descent) / 2;
      const inkBot = baselineY + descent;
      lastInkClearPx = fr.bottom - inkBot;
    }

    let firstContentGapPct = null;
    const firstBody =
      root.querySelector(".mf2-grid-slot--basmala") ||
      root.querySelector(".mf2-grid-slot--line");
    if (firstBody) {
      firstContentGapPct =
        ((firstBody.getBoundingClientRect().top - fr.top) / fr.height) * 100;
    }

    /* فاصل حبر البسملة عن أسفل الشارة */
    let basmalaGapPx = null;
    const ban = root.querySelector(".mf2-grid-slot--banner");
    const basInk =
      root.querySelector(".mf2-bismillah") ||
      root.querySelector(".mf2-grid-slot--line .mf2-line");
    if (ban && basInk) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const cs = getComputedStyle(basInk);
      ctx.font = cs.font;
      const m = ctx.measureText((basInk.textContent || "").trim());
      const ascent =
        m.actualBoundingBoxAscent ||
        m.fontBoundingBoxAscent ||
        parseFloat(cs.fontSize) * 0.95;
      const descent =
        m.actualBoundingBoxDescent ||
        m.fontBoundingBoxDescent ||
        parseFloat(cs.fontSize) * 0.35;
      const box = basInk.getBoundingClientRect();
      const baselineY = box.top + box.height / 2 + (ascent - descent) / 2;
      basmalaGapPx = baselineY - ascent - ban.getBoundingClientRect().bottom;
    }

    return {
      framePct,
      frameTopPct,
      frameBotPct,
      frameTopVsLinesPct,
      frameBotVsLinesPct,
      bodyH: br.height,
      linesH: lr.height,
      datasetFrameTopBody: root.dataset.mf2FrameTopBody || null,
      datasetFrameBotBody: root.dataset.mf2FrameBotBody || null,
      sideStraight,
      rails: rails.length,
      basmalaHasNumeral,
      basmalaFontPx,
      ayahFontPx,
      basmalaGapPx,
      widths,
      surahEndWidths,
      targetW: textBlockW,
      maxGapPct,
      lastInkClearPx,
      firstContentGapPct,
      straightAttr: frame.getAttribute("data-side-rails"),
    };
  });
}

async function measureFreeze(page, pageNum) {
  await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mf2-lines", { timeout: 45_000 });
  await sleep(700);
  return page.evaluate((baselinesPct) => {
    const root = document.querySelector(".mf2-lines");
    if (!root) return { error: "missing" };
    const lr = root.getBoundingClientRect();
    const blockH = Math.max(1, lr.height);
    let maxDev = 0;
    let firstTopPct = null;
    let lastBotPct = null;
    const slots = [...root.querySelectorAll(".mf2-grid-slot--line[data-grid-slot]")];
    for (const el of slots) {
      const slot = Number(el.getAttribute("data-grid-slot"));
      const expected = baselinesPct[slot - 1];
      if (expected == null) continue;
      const r = el.getBoundingClientRect();
      const actualPct = ((r.top + r.height / 2 - lr.top) / blockH) * 100;
      maxDev = Math.max(maxDev, Math.abs(actualPct - expected) * (blockH / 100));
      const topPct = ((r.top - lr.top) / blockH) * 100;
      const botPct = ((r.bottom - lr.top) / blockH) * 100;
      if (firstTopPct == null || topPct < firstTopPct) firstTopPct = topPct;
      if (lastBotPct == null || botPct > lastBotPct) lastBotPct = botPct;
    }
    const fill =
      firstTopPct != null && lastBotPct != null
        ? (lastBotPct - firstTopPct) / 100
        : null;
    return { maxDev, firstTopPct, lastBotPct, fill };
  }, GRID.baselinesPct);
}

async function measureSurahEndWidths(page, pageNum) {
  await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mf2-lines", { timeout: 45_000 });
  await sleep(pageNum <= 3 ? 900 : 450);
  return page.evaluate(() => {
    const root = document.querySelector(".mf2-lines");
    if (!root) return { error: "missing" };
    const lr = root.getBoundingClientRect();
    const blockW = Math.max(1, lr.width);
    const ends = [];
    for (const line of root.querySelectorAll(
      ".mf2-line--surah-end, .mf2-line[data-no-stretch='1']",
    )) {
      const r = line.getBoundingClientRect();
      const sxRaw = line.style.getPropertyValue("--mf2-line-sx");
      const sx = sxRaw ? parseFloat(sxRaw) : 1;
      const naturalRatio = sx > 1.01 ? r.width / sx / blockW : r.width / blockW;
      ends.push({
        line: Number(line.getAttribute("data-line") || 0),
        ratio: r.width / blockW,
        naturalRatio,
        w: r.width,
        sx: Number.isFinite(sx) ? sx : 1,
        marked: line.classList.contains("mf2-line--surah-end"),
      });
    }
    return { ends, blockW };
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
  const failures = [];
  const results = [];

  if (GRID.referencePage !== 283) {
    failures.push({ page: 0, reason: `mushaf-grid.json referencePage=${GRID.referencePage} ≠ 283` });
  }

  const pageV2 = readFileSync(
    join(ROOT, "src/components/quran/MushafPageV2.tsx"),
    "utf8",
  );
  const basmalaCss = readFileSync(join(ROOT, "src/styles/mushaf-v2.css"), "utf8");
  if (/mf2-bismillah[\s\S]{0,400}ayah-end|mf2-bismillah[\s\S]{0,400}ayah-marker/.test(pageV2)) {
    failures.push({ page: 0, reason: "بسملة مربوطة بميدالية رقم في المكوّن" });
  }
  if (!/(?:^|\n)\.mf2-bismillah\s*\{[^}]*font-size:\s*1em/.test(basmalaCss)) {
    failures.push({ page: 0, reason: "بسملة ليست بمقاس 1em" });
  }
  if (!/(?:^|\n)\.mf2-bismillah\s*\{[^}]*font-weight:\s*700/.test(basmalaCss)) {
    failures.push({ page: 0, reason: "بسملة بلا font-weight:700" });
  }
  if (/if\s*\(\s*!isOpening\s*&&\s*noStretchLines/.test(pageV2)) {
    failures.push({ page: 0, reason: "آخر سطر سورة ما زال يُمدّ في صفحتي الافتتاح" });
  }
  if (!/\.mf2-line--surah-end/.test(basmalaCss)) {
    failures.push({ page: 0, reason: "CSS بلا .mf2-line--surah-end" });
  }
  const frameSrc = readFileSync(
    join(ROOT, "src/components/quran/OpeningPageFrame.tsx"),
    "utf8",
  );
  if (/SideScroll|amp\s*=\s*5\.5/.test(frameSrc)) {
    failures.push({ page: 0, reason: "أضلاع جانبية ما زالت متموّجة (SideScroll)" });
  }
  if (!/data-side-rails="straight"/.test(frameSrc)) {
    failures.push({ page: 0, reason: "إطار بلا data-side-rails=straight" });
  }

  for (const n of [1, 2]) {
    try {
      const r = await measureOpening(page, n);
      results.push({ page: n, ...r });
      await page.locator(".mf2-lines").screenshot({
        path: join(OUT_DIR, `page-${String(n).padStart(3, "0")}.png`),
      });
      if (r.error) {
        failures.push({ page: n, reason: r.error });
        continue;
      }
      if (r.frameTopPct < 7.95 || r.frameTopPct > 13.05) {
        failures.push({
          page: n,
          reason: `أعلى الإطار (من كتلة الصفحة) عند ${r.frameTopPct.toFixed(1)}% (المطلوب ٨–١٣٪)`,
        });
      }
      if (r.frameBotPct < 89.95 || r.frameBotPct > 92.05) {
        failures.push({
          page: n,
          reason: `أسفل الإطار (من كتلة الصفحة) عند ${r.frameBotPct.toFixed(1)}% (المطلوب ٩٠–٩٢٪)`,
        });
      }
      if (!r.sideStraight || r.straightAttr !== "straight") {
        failures.push({ page: n, reason: "أضلاع جانبية غير مستقيمة" });
      }
      if (r.basmalaHasNumeral) {
        failures.push({ page: n, reason: "بسملة عليها ميدالية رقم" });
      }
      if (r.basmalaGapPx != null && r.basmalaGapPx < 20) {
        failures.push({
          page: n,
          reason: `فاصل حبر البسملة عن الشارة ${r.basmalaGapPx.toFixed(1)}px < 20px`,
        });
      }
      if (
        r.basmalaFontPx != null &&
        r.ayahFontPx != null &&
        Math.abs(r.basmalaFontPx - r.ayahFontPx) / r.ayahFontPx > 0.02
      ) {
        failures.push({
          page: n,
          reason: `مقاس البسملة ${r.basmalaFontPx.toFixed(1)}px ≠ سطر الآية ${r.ayahFontPx.toFixed(1)}px (±٢٪)`,
        });
      }
      if (r.maxGapPct > 8) {
        failures.push({
          page: n,
          reason: `فراغ داخلي ${r.maxGapPct.toFixed(1)}% > 8%`,
        });
      }
      if (r.lastInkClearPx != null && r.lastInkClearPx < 24) {
        failures.push({
          page: n,
          reason: `هامش سفلي للحبر ${r.lastInkClearPx.toFixed(1)}px < 24px`,
        });
      }
      if (r.firstContentGapPct != null && r.firstContentGapPct > 14) {
        failures.push({
          page: n,
          reason: `أول محتوى بعد الإطار ${r.firstContentGapPct.toFixed(1)}% من ارتفاع الإطار`,
        });
      }
      for (const w of r.surahEndWidths || []) {
        /* نهاية سورة قصيرة يجب ألا تُمطّ لملء العرض؛ إن كان المحتوى طبيعيًا عريضًا فـ noStretch كافٍ */
        if (w.ratio > 0.9 && w.w < (r.targetW || 0) * 0.95) {
          failures.push({
            page: n,
            reason: `آخر سطر سورة ${w.line} عُرض بالمطّ ${(w.ratio * 100).toFixed(1)}% > 90%`,
          });
        }
      }
      for (const w of r.widths || []) {
        if (w.noStretch || w.natural) continue;
        if (Math.abs(w.ratio - 1) > 0.04) {
          failures.push({
            page: n,
            reason: `سطر ${w.line} عرض ${(w.ratio * 100).toFixed(1)}% من الداخل (المطلوب ±٤٪)`,
          });
        }
      }
    } catch (e) {
      failures.push({ page: n, reason: String(e?.message || e) });
    }
  }

  /* عيّنة: آخر سطر سورة معلَّم بلا مطّ (العرض ≤٩٠٪ إن كان قصيرًا طبيعيًا) */
  const surahEndSample = [1, 2, 7, 49, 586, 600, 604];
  for (const n of surahEndSample) {
    try {
      const r = await measureSurahEndWidths(page, n);
      results.push({ page: n, surahEnds: r.ends });
      for (const e of r.ends || []) {
        if (!e.marked) {
          failures.push({
            page: n,
            reason: `سطر نهاية سورة ${e.line} بلا mf2-line--surah-end`,
          });
        }
        /* إن وُجد مطّ (عرض معروض ≫ طبيعي) يفشل؛ العرض الطبيعي الكامل مسموح */
        if (e.sx > 1.02) {
          failures.push({
            page: n,
            reason: `آخر سطر سورة ${e.line} ما زال ممدودًا sx=${e.sx.toFixed(2)}`,
          });
        }
        if (e.naturalRatio < 0.9 && e.ratio > 0.9) {
          failures.push({
            page: n,
            reason: `آخر سطر سورة ${e.line} عُرض بالمطّ ${(e.ratio * 100).toFixed(1)}% (طبيعي ${(e.naturalRatio * 100).toFixed(1)}%)`,
          });
        }
      }
    } catch (e) {
      failures.push({ page: n, reason: String(e?.message || e) });
    }
  }

  for (const n of FREEZE) {
    try {
      const r = await measureFreeze(page, n);
      results.push({ page: n, ...r });
      await page.locator(".mf2-lines").screenshot({
        path: join(OUT_DIR, `freeze-${String(n).padStart(3, "0")}.png`),
      });
      if (r.maxDev > 2) {
        failures.push({
          page: n,
          reason: `انحراف خط أساس ${r.maxDev.toFixed(2)}px > 2`,
        });
      }
    } catch (e) {
      failures.push({ page: n, reason: String(e?.message || e) });
    }
  }

  await browser.close();
  const report = { base: BASE, gridRef: GRID.referencePage, results, failures };
  writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) {
    console.error(`FAIL ${failures.length}`);
    process.exit(1);
  }
  console.log("mushaf-opening-frame-gate: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
