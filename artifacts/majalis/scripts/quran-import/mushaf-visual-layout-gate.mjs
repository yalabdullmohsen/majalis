#!/usr/bin/env node
/**
 * انحدار بصري إلزامي قبل الدمج:
 * لقطات + تحقق آلي (لا تجاوز أفقي، لا تراكب، امتلاء ≥ 80%)
 * للصفحات: 1, 2, 283, 587–596, 604
 *
 *   node scripts/quran-import/mushaf-visual-layout-gate.mjs --base http://127.0.0.1:24216
 *   node scripts/quran-import/mushaf-visual-layout-gate.mjs --base https://www.majlisilm.com
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "../..");

const GATE_PAGES = [1, 2, 283, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 604];
const MIN_FILL = 0.8;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const base = (arg("base", "") || "").replace(/\/$/, "");
const outDir = path.resolve(APP_ROOT, arg("out", ".local/mushaf/visual-gate"));

async function main() {
  if (!base) {
    console.error("مطلوب --base URL (محلي أو إنتاج)");
    process.exit(2);
  }
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: "ar",
  });
  const page = await context.newPage();
  const report = [];

  for (const n of GATE_PAGES) {
    const url = `${base}/mushaf/page/${n}`;
    console.log("gate", url);
    await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForSelector(".mf2-lines", { timeout: 60_000 });
    await page.waitForFunction(() => {
      const lines = document.querySelector(".mf2-lines");
      return lines && getComputedStyle(lines).opacity !== "0";
    }, { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(1200);

    await page.evaluate(() => {
      document.querySelectorAll(".mpv-toolbar, .mpv-resume-banner, .assistant-fab, .bottom-nav, .navbar-v3").forEach((el) => {
        el.style.visibility = "hidden";
      });
    });

    const metrics = await page.evaluate((minFill) => {
      const container = document.querySelector(".mf2-lines");
      if (!container) return { ok: false, reason: "no-container" };
      const cRect = container.getBoundingClientRect();
      const drawn = [
        ...container.querySelectorAll(".mf2-line, .mf2-bismillah, .mf2-surah-header__name"),
      ];
      const blocks = [
        ...container.querySelectorAll(".mf2-line, .mf2-surah-header"),
      ];

      const overflows = [];
      for (const el of drawn) {
        const sw = el.scrollWidth;
        const cw = el.clientWidth || container.clientWidth;
        if (sw > container.clientWidth + 0.5) {
          overflows.push({
            kind: el.getAttribute("data-sizing-line") || el.className,
            scrollWidth: sw,
            container: container.clientWidth,
          });
        }
        if (sw > cw + 0.5 && el.classList.contains("mf2-line")) {
          overflows.push({
            kind: "line-self",
            scrollWidth: sw,
            clientWidth: cw,
          });
        }
      }

      const rects = blocks.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          kind: el.classList.contains("mf2-surah-header") ? "header" : "line",
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
        };
      });
      const overlaps = [];
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const overlap = !(
            a.right <= b.left + 0.5 ||
            b.right <= a.left + 0.5 ||
            a.bottom <= b.top + 0.5 ||
            b.bottom <= a.top + 0.5
          );
          if (overlap) overlaps.push({ a: a.kind, b: b.kind, i, j });
        }
      }

      let minTop = Infinity;
      let maxBottom = -Infinity;
      for (const el of blocks) {
        const r = el.getBoundingClientRect();
        if (r.height <= 0) continue;
        minTop = Math.min(minTop, r.top);
        maxBottom = Math.max(maxBottom, r.bottom);
      }
      const contentH = maxBottom > minTop ? maxBottom - minTop : 0;
      const fill = cRect.height > 0 ? contentH / cRect.height : 0;

      return {
        ok: overflows.length === 0 && overlaps.length === 0 && fill >= minFill,
        overflows,
        overlaps,
        fill,
        containerH: cRect.height,
        contentH,
      };
    }, MIN_FILL);

    const shot = path.join(outDir, `page-${String(n).padStart(3, "0")}.png`);
    const target = await page.$(".qs-mushaf-body-inner, .mf2-page, .qs-mushaf-frame");
    if (target) await target.screenshot({ path: shot });
    else await page.screenshot({ path: shot, fullPage: false });

    report.push({ page: n, ...metrics, shot });
    const status = metrics.ok ? "OK" : "FAIL";
    console.log(
      `p${n} ${status} fill=${(metrics.fill * 100).toFixed(1)}% overflows=${metrics.overflows?.length ?? "?"} overlaps=${metrics.overlaps?.length ?? "?"}`,
    );
  }

  await browser.close();
  const reportPath = path.join(outDir, "report.json");
  await writeFile(reportPath, JSON.stringify({ base, minFill: MIN_FILL, report }, null, 2));
  console.log("wrote", reportPath);

  const failed = report.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`فشل انحدار بصري على ${failed.length} صفحة`);
    process.exit(1);
  }
  console.log("mushaf-visual-layout-gate: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
