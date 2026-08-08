#!/usr/bin/env node
/**
 * بوابة صلبة: لا يتجاوز أي سطر مرسوم (sizingLines) عرض الحاوية — على 604 صفحة.
 * measurementExclusions لا تُستثنى هنا (عكس مقياس الانحراف).
 *
 *   node scripts/quran-import/check-mushaf-drawn-lines-overflow.mjs
 *   node scripts/quran-import/check-mushaf-drawn-lines-overflow.mjs --pages 595,1,2
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "../..");
const PAGES_DIR = path.join(APP_ROOT, "public/data/quran-v2/pages");
const FONTS_DIR = path.join(APP_ROOT, "public/fonts/qpc-v2");
const CHAPTERS_PATH = path.join(APP_ROOT, "public/data/quran-v2/chapters.json");

const DRAWN_BASMALA = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
const CONTAINER_W = 360;
const CONTAINER_H = 560;
const REF_PX = 100;
const LINE_HEIGHT_EM = 1.1;

function pageFile(n) {
  return path.join(PAGES_DIR, `page-${String(n).padStart(3, "0")}.json`);
}

function parsePagesArg(argv) {
  const idx = argv.indexOf("--pages");
  if (idx < 0) return null;
  return (argv[idx + 1] || "")
    .split(",")
    .map(Number)
    .filter((n) => n >= 1 && n <= 604);
}

function sizingLinesForPage(verses, chaptersById) {
  const byLine = new Map();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const ln = w.line_number;
      if (!byLine.has(ln)) byLine.set(ln, []);
      byLine.get(ln).push(w.code_v2 ?? "");
    }
  }
  const lines = [...byLine.keys()]
    .sort((a, b) => a - b)
    .map((ln) => ({
      kind: "ayah",
      text: byLine.get(ln).join(""),
      font: "qpc",
    }));

  const surahStarts = new Map();
  for (const v of verses) {
    const [s, a] = String(v.verse_key).split(":").map(Number);
    if (a === 1 && !surahStarts.has(s)) {
      const first = Math.min(...(v.words ?? []).map((w) => w.line_number));
      surahStarts.set(s, first);
    }
  }
  for (const [surahId] of [...surahStarts.entries()].sort((a, b) => a[1] - b[1])) {
    const ch = chaptersById.get(surahId);
    if (!ch) continue;
    lines.push({
      kind: "surah_title",
      text: `سُورَةُ ${ch.name_arabic}`,
      font: "title",
    });
    if (ch.bismillah_pre) {
      lines.push({ kind: "basmala", text: DRAWN_BASMALA, font: "basmala" });
    }
  }
  return { lines, ayahLineCount: byLine.size };
}

async function measurePage(page, pageNum, sizing, chaptersById) {
  const fontBuf = await readFile(path.join(FONTS_DIR, `p${pageNum}.woff2`));
  const fontUrl = `data:font/woff2;base64,${fontBuf.toString("base64")}`;
  await page.setContent(`<!doctype html><html><head>
<style>
@font-face{font-family:'qpc';src:url('${fontUrl}') format('woff2');font-display:block}
body{margin:0}
#box{width:${CONTAINER_W}px;height:${CONTAINER_H}px;direction:rtl}
.line{white-space:nowrap;display:inline-block;max-width:100%}
.ayah{font-family:'qpc', serif}
.title{font-family:Amiri, "Times New Roman", serif;font-weight:700}
.basmala{font-family:"Amiri Quran", Amiri, serif}
</style></head><body><div id="box"></div></body></html>`);

  const ok = await page
    .waitForFunction(async () => {
      try {
        await document.fonts.load('40px "qpc"');
        await document.fonts.ready;
        return document.fonts.check('40px "qpc"');
      } catch {
        return false;
      }
    }, { timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  if (!ok) throw new Error(`فشل تحميل خط الصفحة ${pageNum}`);

  return page.evaluate(
    ({ sizing, REF_PX, CONTAINER_W, CONTAINER_H, LINE_HEIGHT_EM }) => {
      const box = document.getElementById("box");
      const els = sizing.lines.map((line) => {
        const el = document.createElement("div");
        el.className = `line ${line.font === "qpc" ? "ayah" : line.font === "title" ? "title" : "basmala"}`;
        el.textContent = line.text;
        el.dataset.kind = line.kind;
        box.appendChild(el);
        return el;
      });

      const measureWidest = (px) => {
        let w = 0;
        for (const el of els) {
          el.style.fontSize = `${px}px`;
          w = Math.max(w, el.scrollWidth);
        }
        return w;
      };

      const widestAtRef = measureWidest(REF_PX);
      if (widestAtRef <= 0) return { ok: false, reason: "empty" };

      let size = (CONTAINER_W * REF_PX) / widestAtRef;
      const headerCount = sizing.lines.filter((l) => l.kind !== "ayah").length;
      // تقدير ارتفاع الرؤوس ~1.4em لكل عنصر مرسوم غير آية
      const headersH = headerCount * size * 1.35;
      const ayahBudget = Math.max(0, CONTAINER_H - headersH);
      const sizeByHeight = ayahBudget / Math.max(1, sizing.ayahLineCount) / LINE_HEIGHT_EM;
      size = Math.min(size, sizeByHeight);

      const widestAtSize = measureWidest(size);
      if (widestAtSize > CONTAINER_W) {
        size *= (CONTAINER_W / widestAtSize) * 0.997;
      }
      const finalWidest = measureWidest(size);
      const overflows = els
        .map((el) => ({
          kind: el.dataset.kind,
          scrollWidth: el.scrollWidth,
          overflow: el.scrollWidth - CONTAINER_W,
        }))
        .filter((x) => x.overflow > 0);

      for (const el of els) el.remove();
      return {
        ok: overflows.length === 0 && finalWidest <= CONTAINER_W,
        size,
        finalWidest,
        overflows,
      };
    },
    { sizing, REF_PX, CONTAINER_W, CONTAINER_H, LINE_HEIGHT_EM },
  );
}

async function main() {
  const pages = parsePagesArg(process.argv) || Array.from({ length: 604 }, (_, i) => i + 1);
  const chapters = JSON.parse(await readFile(CHAPTERS_PATH, "utf8"));
  const chaptersById = new Map(chapters.map((c) => [c.id, c]));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const failures = [];

  for (const n of pages) {
    const verses = JSON.parse(await readFile(pageFile(n), "utf8"));
    const sizing = sizingLinesForPage(verses, chaptersById);
    const m = await measurePage(page, n, sizing, chaptersById);
    if (!m.ok) {
      failures.push({ page: n, ...m });
      console.error(`FAIL p${n}`, JSON.stringify(m.overflows || m));
    } else if (n % 50 === 0 || n <= 2 || n >= 600) {
      console.log(`ok p${n} size=${m.size.toFixed(2)} widest=${m.finalWidest}`);
    }
  }

  await browser.close();

  if (failures.length) {
    console.error(`\nتجاوز عرض على ${failures.length} صفحة — قصّ محتمل للنص`);
    process.exit(1);
  }
  console.log(`check-mushaf-drawn-lines-overflow: ok (${pages.length} صفحات)`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { sizingLinesForPage, DRAWN_BASMALA };
