#!/usr/bin/env node
/**
 * قياس خفيف لصفحات المصحف الجديدة (بديل single-pass القديم).
 * يكتب JSON لكل shard لاستهلاك assert/layout-bands.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const out = process.env.MUSHAF_SINGLE_PASS_OUT || "artifacts/mushaf-single-pass/measurements.json";
const outPath = resolve(root, out);
mkdirSync(dirname(outPath), { recursive: true });

const shard = Number(process.env.MUSHAF_GATE_SHARD || 1);
const shards = Number(process.env.MUSHAF_GATE_SHARDS || 1);
const pagesEnv = process.env.MUSHAF_GATE_PAGES || "1,2,3,4,598,602";
const allPages = pagesEnv
  .split(",")
  .map((x) => Number(x.trim()))
  .filter((n) => n >= 1 && n <= 604);
const pages = allPages.filter((_, i) => i % shards === shard - 1);
const [vw, vh] = (process.env.MUSHAF_GATE_VIEWPORT || "390x844").split("x").map(Number);

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
    return { base: process.env.MUSHAF_GATE_BASE_URL.replace(/\/$/, ""), stop: async () => {} };
  }
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("dist مفقود — ابنِ الحزمة أولًا");
  }
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
  return {
    base: `http://127.0.0.1:${port}`,
    stop: () => new Promise((r) => server.close(() => r())),
  };
}

async function main() {
  if (!pages.length) {
    writeFileSync(outPath, JSON.stringify({ shard, pages: [], measurements: [] }, null, 2));
    console.log("empty shard", shard);
    return;
  }

  const { base, stop } = await ensureBase();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: vw || 390, height: vh || 844 } });
  const page = await context.newPage();
  const measurements = [];

  try {
    for (const n of pages) {
      await page.goto(`${base}/mushaf?page=${n}`, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForSelector('[data-pane="current"] [data-testid="mushaf-page"]', { timeout: 45_000 });
      const m = await page.evaluate(() => {
        const current = document.querySelector('[data-pane="current"]');
        const rootEl = current?.querySelector('[data-testid="mushaf-page"]');
        const frame = current?.querySelector('[data-testid="mushaf-page-frame"]');
        const line =
          current?.querySelector(".mm-ayah-line") || current?.querySelector(".mm-basmala");
        const rect = frame?.getBoundingClientRect();
        const pageEl = rootEl;
        const familyRaw = pageEl
          ? getComputedStyle(pageEl).getPropertyValue("--mm-qpc-family").trim()
          : "";
        const family = familyRaw.replace(/^["']+|["']+$/g, "");
        const fontCheck = family
          ? document.fonts.check(`16px "${family}"`) || document.fonts.check(`16px ${family}`)
          : false;
        const fontSize = line ? parseFloat(getComputedStyle(line).fontSize) : 0;
        const pageOverflow =
          !!pageEl && pageEl.scrollWidth > pageEl.clientWidth + 1;
        const lineOverflow = pageEl
          ? [...pageEl.querySelectorAll(".mm-ayah-line, .mm-basmala")].some(
              (el) => el.scrollWidth > el.clientWidth + 1,
            )
          : true;
        const ink = pageEl
          ? [...pageEl.querySelectorAll(".mm-slot")]
          : [];
        let overlap = false;
        for (const slot of ink) {
          const kind = slot.getAttribute("data-kind");
          if (kind === "empty") continue;
          const slotBox = slot.getBoundingClientRect();
          if (slotBox.height < 2) continue;
          for (const glyph of slot.querySelectorAll(
            ".mm-ayah-line, .mm-basmala, .mm-surah-frame",
          )) {
            const box = glyph.getBoundingClientRect();
            if (box.bottom > slotBox.bottom + 1.5 || box.top < slotBox.top - 1.5) overlap = true;
          }
        }
        return {
          pageAttr: rootEl?.getAttribute("data-page"),
          slots: current?.querySelectorAll(".mm-slot").length ?? 0,
          ayahLines: current?.querySelectorAll(".mm-ayah-line").length ?? 0,
          banners: current?.querySelectorAll(".mm-surah-frame").length ?? 0,
          fontFamily: line ? getComputedStyle(line).fontFamily : "",
          frameWidth: rect?.width ?? 0,
          frameHeight: rect?.height ?? 0,
          hasPdf: !!document.querySelector("embed[type='application/pdf'], iframe[src*='.pdf']"),
          fontCheck,
          fontSize,
          pageOverflow,
          lineOverflow,
          overlap,
        };
      });
      measurements.push({
        page: n,
        ...m,
        ok:
          (n <= 2 ? m.slots > 0 && m.slots <= 15 : m.slots === 15) &&
          !m.hasPdf &&
          /qpc-v2-p/i.test(m.fontFamily) &&
          String(m.pageAttr) === String(n) &&
          m.fontCheck === true &&
          m.fontSize >= 12 &&
          m.fontSize <= 34 &&
          m.pageOverflow === false &&
          m.lineOverflow === false &&
          m.overlap === false,
      });
      console.log("measured", n, measurements.at(-1).ok ? "ok" : "FAIL", m.fontFamily);
    }
  } finally {
    await browser.close();
    await stop();
  }

  writeFileSync(outPath, JSON.stringify({ shard, viewport: `${vw}x${vh}`, measurements }, null, 2));
  if (measurements.some((x) => !x.ok)) process.exit(1);
  console.log("✓ measure wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
