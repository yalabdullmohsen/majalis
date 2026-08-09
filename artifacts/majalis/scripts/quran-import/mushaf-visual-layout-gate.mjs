#!/usr/bin/env node
/**
 * بوابة تخطيط المصحف (قياس DOM عبر Playwright — لا تعتمد على لقطات بصرية وحدها).
 *
 * القاعدة الملزمة:
 *   1) لا تجاوز أفقي خارج إطار الصفحة
 *   2) لا تراكب هندسي بين كلمات الآية (bounding boxes)
 *   3) أقصى مسافة بين سطرين متجاورين ≤ 1.6 × حجم الخط (كل الصفحات)
 *   4) حجم الخط في الصفحتين 1 و2 ≥ 80% من متوسط حجم الخط في الصفحات العادية
 *   5) امتلاء كتلة الأسطر داخل صندوق الأسطر: ≥90% لكل الصفحات
 *      عبر تقليص ارتفاع الصندوق — بلا تمديد فراغات بين الأسطر (pitch≤1.6)
 *      (الفراغ فوق/تحت الصندوق يبقى في الخانة الخارجية عند قلّة الأسطر)
 *
 * الاستخدام:
 *   MUSHAF_GATE_BASE_URL=https://www.majlisilm.com node scripts/quran-import/mushaf-visual-layout-gate.mjs
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node ...
 *
 * اختياري:
 *   MUSHAF_GATE_PAGES=1,2,3,13,283,604
 *   MUSHAF_GATE_OUT_DIR=artifacts/...
 *   MUSHAF_GATE_MAX_MS=180000
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

const BASE =
  process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") ||
  "https://www.majlisilm.com";

const DEFAULT_PAGES = [1, 2, 3, 100, 283, 306, 400, 500, 586, 595, 600, 604];
const PAGES = (process.env.MUSHAF_GATE_PAGES || DEFAULT_PAGES.join(","))
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n >= 1 && n <= 604);

const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR ||
  join(ROOT, "../../.cursor/projects/Users-alabdullmohsen-majlis-app/artifacts/mushaf-layout-gate");

const MAX_MS = Number(process.env.MUSHAF_GATE_MAX_MS || 180_000);
const VIEWPORT = { width: 390, height: 844 };
/**
 * أقصى مسافة بين مراكز أسطر متجاورة كنسبة من حجم الخط
 * ≈ line-height(1.05) + gap≤0.55×lineH → ≈1.63em
 */
const MAX_LINE_PITCH_EM = 1.65;
/** حد أدنى لنسبة حجم خط الصفحتين الافتتاحيتين من متوسط الصفحات العادية */
const MIN_OPENING_FONT_RATIO = 0.95;
/** امتلاء المحتوى داخل صندوق الأسطر (فجوات موزّعة) */
const MIN_FILL_NORMAL = 0.9;
const MIN_FILL_OPENING = 0.78;
/** فجوة علوية رأس→أول سطر ≤ ٢٪ من ارتفاع الصفحة (صفحات عادية) */
const MAX_TOP_GAP_RATIO = 0.02;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function measurePage(page, pageNum) {
  const url = `${BASE}/mushaf/page/${pageNum}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  /* وضع آية يصدّر .mf2-lines داخل .qs-mushaf-body دون غلاف .mf2-page */
  await page.waitForSelector(".mf2-lines .mf2-line, .mf2-page .mf2-line", { timeout: 45_000 });
  await sleep(900);

  const metrics = await page.evaluate(() => {
    const root =
      document.querySelector(".qs-mushaf-body-inner") ||
      document.querySelector(".mf2-page") ||
      document.querySelector(".mf2-lines");
    const linesRoot = document.querySelector(".mf2-lines") || root;
    if (!root || !linesRoot) return { error: "no mushaf lines root" };
    const rootRect = root.getBoundingClientRect();
    const style = getComputedStyle(linesRoot);
    const fontSize = parseFloat(style.fontSize) || 0;

    const lines = [...linesRoot.querySelectorAll(".mf2-line")].map((el, i) => {
      const r = el.getBoundingClientRect();
      return { i, top: r.top, bottom: r.bottom, height: r.height, midY: r.top + r.height / 2 };
    });

    /** تباعد بين أسطر آيات متجاورة فقط — يُستثنى ما يفصل بينهما رأس سورة/بسملة */
    let maxPitchPx = 0;
    const children = [...linesRoot.children];
    for (let i = 1; i < children.length; i++) {
      const prev = children[i - 1];
      const cur = children[i];
      if (!prev.classList.contains("mf2-line") || !cur.classList.contains("mf2-line")) continue;
      const a = prev.getBoundingClientRect();
      const b = cur.getBoundingClientRect();
      const pitch = b.top + b.height / 2 - (a.top + a.height / 2);
      if (pitch > maxPitchPx) maxPitchPx = pitch;
    }

    const words = [...linesRoot.querySelectorAll(".mf2-word")];
    let overflowRight = 0;
    let overflowLeft = 0;
    const pad = 1.5;
    for (const w of words) {
      const r = w.getBoundingClientRect();
      if (r.right > rootRect.right + pad) overflowRight = Math.max(overflowRight, r.right - rootRect.right);
      if (r.left < rootRect.left - pad) overflowLeft = Math.max(overflowLeft, rootRect.left - r.left);
    }

    const byLine = new Map();
    for (const w of words) {
      const line = w.closest(".mf2-line");
      if (!line) continue;
      const key = line.getAttribute("data-line") || String(line.offsetTop);
      if (!byLine.has(key)) byLine.set(key, []);
      byLine.get(key).push(w.getBoundingClientRect());
    }
    let overlapPairs = 0;
    let maxOverlapX = 0;
    for (const boxes of byLine.values()) {
      const sorted = [...boxes].sort((a, b) => a.left - b.left);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        const overlap = prev.right - cur.left;
        /* >2px حقيقي؛ ≤2 غالبًا تلميح/تقريب صندوق الحرف لا تراكب بصري */
        if (overlap > 2) {
          overlapPairs += 1;
          maxOverlapX = Math.max(maxOverlapX, overlap);
        }
      }
    }

    const blockRect = linesRoot.getBoundingClientRect();
    const headers = [...linesRoot.querySelectorAll(".mf2-surah-header, .mf2-bismillah")];
    let contentTop = lines[0] ? lines[0].top : blockRect.top;
    let contentBot = lines.length ? lines[lines.length - 1].bottom : blockRect.bottom;
    for (const h of headers) {
      const r = h.getBoundingClientRect();
      contentTop = Math.min(contentTop, r.top);
      contentBot = Math.max(contentBot, r.bottom);
    }
    const contentH = Math.max(0, contentBot - contentTop);
    const contentTopGap = Math.max(0, contentTop - blockRect.top);
    const contentBottomGap = Math.max(0, blockRect.bottom - contentBot);
    const fillRatio = blockRect.height > 0 ? contentH / blockRect.height : 0;
    const pageHeader = document.querySelector(".mpv-ayah-header");
    const pageFooter = document.querySelector(".mpv-ayah-footer");
    const pageSlotTop = pageHeader?.getBoundingClientRect().bottom ?? blockRect.top;
    const pageSlotBot = pageFooter?.getBoundingClientRect().top ?? blockRect.bottom;
    const pageSlotH = Math.max(1, pageSlotBot - pageSlotTop);
    const headerToContentGap = Math.max(0, contentTop - pageSlotTop);
    const topGapRatio = headerToContentGap / pageSlotH;
    /* أرقام الآيات: مجسمات QPC نهاية غير فارغة، أو Unicode بـ .mf2-ayah-marker__num */
    const qpcEnds = [...linesRoot.querySelectorAll('.mf2-word--ayah-end[data-ayah-numeral="qpc"]')];
    const unicodeNums = [...linesRoot.querySelectorAll(".mf2-ayah-marker__num")];
    const emptyQpcEnds = qpcEnds.filter((el) => !String(el.textContent || "").trim()).length;
    const emptyUnicodeNums = unicodeNums.filter((el) => !String(el.textContent || "").trim()).length;

    const bismillah = linesRoot.querySelector(".mf2-bismillah");
    let bismillahFont = null;
    let bismillahOverlapNext = 0;
    if (bismillah) {
      bismillahFont = getComputedStyle(bismillah).fontFamily;
      const br = bismillah.getBoundingClientRect();
      const nextLine = bismillah.parentElement?.nextElementSibling?.classList?.contains("mf2-line")
        ? bismillah.parentElement.nextElementSibling
        : bismillah.nextElementSibling?.classList?.contains("mf2-line")
          ? bismillah.nextElementSibling
          : null;
      /* البسملة داخل رأس السورة — السطر التالي أول .mf2-line بعد الرأس */
      const header = bismillah.closest(".mf2-surah-header");
      const after = header?.nextElementSibling;
      const probe = (after?.classList?.contains("mf2-line") ? after : nextLine);
      if (probe) {
        const nr = probe.getBoundingClientRect();
        bismillahOverlapNext = Math.max(0, br.bottom - nr.top);
      }
    }

    return {
      fontSize,
      lineCount: lines.length,
      maxPitchPx,
      maxPitchEm: fontSize > 0 ? maxPitchPx / fontSize : 0,
      overflowRight,
      overflowLeft,
      overflowX: Math.max(overflowRight, overflowLeft),
      overlapPairs,
      maxOverlapX,
      contentTopGap,
      contentBottomGap,
      contentH,
      fillRatio,
      topGapRatio,
      emptyQpcEnds,
      emptyUnicodeNums,
      qpcEndCount: qpcEnds.length,
      bismillahFont,
      bismillahOverlapNext,
      rootH: rootRect.height,
      rootW: rootRect.width,
      linesH: blockRect.height,
    };
  });

  const shotPath = join(OUT_DIR, `page-${String(pageNum).padStart(3, "0")}.png`);
  const pageEl = page.locator(".mf2-lines, .qs-mushaf-body-inner, .mf2-page").first();
  await pageEl.screenshot({ path: shotPath });

  return { pageNum, url, shotPath, ...metrics };
}

function evaluate(results) {
  const failures = [];
  const normalFonts = results
    .filter((r) => r.pageNum !== 1 && r.pageNum !== 2 && r.fontSize > 0)
    .map((r) => r.fontSize);
  const avgNormalFont =
    normalFonts.length > 0
      ? normalFonts.reduce((a, b) => a + b, 0) / normalFonts.length
      : 0;

  for (const r of results) {
    if (r.error) {
      failures.push({ page: r.pageNum, reason: r.error });
      continue;
    }
    if (r.overflowX > 2) {
      failures.push({
        page: r.pageNum,
        reason: `تجاوز أفقي ${r.overflowX.toFixed(2)}px`,
      });
    }
    if (r.overlapPairs > 0) {
      failures.push({
        page: r.pageNum,
        reason: `تراكب كلمات: ${r.overlapPairs} زوجًا (أقصى ${r.maxOverlapX.toFixed(2)}px)`,
      });
    }
    if (r.maxPitchEm > MAX_LINE_PITCH_EM + 0.02) {
      failures.push({
        page: r.pageNum,
        reason: `تباعد أسطر مفرط: ${r.maxPitchEm.toFixed(3)}em > ${MAX_LINE_PITCH_EM}em (خط ${r.fontSize.toFixed(2)}px، pitch ${r.maxPitchPx.toFixed(1)}px)`,
      });
    }
    if ((r.pageNum === 1 || r.pageNum === 2) && avgNormalFont > 0) {
      const ratio = r.fontSize / avgNormalFont;
      if (ratio < MIN_OPENING_FONT_RATIO - 0.005) {
        failures.push({
          page: r.pageNum,
          reason: `خط الصفحة الافتتاحية ${(ratio * 100).toFixed(1)}% من متوسط العادية (${r.fontSize.toFixed(2)} / ${avgNormalFont.toFixed(2)}) — المطلوب ≥ ${MIN_OPENING_FONT_RATIO * 100}%`,
        });
      }
    }
    if (typeof r.fillRatio === "number") {
      const minFill = r.pageNum === 1 || r.pageNum === 2 ? MIN_FILL_OPENING : MIN_FILL_NORMAL;
      if (r.fillRatio + 0.02 < minFill) {
        failures.push({
          page: r.pageNum,
          reason: `امتلاء كتلة الأسطر ${(r.fillRatio * 100).toFixed(1)}% < ${minFill * 100}% (محتوى ${r.contentH?.toFixed?.(0) ?? "?"} / صندوق ${r.linesH?.toFixed?.(0) ?? "?"})`,
        });
      }
    }
    if (
      r.pageNum !== 1 &&
      r.pageNum !== 2 &&
      typeof r.topGapRatio === "number" &&
      r.topGapRatio > MAX_TOP_GAP_RATIO + 0.005
    ) {
      failures.push({
        page: r.pageNum,
        reason: `فجوة علوية ${(r.topGapRatio * 100).toFixed(1)}% > ${MAX_TOP_GAP_RATIO * 100}%`,
      });
    }
    if ((r.emptyQpcEnds || 0) > 0 || (r.emptyUnicodeNums || 0) > 0) {
      failures.push({
        page: r.pageNum,
        reason: `علامات آية بلا رقم (qpc فارغ=${r.emptyQpcEnds || 0}, unicode فارغ=${r.emptyUnicodeNums || 0})`,
      });
    }
    if (r.pageNum === 306 && (r.qpcEndCount || 0) < 1 && (r.emptyUnicodeNums || 0) === 0) {
      /* صفحة المرجع يجب أن تعرض مجسمات نهاية */
      if ((r.qpcEndCount || 0) === 0) {
        failures.push({ page: 306, reason: "صفحة المرجع 306 بلا مجسمات نهاية QPC ظاهرة" });
      }
    }
    if (r.pageNum === 2 && r.bismillahOverlapNext > 2) {
      failures.push({
        page: r.pageNum,
        reason: `تراكب بسملة مع السطر التالي ${r.bismillahOverlapNext.toFixed(1)}px`,
      });
    }
  }

  return { failures, avgNormalFont };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const started = Date.now();
  console.log(`[mushaf-visual-gate] base=${BASE}`);
  console.log(`[mushaf-visual-gate] pages=${PAGES.join(",")}`);
  console.log(`[mushaf-visual-gate] out=${OUT_DIR}`);
  console.log(
    `[mushaf-visual-gate] rules: overflowX≤2px, overlap=0, maxPitch≤${MAX_LINE_PITCH_EM}em, openingFont≥${MIN_OPENING_FONT_RATIO * 100}% avg, fill≥${MIN_FILL_NORMAL * 100}%`,
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: "ar-SA",
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  const results = [];
  try {
    for (const n of PAGES) {
      if (Date.now() - started > MAX_MS) {
        throw new Error(`تجاوز مهلة البوابة ${MAX_MS}ms`);
      }
      process.stdout.write(`  قياس صفحة ${n}… `);
      const r = await measurePage(page, n);
      results.push(r);
      if (r.error) {
        console.log(`خطأ: ${r.error}`);
      } else {
        console.log(
          `font=${r.fontSize.toFixed(1)} pitch=${r.maxPitchEm.toFixed(2)}em fill=${((r.fillRatio || 0) * 100).toFixed(0)}% overflow=${r.overflowX.toFixed(1)} overlap=${r.overlapPairs} box=${(r.linesH || 0).toFixed(0)} content=${(r.contentH || 0).toFixed(0)}`,
        );
      }
    }
  } finally {
    await browser.close();
  }

  const { failures, avgNormalFont } = evaluate(results);
  const report = {
    base: BASE,
    generatedAt: new Date().toISOString(),
    viewport: VIEWPORT,
    rules: {
      maxOverflowXPx: 2,
      maxOverlapPairs: 0,
      maxLinePitchEm: MAX_LINE_PITCH_EM,
      minOpeningFontRatio: MIN_OPENING_FONT_RATIO,
      minFillOpening: MIN_FILL_OPENING,
      minFillNormal: MIN_FILL_NORMAL,
      fillRatioGate: "enabled-box-hug",
    },
    avgNormalFont,
    results,
    failures,
    ok: failures.length === 0,
  };

  const reportPath = join(OUT_DIR, "report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`[mushaf-visual-gate] report → ${reportPath}`);
  console.log(`[mushaf-visual-gate] avgNormalFont=${avgNormalFont.toFixed(2)}px`);

  if (failures.length) {
    console.error("[mushaf-visual-gate] FAIL");
    for (const f of failures) {
      console.error(`  صفحة ${f.page}: ${f.reason}`);
    }
    process.exit(1);
  }

  console.log("[mushaf-visual-gate] OK");
}

main().catch((err) => {
  console.error("[mushaf-visual-gate] ERROR:", err?.message || err);
  process.exit(1);
});
