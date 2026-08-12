#!/usr/bin/env node
/**
 * يقيس انحراف عرض أسطر QCF V2 على عيّنة صفحات باستخدام خط الصفحة المحلي.
 *
 * مقياس مُصحَّح:
 * - يُستثنى surah_name و basmallah (إن وُجدت في البيانات أو كفجوات رأس سورة).
 * - يُستثنى السطر الأخير في كل سورة (آخر سطر يحمل آياتها على الصفحة).
 *
 * الاستخدام:
 *   node scripts/quran-import/measure-mushaf-line-deviation.mjs [--label after] [--out path.json] [--pages 1,2,586]
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "../..");
const PAGES_DIR = path.join(APP_ROOT, "public/data/quran-v2/pages");
const FONTS_DIR = path.join(APP_ROOT, "public/fonts/qpc-v2");
const CHAPTERS_PATH = path.join(APP_ROOT, "public/data/quran-v2/chapters.json");

/** عيّنة 20 صفحة موزّعة — تشمل المطلوبة صراحة */
export const SAMPLE_PAGES = [
  1, 2, 50, 76, 100, 150, 200, 250, 283, 300,
  350, 400, 450, 500, 550, 580, 600, 601, 603, 604,
];

/** الصفحات الـ36 التي كانت مختلفة الحدود قبل اعتماد mushaf=1 */
export const BOUNDARY_DIFF_PAGES = [
  120, 121, 122, 123, 144, 145, 531, 532, 533, 534,
  564, 565, 567, 568, 569, 570, 575, 576, 583, 584,
  585, 586, 587, 588, 589, 590, 591, 592, 593, 594,
  595, 596, 597, 598, 599, 600,
];

const EXCLUDED_LINE_TYPES = new Set(["surah_name", "basmallah", "bismillah"]);

function pageFile(n) {
  return path.join(PAGES_DIR, `page-${String(n).padStart(3, "0")}.json`);
}

function parseAyahKey(key) {
  const [s, a] = String(key).split(":").map(Number);
  return { surah: s, ayah: a };
}

/**
 * يبني أسطر القياس من آيات الصفحة مع تصنيف الاستثناءات.
 * @param {any[]} verses
 * @param {Map<number, number>} ayahCounts surah → verses_count
 */
export function linesFromVerses(verses, ayahCounts) {
  const byLine = new Map();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const ln = w.line_number;
      if (!byLine.has(ln)) {
        byLine.set(ln, {
          ln,
          codes: [],
          types: new Set(),
          verseKeys: new Set(),
          surahs: new Set(),
        });
      }
      const row = byLine.get(ln);
      row.codes.push(w.code_v2 ?? "");
      const t = w.line_type || w.char_type_name || "word";
      row.types.add(t);
      row.verseKeys.add(v.verse_key);
      row.surahs.add(Number(String(v.verse_key).split(":")[0]));
    }
  }

  const sorted = [...byLine.keys()].sort((a, b) => a - b);

  // آخر سطر لكل سورة على هذه الصفحة
  const lastLineBySurah = new Map();
  for (const ln of sorted) {
    for (const s of byLine.get(ln).surahs) lastLineBySurah.set(s, ln);
  }

  // فجوات بين أسطر الآيات عند بداية سورة = surah_name / basmallah في المصحف المطبوع
  // (غير موجودة ككلمات في JSON الآيات) — تُسجَّل للاستثناء إن قِيست لاحقًا
  const gapExcluded = new Set();
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    if (next > prev + 1) {
      for (let g = prev + 1; g < next; g++) gapExcluded.add(g);
    }
  }

  return sorted.map((ln) => {
    const row = byLine.get(ln);
    const joined = row.codes.join("");
    const types = [...row.types];
    const isTypeExcluded = types.some((t) => EXCLUDED_LINE_TYPES.has(String(t).toLowerCase()));

    // السطر الأخير في السورة: يحمل آخر آية من سورة تنتهي على هذه الصفحة
    let isLastLineOfSurah = false;
    for (const key of row.verseKeys) {
      const { surah, ayah } = parseAyahKey(key);
      const total = ayahCounts.get(surah);
      if (total != null && ayah === total && lastLineBySurah.get(surah) === ln) {
        isLastLineOfSurah = true;
      }
    }
    // احتياط: إن كان هذا آخر سطر ظاهر لسورة ما على الصفحة والسورة تنتهي هنا
    for (const s of row.surahs) {
      if (lastLineBySurah.get(s) === ln) {
        const keys = [...row.verseKeys].filter((k) => parseAyahKey(k).surah === s);
        const maxAyah = Math.max(...keys.map((k) => parseAyahKey(k).ayah));
        if (ayahCounts.get(s) === maxAyah) isLastLineOfSurah = true;
      }
    }

    const excludeReason = isTypeExcluded
      ? "surah_name|basmallah"
      : isLastLineOfSurah
        ? "last_line_of_surah"
        : null;

    return {
      ln,
      joined,
      types,
      verseKeys: [...row.verseKeys],
      excludeReason,
      scored: excludeReason == null,
    };
  });
}

async function measurePage(page, pageNum, lines) {
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
    const widths = lines.map((line) => {
      const el = document.createElement("div");
      el.className = "line";
      el.textContent = line.joined;
      root.appendChild(el);
      const w = el.getBoundingClientRect().width;
      el.remove();
      return { ...line, w: Math.round(w * 100) / 100 };
    });

    // أعرض سطر ضمن الأسطر المَقيسة فقط (لا رؤوس/أواخر سور)
    const scoredWidths = widths.filter((x) => x.scored);
    const maxW = Math.max(...scoredWidths.map((x) => x.w), 0);
    const withDev = widths.map((x) => ({
      ln: x.ln,
      w: x.w,
      excludeReason: x.excludeReason,
      scored: x.scored,
      verseKeys: x.verseKeys,
      deviationPct:
        x.scored && maxW > 0
          ? Math.round(((maxW - x.w) / maxW) * 10000) / 100
          : null,
    }));
    const scoredDevs = withDev.filter((x) => x.scored && x.deviationPct != null);
    const maxDevScored = scoredDevs.length
      ? Math.max(...scoredDevs.map((x) => x.deviationPct))
      : 0;
    return {
      maxW,
      maxDevScored,
      pass: maxDevScored <= 2,
      scoredLineCount: scoredDevs.length,
      lines: withDev,
    };
  }, lines);
}

function parsePagesArg(argv) {
  const idx = argv.indexOf("--pages");
  if (idx < 0) return null;
  const raw = argv[idx + 1] || "";
  if (raw === "36") return BOUNDARY_DIFF_PAGES;
  if (raw === "sample") return SAMPLE_PAGES;
  if (raw === "all-check") {
    return [...new Set([...SAMPLE_PAGES, ...BOUNDARY_DIFF_PAGES, 586])].sort((a, b) => a - b);
  }
  return raw.split(",").map(Number).filter((n) => n >= 1 && n <= 604);
}

async function main() {
  const labelIdx = process.argv.indexOf("--label");
  const label = labelIdx >= 0 ? process.argv[labelIdx + 1] : "measure";
  const outIdx = process.argv.indexOf("--out");
  const outPath = outIdx >= 0
    ? process.argv[outIdx + 1]
    : path.join(APP_ROOT, `.local/mushaf/line-deviation-${label}.json`);

  const pages = parsePagesArg(process.argv) || SAMPLE_PAGES;
  const chapters = JSON.parse(await readFile(CHAPTERS_PATH, "utf8"));
  const ayahCounts = new Map(chapters.map((c) => [c.id, c.verses_count]));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const n of pages) {
    const verses = JSON.parse(await readFile(pageFile(n), "utf8"));
    const lines = linesFromVerses(verses, ayahCounts);
    const m = await measurePage(page, n, lines);
    results.push({ page: n, lineCount: lines.length, ...m });
    console.log(
      `p${n}: lines=${lines.length} scored=${m.scoredLineCount} maxDev=${m.maxDevScored}% ${m.pass ? "OK" : "FAIL"}`,
    );
  }

  await browser.close();

  const summary = {
    label,
    mushafId: 1,
    metric: "exclude surah_name/basmallah + last line of each surah; maxDev among remaining",
    fontPath: "public/fonts/qpc-v2/p{n}.woff2 (hafs/v2)",
    measuredAt: new Date().toISOString(),
    sampleSize: results.length,
    pagesFailing: results.filter((r) => !r.pass).map((r) => r.page),
    maxDevAcrossSample: Math.max(...results.map((r) => r.maxDevScored), 0),
    page586: results.find((r) => r.page === 586) || null,
    page600: results.find((r) => r.page === 600) || null,
    results,
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(summary, null, 2));
  console.log(`wrote ${outPath}`);
  console.log(
    `maxDevAcrossSample=${summary.maxDevAcrossSample}% failing=${JSON.stringify(summary.pagesFailing)}`,
  );
  if (summary.page586) {
    console.log(`p586 maxDev=${summary.page586.maxDevScored}% pass=${summary.page586.pass}`);
  }
  if (summary.page600) {
    console.log(`p600 maxDev=${summary.page600.maxDevScored}% pass=${summary.page600.pass}`);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
