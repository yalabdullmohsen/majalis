#!/usr/bin/env node
/**
 * بوابة سلامة الأسطر — تفحص كل صفحات المصحف (604) بحثاً عن أي كلمة/حرف
 * يمتد خارج حدود .mm-page__body المرئية (اقتطاع بصري حقيقي، بغض النظر عن
 * scrollWidth/clientWidth التي لا تُسجَّل تحت overflow:clip).
 * كذلك تطابق النص المرسوم مع نص المصدر (public/data/quran-v2/pages/page-N.json).
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const root = process.argv[2];
const dist = join(root, "dist");
const dataDir = join(root, "public/data/quran-v2/pages");
const port = 24295;
const START = Number(process.argv[3] || 1);
const END = Number(process.argv[4] || 604);

function ct(f) {
  const e = extname(f).toLowerCase();
  if (e === ".html") return "text/html; charset=utf-8";
  if (e === ".js") return "text/javascript; charset=utf-8";
  if (e === ".css") return "text/css; charset=utf-8";
  if (e === ".json") return "application/json";
  if (e === ".woff2") return "font/woff2";
  return "application/octet-stream";
}
const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  const file = join(dist, p);
  if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    createReadStream(join(dist, "index.html")).pipe(res);
    return;
  }
  res.writeHead(200, { "Content-Type": ct(file) });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(port, "127.0.0.1", r));

function expectedTextForPage(n) {
  const raw = JSON.parse(readFileSync(join(dataDir, `page-${String(n).padStart(3, "0")}.json`), "utf8"));
  let text = "";
  for (const verse of raw) {
    for (const w of verse.words) {
      if (w.char_type_name !== "word" && w.char_type_name !== "end") continue;
      text += (w.code_v2 || "").replace(/\s+/g, "");
    }
  }
  return text;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: "ar-SA" });
const page = await context.newPage();
page.setDefaultTimeout(20000);

const failures = [];
let ok = 0;
const t0 = Date.now();

for (let n = START; n <= END; n++) {
  try {
    await page.goto(`http://127.0.0.1:${port}/mushaf?page=${n}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(`[data-testid="mushaf-page"][data-page="${n}"]`, { timeout: 20000 });
    await page.waitForTimeout(220);

    const result = await page.evaluate((n) => {
      const pageEl = document.querySelector(`[data-testid="mushaf-page"][data-page="${n}"]`);
      if (!pageEl) return { error: "no-page-el" };
      const body = pageEl.querySelector(".mm-page__body") || pageEl;
      const bodyRect = body.getBoundingClientRect();
      const clipped = [];
      const words = pageEl.querySelectorAll(".mm-ayah-line__word");
      for (const w of words) {
        const r = w.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const EPS = 2.5; // هامش لمقاييس subpixel لحواف الحروف/التشكيل — أثبتته لقطات فعلية بلا اقتطاع مرئي
        if (r.left < bodyRect.left - EPS || r.right > bodyRect.right + EPS || r.top < bodyRect.top - EPS || r.bottom > bodyRect.bottom + EPS) {
          clipped.push({ text: w.textContent, key: w.getAttribute("data-key") });
        }
      }
      // البسملة الزخرفية لصفحتي الافتتاح (١-٢) تُرسَم دائماً بخط الصفحة ١
      // (مقصود — راجع useQpcPageFont.ts) فترميزها PUA لا يطابق بيانات
      // page-N.json الفعلية لهذه الصفحة؛ تُستبعد من مطابقة النص فقط،
      // وتبقى ضمن فحص الاقتطاع الهندسي أعلاه.
      // البسملة الزخرفية تُرسَم بكلمات ثابتة (BASMALA_QPC_WORDS) في كل صفحة
      // افتتاح سورة عدا ص١ نفسها (حيث الآية ١:١ بيانات حقيقية لتلك الصفحة).
      // نطابق البسملة نصياً فقط في ص١؛ غيرها نستبعدها من مطابقة المصدر
      // (تبقى مشمولة في فحص الاقتطاع الهندسي أعلاه دائماً).
      const basmalaSel = n === 1 ? ".mm-basmala" : ".mm-basmala:not(.mm-basmala--qpc)";
      const renderedText = [...pageEl.querySelectorAll(`.mm-ayah-line, ${basmalaSel}`)]
        .map((el) => (el.textContent || "").replace(/\s+/g, ""))
        .join("");
      return { clippedCount: clipped.length, clippedSample: clipped.slice(0, 5), renderedText };
    }, n);

    if (result.error) {
      failures.push({ page: n, reason: result.error });
      continue;
    }

    let textMismatch = false;
    try {
      const expected = expectedTextForPage(n);
      if (result.renderedText !== expected) textMismatch = true;
    } catch {
      /* لا ملف مصدر لبعض الصفحات الخاصة — تجاهل مطابقة النص */
    }

    if (result.clippedCount > 0 || textMismatch) {
      failures.push({
        page: n,
        clippedCount: result.clippedCount,
        clippedSample: result.clippedSample,
        textMismatch,
      });
    } else {
      ok++;
    }
  } catch (err) {
    failures.push({ page: n, reason: String(err?.message || err) });
  }
  if (n % 25 === 0) {
    process.stderr.write(`… ${n}/${END} (${ok} سليمة، ${failures.length} فشل) — ${Math.round((Date.now() - t0) / 1000)}s\n`);
  }
}

await browser.close();
server.close();

const report = {
  range: [START, END],
  total: END - START + 1,
  ok,
  failed: failures.length,
  failures,
  elapsedSec: Math.round((Date.now() - t0) / 1000),
};
writeFileSync(join(root, "docs/mushaf-madinah/line-integrity-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ total: report.total, ok: report.ok, failed: report.failed, elapsedSec: report.elapsedSec }, null, 1));
if (failures.length > 0) {
  console.log("=== أول 10 فشل ===");
  console.log(JSON.stringify(failures.slice(0, 10), null, 1));
  process.exit(1);
}
