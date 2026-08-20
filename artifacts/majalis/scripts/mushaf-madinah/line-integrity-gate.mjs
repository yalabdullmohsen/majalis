#!/usr/bin/env node
/**
 * بوابة سلامة الأسطر — المرجع الحقيقي الوحيد لـ«صفر سطر مقتطع».
 *
 * تحلّ محل الاعتماد على scrollWidth/clientWidth (mushaf-line-overflow-gate.test.ts
 * ولوحة الملاءمة الحيّة useMushafPageFontFit.ts): عناصر السلسلة كلها
 * `overflow: clip` لا `hidden`، وعنصر overflow:clip **لا يُسجِّل overflow
 * قابلاً للقياس في scrollWidth إطلاقاً مهما اقتُطع بصريًا** (سلوك موصوف في
 * CSS Overflow Module — وليس خللاً في القياس بل غياب دلالة أصلاً). لذلك
 * انفلت عطل اقتطاع حقيقي (grid-template-columns مفقود على .mm-page__body،
 * راجع feat/mushaf-round-2) عبر ١٣ بوابة CI مطلوبة دون أن تلتقطه أيّ منها.
 *
 * هذه البوابة تقيس عرض السطر **المرسوم فعلياً** عبر Chromium حقيقي:
 * getBoundingClientRect لكل كلمة مقابل getBoundingClientRect لحدود والدها
 * (.mm-page__body) — تكشف تجاوز الشبكة (grid) وoverflow:clip معاً، بصرف
 * النظر عن قيمة scrollWidth. كذلك تطابق النص المرسوم حرفياً مع نص المصدر
 * (public/data/quran-v2/pages/page-N.json).
 *
 * التشغيل: يعيد استخدام preview الحيّ عبر MUSHAF_GATE_BASE_URL/BASE_URL إن
 * وُجد (نمط مطابق لـ scripts/mushaf-madinah/visual-snapshot.mjs — نفس الخادم
 * المستخدَم في وظيفة mushaf-gates بـ CI)، وإلا يبني خادمًا ثابتًا محليًا من
 * dist/ (يتطلب `pnpm build` مسبقًا).
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const root = process.argv[2];
const dist = join(root, "dist");
const dataDir = join(root, "public/data/quran-v2/pages");
const START = Number(process.argv[3] || 1);
const END = Number(process.argv[4] || 604);
const baseFromEnv = process.env.MUSHAF_GATE_BASE_URL || process.env.BASE_URL || "";

function ct(f) {
  const e = extname(f).toLowerCase();
  if (e === ".html") return "text/html; charset=utf-8";
  if (e === ".js") return "text/javascript; charset=utf-8";
  if (e === ".css") return "text/css; charset=utf-8";
  if (e === ".json") return "application/json";
  if (e === ".woff2") return "font/woff2";
  return "application/octet-stream";
}

async function ensurePreview() {
  if (baseFromEnv) return { base: baseFromEnv.replace(/\/$/, ""), stop: async () => {} };

  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("dist/index.html مفقود — شغّل pnpm build أولًا أو عيّن MUSHAF_GATE_BASE_URL");
  }
  const port = Number(process.env.MUSHAF_LINE_INTEGRITY_PORT || 24295);
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
  await new Promise((r, reject) => {
    server.listen(port, "127.0.0.1", r);
    server.on("error", reject);
  });
  return { base: `http://127.0.0.1:${port}`, stop: () => new Promise((r) => server.close(() => r())) };
}

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

const { base, stop } = await ensurePreview();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: "ar-SA" });
const page = await context.newPage();
page.setDefaultTimeout(20000);

const failures = [];
let ok = 0;
const t0 = Date.now();

for (let n = START; n <= END; n++) {
  try {
    await page.goto(`${base}/mushaf?page=${n}`, { waitUntil: "domcontentloaded" });
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
await stop();

const report = {
  range: [START, END],
  total: END - START + 1,
  ok,
  failed: failures.length,
  failures,
  elapsedSec: Math.round((Date.now() - t0) / 1000),
};
writeFileSync(join(root, "docs/mushaf-madinah/line-integrity-report.json"), JSON.stringify(report, null, 2));

if (failures.length > 0) {
  console.log(`${report.total - report.failed}/${report.total} صفحة سليمة · ${report.failed} سطر/صفحة فيها اقتطاع أو خلل نصي`);
  console.log("=== أول 10 فشل ===");
  console.log(JSON.stringify(failures.slice(0, 10), null, 1));
  process.exit(1);
} else {
  console.log(`✓ mushaf-line-integrity: ${report.ok}/${report.total} صفحة سليمة · صفر سطر مقتطع (${report.elapsedSec}s)`);
}
