#!/usr/bin/env node
/**
 * بوابة إبراز الآية (Playwright) — نتحقق بشكل قابل للاختبار:
 * - عند اختيار آية 2:1 عبر النقر على كلمة فيها
 * - كل كلمات الآية لها class `ayah-active`
 * - وأنها لا تملك class `is-selected` (أي تعطيل word-level highlight افتراضاً)
 * - وأن كل كلمة تحمل data-ayah="2:1"
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

const shard = Number(process.env.MUSHAF_GATE_SHARD || 1);
const viewport = (process.env.MUSHAF_GATE_VIEWPORT || "390x844")
  .split("x")
  .map((n) => Number.parseInt(n, 10))
  .filter((n) => Number.isFinite(n));

const outDir = resolve(root, process.env.MUSHAF_VISUAL_OUT || "artifacts/mushaf-ayah-highlight-gate");
mkdirSync(outDir, { recursive: true });

const pageNum = 2;
const verseKey = "2:1";

function contentType(file) {
  const e = extname(file).toLowerCase();
  if (e === ".html") return "text/html; charset=utf-8";
  if (e === ".js") return "text/javascript; charset=utf-8";
  if (e === ".css") return "text/css; charset=utf-8";
  if (e === ".json") return "application/json";
  if (e === ".woff2") return "font/woff2";
  return "application/octet-stream";
}

async function ensureBase() {
  if (process.env.MUSHAF_GATE_BASE_URL) {
    const base = process.env.MUSHAF_GATE_BASE_URL.replace(/\/$/, "");
    return { base, stop: async () => {} };
  }
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) throw new Error("dist مفقود — شغّل pnpm build أولًا");
  const port = 24216 + (shard % 20);
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    let path = decodeURIComponent(url.pathname);
    if (path === "/") path = "/index.html";
    const file = join(dist, path);
    if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      createReadStream(join(dist, "index.html")).pipe(res);
      return;
    }
    res.writeHead(200, { "Content-Type": contentType(file) });
    createReadStream(file).pipe(res);
  });
  await new Promise((resolveP, reject) => {
    server.listen(port, "127.0.0.1", () => resolveP());
    server.on("error", reject);
  });
  return { base: `http://127.0.0.1:${port}`, stop: async () => new Promise((r) => server.close(() => r())) };
}

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

async function main() {
  const rawPath = join(root, "public/data/quran-v2/pages", `page-${String(pageNum).padStart(3, "0")}.json`);
  const raw = loadJson(rawPath);
  const verse = raw.find((v) => v.verse_key === verseKey);
  const expectedWordCount = verse ? (Array.isArray(verse.words) ? verse.words.length : 0) : 0;

  const { base, stop } = await ensureBase();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewport[0] ?? 390, height: viewport[1] ?? 844 },
    locale: "ar-SA",
  });
  const page = await context.newPage();

  try {
    await page.goto(`${base}/mushaf?page=${pageNum}`, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForSelector('[data-pane="current"] [data-testid="mushaf-page"]', { timeout: 60_000 });
    await page.waitForTimeout(350);

    // منع أزرار قلب الصفحة من اعتراض pointer أثناء بوابة التظليل
    await page.evaluate(() => {
      for (const el of document.querySelectorAll(".mm-page-edge")) {
        el.style.pointerEvents = "none";
      }
    });

    const hit = page.locator(`.mm-ayah-hit[data-verse="${verseKey}"]`).first();
    if ((await hit.count()) === 0) throw new Error(`No DOM hits for verse ${verseKey}`);
    await hit.click({ timeout: 10_000 });
    await page.waitForTimeout(250);

    const metrics = await page.evaluate((verseKey) => {
      const current = document.querySelector('[data-pane="current"]');
      const hits = [...(current?.querySelectorAll(`.mm-ayah-hit[data-verse="${verseKey}"]`) ?? [])];
      return hits.map((el) => ({
        classList: el.className,
        hasAyahActive: el.classList.contains("ayah-active"),
        hasIsSelected: el.classList.contains("is-selected"),
        dataAyah: el.getAttribute("data-ayah"),
      }));
    }, verseKey);

    const wordCount = metrics.length;
    const allAyahActive = metrics.every((m) => m.hasAyahActive);
    const noneIsSelected = metrics.every((m) => !m.hasIsSelected);
    const allDataAyah = metrics.every((m) => m.dataAyah === verseKey);

    const failures = [];
    if (wordCount !== expectedWordCount) failures.push(`countMismatch dom=${wordCount} expected=${expectedWordCount}`);
    if (!allAyahActive) failures.push("notAllWordsHaveAyahActive");
    if (!noneIsSelected) failures.push("someWordsHaveIsSelected");
    if (!allDataAyah) failures.push("dataAyahMissingOrWrong");

    if (failures.length) {
      await page.screenshot({ path: join(outDir, `page-${String(pageNum).padStart(3, "0")}-ayah-highlight-fail.png`) });
      writeFileSync(
        join(outDir, `page-${String(pageNum).padStart(3, "0")}-ayah-highlight-metrics.json`),
        JSON.stringify({ expectedWordCount, failures, metrics }, null, 2),
      );
      console.error("mushaf-ayah-highlight gate failures:", failures);
      process.exit(1);
    }

    console.log("✓ mushaf-ayah-highlight gate ok", { wordCount, expectedWordCount });
  } finally {
    await browser.close();
    await stop();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

