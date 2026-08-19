#!/usr/bin/env node
/**
 * بوابة البسملة — فحص ١١٤ سورة (QPC V2) عبر DOM (Playwright).
 *
 * قواعد بوابة المستخدم:
 * - تفشل إذا غابت البسملة في غير التوبة (سورة ٩).
 * - تفشل إذا ظهرت البسملة في التوبة (سورة ٩) — بالمعنى العددي/المكاني داخل صفحة بدء السورة.
 * - تفشل إذا حجم خط البسملة خرج عن ±٢٪ من حجم خط أسطر الآيات في نفس الصفحة.
 * - تفشل إذا حصل تقاطع bbox بين `.mm-basmala` وأية `.mm-ayah-line` ضمن نفس الصفحة.
 * - تفشل إذا البسملة ليست "سطرًا حقيقيًا" داخل `.mm-slot[data-kind="basmala"]`.
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
const pagesEnv = process.env.MUSHAF_GATE_PAGES || "";
const viewport = (process.env.MUSHAF_GATE_VIEWPORT || "390x844")
  .split("x")
  .map((n) => Number.parseInt(n, 10))
  .filter((n) => Number.isFinite(n));

const outDir = resolve(root, process.env.MUSHAF_VISUAL_OUT || "artifacts/mushaf-basmala-gate");
mkdirSync(outDir, { recursive: true });

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
      // SPA fallback
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

const chapters = loadJson(join(root, "public/data/quran-v2/chapters.json"));
const chaptersById = new Map(chapters.map((c) => [c.id, c]));

function parsePagesEnv() {
  if (!pagesEnv.trim()) {
    // كل صفحات بدء السور (١–١١٤): صفحات "pages[0]" من chapters.json.
    const set = new Set(chapters.map((c) => c.pages?.[0]).filter((n) => Number.isFinite(n) && n >= 1 && n <= 604));
    return [...set].sort((a, b) => a - b);
  }
  const parts = pagesEnv.split(",").map((p) => p.trim()).filter(Boolean);
  const out = [];
  for (const part of parts) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      for (let i = a; i <= b; i++) out.push(i);
    } else {
      out.push(Number(part));
    }
  }
  return [...new Set(out)].filter((n) => Number.isFinite(n) && n >= 1 && n <= 604).sort((a, b) => a - b);
}

const pages = parsePagesEnv().filter((_, idx) => idx % shards === shard - 1);

function surahStartsOnPage(raw) {
  const set = new Set();
  for (const v of raw) {
    const key = v.verse_key;
    if (typeof key !== "string") continue;
    if (!key.endsWith(":1")) continue;
    const sn = Number(key.split(":")[0]);
    if (Number.isFinite(sn)) set.add(sn);
  }
  return [...set].sort((a, b) => a - b);
}

function expectedBasmalaCountForPage(raw) {
  const starts = surahStartsOnPage(raw);
  let count = 0;
  for (const sn of starts) {
    const ch = chaptersById.get(sn);
    if (!ch) continue;
    if (ch.bismillah_pre) count++;
  }
  return count;
}

async function main() {
  const { base, stop } = await ensureBase();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewport[0], height: viewport[1] },
    locale: "ar-SA",
  });
  const page = await context.newPage();

  const failures = [];
  const rows = [];

  try {
    for (const pageNum of pages) {
      await page.goto(`${base}/mushaf?page=${pageNum}`, { waitUntil: "networkidle", timeout: 90_000 });
      await page.waitForSelector('[data-pane="current"] [data-testid="mushaf-page"]', { timeout: 60_000 });

      await page.waitForFunction(() => {
        const rootEl = document.querySelector('[data-pane="current"] [data-testid="mushaf-page"]');
        if (!rootEl) return false;
        const raw = rootEl.style.getPropertyValue("--mm-qpc-size") || getComputedStyle(rootEl).getPropertyValue("--mm-qpc-size");
        const px = parseFloat(raw);
        return Number.isFinite(px) && px >= 12;
      });

      // expected (data-level)
      const rawPath = join(root, "public/data/quran-v2/pages", `page-${String(pageNum).padStart(3, "0")}.json`);
      const raw = loadJson(rawPath);
      const expectedCount = expectedBasmalaCountForPage(raw);
      const starts = surahStartsOnPage(raw);
      const expectedStarts = starts.filter((sn) => chaptersById.get(sn)?.bismillah_pre);

      const metrics = await page.evaluate(() => {
        const current = document.querySelector('[data-pane="current"]');
        const basmalaElsAll = [
          ...(current?.querySelectorAll('.mm-basmala[data-basmala="qpc"]') ?? []),
        ];
        const ayahLines = [...(current?.querySelectorAll(".mm-ayah-line") ?? [])];

        const lineFontPx = (() => {
          const any = ayahLines[0];
          if (!any) return 0;
          return parseFloat(getComputedStyle(any).fontSize);
        })();

        const basmalaEls = basmalaElsAll.filter((el) => !!el.closest('.mm-slot[data-kind="basmala"]'));

        const basmalaFontPxList = basmalaEls.map((el) => parseFloat(getComputedStyle(el).fontSize));

        const basmalaSlots = basmalaEls.map((el) => {
          const slot = el.closest('.mm-slot[data-kind="basmala"]');
          return slot ? Number(slot.getAttribute("data-slot")) : null;
        });

        let overlap = false;
        const basmalaRects = basmalaEls.map((el) => el.getBoundingClientRect());
        const inkRects = [...(current?.querySelectorAll(".mm-ayah-line, .mm-surah-frame") ?? [])].map((el) =>
          el.getBoundingClientRect(),
        );
        for (const br of basmalaRects) {
          for (const ir of inkRects) {
            const overlapY = Math.min(br.bottom, ir.bottom) - Math.max(br.top, ir.top);
            const overlapX = Math.min(br.right, ir.right) - Math.max(br.left, ir.left);
            if (overlapY > 1 && overlapX > 1) {
              overlap = true;
              break;
            }
          }
          if (overlap) break;
        }

        return {
          basmalaCount: basmalaEls.length,
          lineFontPx,
          basmalaFontPxList,
          basmalaSlots,
          overlap,
        };
      });

      const issues = [];
      if (metrics.basmalaCount !== expectedCount) {
        issues.push(`count=${metrics.basmalaCount} expected=${expectedCount}`);
      }
      const ref = metrics.lineFontPx || 1;
      if (metrics.basmalaFontPxList.some((px) => px > 0 && Math.abs(px / ref - 1) > 0.02)) {
        issues.push("fontSizeOutside±2%");
      }
      if (metrics.basmalaSlots.some((s) => s == null)) {
        issues.push("basmalaNotInSlot");
      }
      if (metrics.overlap) issues.push("overlapBBox");

      if (expectedStarts.length === 0 && metrics.basmalaCount > 0) issues.push("unexpectedBasmalaOnNoBismillahPreSurahStarts");

      if (issues.length) {
        const snapPath = join(outDir, `page-${String(pageNum).padStart(3, "0")}.png`);
        await page.screenshot({ path: snapPath });
        failures.push({ page: pageNum, issues, expectedStarts, actualBasmalaCount: metrics.basmalaCount });
      }

      rows.push({
        page: pageNum,
        expectedCount,
        expectedStarts,
        actualCount: metrics.basmalaCount,
        issues,
      });
      console.log(pageNum, issues.length ? `FAIL ${issues.join(",")}` : "ok");
    }
  } finally {
    await browser.close();
    await stop();
  }

  writeFileSync(join(outDir, `report-basmala-${shard}.json`), JSON.stringify({ rows, failures }, null, 2));
  if (failures.length) {
    console.error("mushaf-basmala-all-114-gate failures:", failures.length);
    process.exit(1);
  }
  console.log("✓ mushaf-basmala-all-114-gate ok", pages.length, "pages");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

