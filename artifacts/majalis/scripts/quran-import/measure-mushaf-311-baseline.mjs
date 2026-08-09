#!/usr/bin/env node
/**
 * قياس صفحة ٣١١ (مرجع مطلق) على 390×844 → mushaf-baseline.json
 *
 *   MUSHAF_GATE_BASE_URL=https://majlisilm.com node scripts/quran-import/measure-mushaf-311-baseline.mjs
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node ...
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const BASE =
  process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") ||
  "https://majlisilm.com";
const OUT_JSON =
  process.env.MUSHAF_BASELINE_OUT ||
  join(ROOT, "src/features/mushaf/mushaf-baseline.json");
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR ||
  join(ROOT, ".local/mushaf-311-baseline");
const VIEWPORT = { width: 390, height: 844 };
const PAGE_NUM = 311;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(dirname(OUT_JSON), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: "ar-SA",
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/mushaf/page/${PAGE_NUM}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mf2-lines .mf2-line", { timeout: 45_000 });
  await sleep(1200);

  /* أخفِ شريط الأدوات/التنقل لثبات لقطة التجميد */
  await page.addStyleTag({
    content: `
      .mpv-toolbar, .mpv-navbar, .mpv-resume-banner, .qs-toast { display: none !important; }
    `,
  });
  await sleep(200);

  const metrics = await page.evaluate(() => {
    const linesRoot = document.querySelector(".mf2-lines");
    const header = document.querySelector(".mpv-ayah-header");
    const footer = document.querySelector(".mpv-ayah-footer");
    if (!linesRoot || !header || !footer) {
      return { error: "missing mushaf chrome" };
    }
    const hr = header.getBoundingClientRect();
    const fr = footer.getBoundingClientRect();
    const slotH = Math.max(1, fr.top - hr.bottom);
    const style = getComputedStyle(linesRoot);
    const fontSizePx = parseFloat(style.fontSize) || 0;
    const gapPx = parseFloat(style.gap) || 0;

    const ayahLines = [...linesRoot.querySelectorAll(".mf2-line")].map((el) =>
      el.getBoundingClientRect(),
    );
    let lineGapPx = gapPx;
    if (ayahLines.length >= 2) {
      const pitches = [];
      for (let i = 1; i < ayahLines.length; i++) {
        const a = ayahLines[i - 1];
        const b = ayahLines[i];
        pitches.push(b.top - a.bottom);
      }
      /* فجوة بين صناديق الأسطر (قد تختلف عن CSS gap إن وُجدت هوامش) */
      lineGapPx =
        pitches.reduce((s, v) => s + v, 0) / Math.max(1, pitches.length);
    }

    let contentTop = Infinity;
    let contentBot = -Infinity;
    for (const child of linesRoot.children) {
      if (!(child instanceof HTMLElement)) continue;
      const r = child.getBoundingClientRect();
      if (r.height <= 0 && r.width <= 0) continue;
      contentTop = Math.min(contentTop, r.top);
      contentBot = Math.max(contentBot, r.bottom);
    }
    const topOffsetPct = Math.max(0, contentTop - hr.bottom) / slotH;
    const bottomOffsetPct = Math.max(0, fr.top - contentBot) / slotH;
    const spanH = Math.max(0, contentBot - contentTop);
    const fillPct = spanH / slotH;

    const body =
      document.querySelector(".qs-mushaf-body") ||
      document.querySelector(".mpv-body");
    const bodyRect = body?.getBoundingClientRect();
    const linesRect = linesRoot.getBoundingClientRect();
    const sideMarginPx = bodyRect
      ? Math.max(0, linesRect.left - bodyRect.left)
      : 2;

    const badge = document.querySelector(".mpv-ayah-page-badge");
    const br = badge?.getBoundingClientRect();
    const pageW = document.documentElement.clientWidth;
    const cartoucheCenterX = br ? br.left + br.width / 2 : null;
    const cartoucheOffsetFromCenterPx =
      cartoucheCenterX != null ? cartoucheCenterX - pageW / 2 : null;

    return {
      fontSizePx: Number(fontSizePx.toFixed(3)),
      lineGapPx: Number(lineGapPx.toFixed(3)),
      lineHeightEm: Number((parseFloat(style.getPropertyValue("--mf2-lh")) || 1.05).toFixed(3)),
      topOffsetPct: Number(topOffsetPct.toFixed(5)),
      bottomOffsetPct: Number(bottomOffsetPct.toFixed(5)),
      sideMarginPx: Number(sideMarginPx.toFixed(2)),
      fillPct: Number(fillPct.toFixed(4)),
      slotHeightPx: Number(slotH.toFixed(2)),
      lineCount: ayahLines.length,
      cartoucheOffsetFromCenterPx:
        cartoucheOffsetFromCenterPx != null
          ? Number(cartoucheOffsetFromCenterPx.toFixed(2))
          : null,
      dataset: {
        mf2Size: linesRoot.dataset.mf2Size || null,
        mf2Gap: linesRoot.dataset.mf2Gap || null,
        mf2Fill: linesRoot.dataset.mf2Fill || null,
        mf2TopGap: linesRoot.dataset.mf2TopGap || null,
      },
    };
  });

  if (metrics.error) {
    throw new Error(metrics.error);
  }

  const freezePath = join(OUT_DIR, "page-311-freeze.png");
  await page.locator(".qs-mushaf-body-inner, .mf2-lines").first().screenshot({
    path: freezePath,
  });

  const baseline = {
    referencePage: PAGE_NUM,
    viewport: VIEWPORT,
    measuredFrom: BASE,
    measuredAt: new Date().toISOString(),
    ...metrics,
    /** ارتفاع الشارة = ارتفاع سطر مرجعي × 1.35 */
    surahBannerHeightPx: Number(
      (metrics.fontSizePx * metrics.lineHeightEm * 1.35).toFixed(2),
    ),
    freezeScreenshot: freezePath,
  };

  writeFileSync(OUT_JSON, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
  writeFileSync(
    join(OUT_DIR, "mushaf-baseline.json"),
    `${JSON.stringify(baseline, null, 2)}\n`,
    "utf8",
  );

  console.log("[mushaf-311-baseline]", JSON.stringify(baseline, null, 2));
  console.log(`[mushaf-311-baseline] wrote ${OUT_JSON}`);
  console.log(`[mushaf-311-baseline] freeze → ${freezePath}`);

  await browser.close();
}

main().catch((err) => {
  console.error("[mushaf-311-baseline] ERROR:", err?.message || err);
  process.exit(1);
});
