#!/usr/bin/env node
/**
 * بوابة الضبط (Page 77 — الأن النّساء) عبر قياس:
 * - أقصى فراغ بين كلمات السطر (word gap) عبر bbox
 * - letter-spacing على كلمات العربية
 * - امتداد السطر/الكلمات خارج عرض منطقة الصفحة
 *
 * المرجع: `layout-bands.ts`
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

const shard = Number(process.env.MUSHAF_GATE_SHARD || 1);
const shards = Number(process.env.MUSHAF_GATE_SHARDS || 1);
const viewport = (process.env.MUSHAF_GATE_VIEWPORT || "390x844")
  .split("x")
  .map((n) => Number.parseInt(n, 10))
  .filter((n) => Number.isFinite(n));

const outDir = resolve(root, process.env.MUSHAF_VISUAL_OUT || "artifacts/mushaf-justify-gate");
mkdirSync(outDir, { recursive: true });

const pageNum = 77;

// من `layout-bands.ts` (نفس القيم دون استيراد TS داخل سكربت mjs).
const WORD_GAP_SOFT_MAX_PX = 15;
const WORD_GAP_HARD_MAX_PX = 20;

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

async function main() {
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
    await page.waitForFunction(() => {
      const rootEl = document.querySelector('[data-pane="current"] [data-testid="mushaf-page"]');
      if (!rootEl) return false;
      const raw = rootEl.style.getPropertyValue("--mm-qpc-size") || getComputedStyle(rootEl).getPropertyValue("--mm-qpc-size");
      const px = parseFloat(raw);
      return Number.isFinite(px) && px >= 12;
    }, { timeout: 45_000 });
    await page.waitForTimeout(250);

    const metrics = await page.evaluate(({ hardMax, softMax }) => {
      const current = document.querySelector('[data-pane="current"]');
      const pageEl = current?.querySelector('[data-testid="mushaf-page"]');
      const bodyRect = pageEl?.getBoundingClientRect();
      const lines = [...(pageEl?.querySelectorAll(".mm-ayah-line") ?? [])];

      let maxGapPx = 0;
      let worst = null;
      let letterSpacingNonZero = false;
      let overflowOutOfBlock = false;

      for (const line of lines) {
        const words = [...(line.querySelectorAll(".mm-ayah-line__word") ?? [])];
        const wordRects = words.map((w) => ({
          el: w,
          r: w.getBoundingClientRect(),
        }));
        // order by left coordinate for gap computation
        wordRects.sort((a, b) => a.r.left - b.r.left);
        for (let i = 0; i < wordRects.length - 1; i++) {
          const a = wordRects[i];
          const b = wordRects[i + 1];
          const gap = b.r.left - a.r.right;
            if (gap > maxGapPx) {
            maxGapPx = gap;
              worst = {
                gap,
                i,
                lineCentered: line.dataset.centered,
                lineFill: line.dataset.fill,
                wordCount: wordRects.length,
              };
          }
        }

        for (const { el, r } of wordRects) {
          const lsRaw = getComputedStyle(el).letterSpacing;
          const ls = parseFloat(lsRaw);
          if (Number.isFinite(ls) && Math.abs(ls) > 0.01) letterSpacingNonZero = true;
          if (bodyRect) {
            if (r.left < bodyRect.left - 1 || r.right > bodyRect.right + 1) overflowOutOfBlock = true;
          }
        }
      }

      return { maxGapPx, worst, letterSpacingNonZero, overflowOutOfBlock, softMax, hardMax };
    }, { hardMax: WORD_GAP_HARD_MAX_PX, softMax: WORD_GAP_SOFT_MAX_PX });

    const failures = [];
    if (metrics.letterSpacingNonZero) failures.push("letter-spacing!=0");
    if (metrics.overflowOutOfBlock) failures.push("lineOverflowOutOfBlock");
    if (metrics.maxGapPx > metrics.hardMax + 0.5) failures.push(`wordGapExceedsHardMax maxGap=${metrics.maxGapPx.toFixed(1)}px`);

    if (failures.length) {
      await page.screenshot({ path: join(outDir, `page-${String(pageNum).padStart(3, "0")}-justify-fail.png`) });
      writeFileSync(join(outDir, `page-${String(pageNum).padStart(3, "0")}-justify-metrics.json`), JSON.stringify({ metrics, failures }, null, 2));
      console.error("mushaf-justify gate failures:", failures, metrics);
      process.exit(1);
    }

    console.log("✓ mushaf-justify gate ok", { maxGapPx: metrics.maxGapPx.toFixed(1), hardMax: WORD_GAP_HARD_MAX_PX, softMax: WORD_GAP_SOFT_MAX_PX });
  } finally {
    await browser.close();
    await stop();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

