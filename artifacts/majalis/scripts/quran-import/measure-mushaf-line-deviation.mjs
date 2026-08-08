#!/usr/bin/env node
/**
 * يقيس انحراف عرض أسطر QCF V2 على عيّنة صفحات باستخدام خط الصفحة المحلي.
 * الاستخدام:
 *   node scripts/quran-import/measure-mushaf-line-deviation.mjs [--label before|after] [--out path.json]
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "../..");
const PAGES_DIR = path.join(APP_ROOT, "public/data/quran-v2/pages");
const FONTS_DIR = path.join(APP_ROOT, "public/fonts/qpc-v2");

/** عيّنة 20 صفحة موزّعة — تشمل المطلوبة صراحة */
export const SAMPLE_PAGES = [
  1, 2, 50, 76, 100, 150, 200, 250, 283, 300,
  350, 400, 450, 500, 550, 580, 600, 601, 603, 604,
];

function pageFile(n) {
  return path.join(PAGES_DIR, `page-${String(n).padStart(3, "0")}.json`);
}

function linesFromVerses(verses) {
  const byLine = new Map();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const ln = w.line_number;
      if (!byLine.has(ln)) byLine.set(ln, []);
      byLine.get(ln).push(w.code_v2 ?? "");
    }
  }
  return [...byLine.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ln, codes]) => ({ ln, joined: codes.join("") }));
}

async function measurePage(page, pageNum, lines) {
  // data: URL يتفادى قيود file:// في Chromium
  const fontBuf = await readFile(path.join(FONTS_DIR, `p${pageNum}.woff2`));
  const fontUrl = `data:font/woff2;base64,${fontBuf.toString("base64")}`;
  await page.setContent(`<!doctype html><html><head>
<style>
@font-face{font-family:'qpc';src:url('${fontUrl}') format('woff2');font-display:block}
body{font-family:qpc;font-size:40px;direction:rtl}
.line{white-space:nowrap;display:inline-block}
</style></head><body><div id="root"></div></body></html>`);

  const ok = await page.waitForFunction(async () => {
    try {
      await document.fonts.load('40px "qpc"');
      await document.fonts.ready;
      return document.fonts.check('40px "qpc"');
    } catch {
      return false;
    }
  }, { timeout: 20_000 }).then(() => true).catch(() => false);

  if (!ok) throw new Error(`فشل تحميل خط الصفحة ${pageNum}`);

  return page.evaluate((lines) => {
    const root = document.getElementById("root");
    const widths = lines.map(({ ln, joined }) => {
      const el = document.createElement("div");
      el.className = "line";
      el.textContent = joined;
      root.appendChild(el);
      const w = el.getBoundingClientRect().width;
      el.remove();
      return { ln, w: Math.round(w * 100) / 100 };
    });
    const maxW = Math.max(...widths.map((x) => x.w), 0);
    const lastLn = Math.max(...widths.map((x) => x.ln));
    const withDev = widths.map((x) => ({
      ...x,
      deviationPct: maxW > 0 ? Math.round(((maxW - x.w) / maxW) * 10000) / 100 : 0,
      isLastLine: x.ln === lastLn,
      // سطر «قصير طبعًا»: أقل من 85% من الأعرض
      isNaturallyShort: maxW > 0 ? x.w / maxW < 0.85 : false,
    }));
    const scored = withDev.filter((x) => !x.isLastLine && !x.isNaturallyShort);
    const maxDevScored = scored.length
      ? Math.max(...scored.map((x) => x.deviationPct))
      : 0;
    return {
      maxW,
      maxDevScored,
      pass: maxDevScored <= 2,
      lines: withDev,
    };
  }, lines);
}

async function main() {
  const labelIdx = process.argv.indexOf("--label");
  const label = labelIdx >= 0 ? process.argv[labelIdx + 1] : "measure";
  const outIdx = process.argv.indexOf("--out");
  const outPath = outIdx >= 0
    ? process.argv[outIdx + 1]
    : path.join(APP_ROOT, `.local/mushaf/line-deviation-${label}.json`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const n of SAMPLE_PAGES) {
    const verses = JSON.parse(await readFile(pageFile(n), "utf8"));
    const lines = linesFromVerses(verses);
    const m = await measurePage(page, n, lines);
    results.push({ page: n, lineCount: lines.length, ...m });
    console.log(
      `p${n}: lines=${lines.length} maxDev(scored)=${m.maxDevScored}% ${m.pass ? "OK" : "FAIL"}`,
    );
  }

  await browser.close();

  const summary = {
    label,
    mushafId: 1,
    fontPath: "public/fonts/qpc-v2/p{n}.woff2 (hafs/v2)",
    measuredAt: new Date().toISOString(),
    sampleSize: results.length,
    pagesFailing: results.filter((r) => !r.pass).map((r) => r.page),
    maxDevAcrossSample: Math.max(...results.map((r) => r.maxDevScored)),
    results,
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(summary, null, 2));
  console.log(`wrote ${outPath}`);
  console.log(`maxDevAcrossSample=${summary.maxDevAcrossSample}% failing=${JSON.stringify(summary.pagesFailing)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
