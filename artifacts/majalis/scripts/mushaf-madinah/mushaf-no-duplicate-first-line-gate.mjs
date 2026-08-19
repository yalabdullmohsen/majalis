#!/usr/bin/env node
/**
 * بوابة السطر الأول المكرر — نفحص s:1 في صفحات بدء السور (Playwright).
 *
 * الفكرة:
 * 1) من بيانات QPC V2 `public/data/quran-v2/pages/page-XXX.json` نحدد:
 *    - ما السور التي تبدأ على هذه الصفحة (آيتها الأولى = verse_key ينتهي بـ ":1")
 *    - والعدد المتوقع من كلمات الآية الأولى s:1 (عدد عناصر `words` في الكائن الخاص بالآية)
 * 2) في DOM داخل `data-pane="current"` نعد:
 *    - عدد العناصر `.mm-ayah-hit[data-verse="${s}:1"]`
 * 3) يجب أن يطابق DOM العدد المتوقع تماماً؛ أي “سطر مصغّر مكرر فوق النص” يرفع العدد.
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

const outDir = resolve(root, process.env.MUSHAF_VISUAL_OUT || "artifacts/mushaf-duplicate-first-line-gate");
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
    // صفحات بدء السور ٢–١١٤ فقط (بدون الفاتحة لأن DOM الخاص بها لا يستخدم `.mm-ayah-hit`).
    const set = new Set(
      chapters
        .map((c) => c.pages?.[0])
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 604 && n != null),
    );
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
    if (!Number.isFinite(sn)) continue;
    if (sn === 1) continue;
    set.add(sn);
  }
  return [...set].sort((a, b) => a - b);
}

function expectedWordCountForVerse(raw, verseKey) {
  // raw: array of { verse_key, words:[...] }
  const verse = raw.find((v) => v.verse_key === verseKey);
  if (!verse) return 0;
  return Array.isArray(verse.words) ? verse.words.length : 0;
}

async function main() {
  const { base, stop } = await ensureBase();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewport[0] ?? 390, height: viewport[1] ?? 844 },
    locale: "ar-SA",
  });
  const page = await context.newPage();

  const rows = [];
  const failures = [];

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
      }, { timeout: 45_000 });

      const rawPath = join(root, "public/data/quran-v2/pages", `page-${String(pageNum).padStart(3, "0")}.json`);
      const raw = loadJson(rawPath);
      const starts = surahStartsOnPage(raw);

      const metrics = await page.evaluate(({ starts }) => {
        const current = document.querySelector('[data-pane="current"]');
        const counts = {};
        for (const sn of starts) {
          const verseKey = `${sn}:1`;
          const hits = [...(current?.querySelectorAll(`.mm-ayah-hit[data-verse="${verseKey}"]`) ?? [])];
          counts[verseKey] = hits.length;
        }
        return counts;
      }, { starts });

      const issues = [];
      for (const sn of starts) {
        const verseKey = `${sn}:1`;
        const expected = expectedWordCountForVerse(raw, verseKey);
        const actual = metrics[verseKey] ?? 0;
        if (expected !== actual) {
          issues.push(`${verseKey} count DOM=${actual} expected=${expected}`);
        }
      }

      rows.push({ page: pageNum, starts, issues });
      if (issues.length) {
        const snapPath = join(outDir, `page-${String(pageNum).padStart(3, "0")}.png`);
        await page.screenshot({ path: snapPath });
        failures.push({ page: pageNum, issues });
        console.log(pageNum, `FAIL ${issues.join(" | ")}`);
      } else {
        console.log(pageNum, "ok");
      }
    }
  } finally {
    await browser.close();
    await stop();
  }

  writeFileSync(join(outDir, `report-dup-first-line-${shard}.json`), JSON.stringify({ rows, failures }, null, 2));
  if (failures.length) {
    console.error("mushaf-no-duplicate-first-line-gate failures:", failures.length);
    process.exit(1);
  }
  console.log("✓ mushaf-no-duplicate-first-line-gate ok", pages.length, "pages");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

