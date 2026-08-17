#!/usr/bin/env node
/**
 * تجهيزة ذهبية للمصحف — صفحات 1,2,3,5,12,50,255,400,604 × 320/390/430.
 * كتابة: MUSHAF_FREEZE_WRITE=1 node scripts/mushaf-madinah/freeze-baseline.mjs
 * مقارنة (CI): node scripts/mushaf-madinah/freeze-baseline.mjs
 */
import { createServer } from "node:http";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const goldenDir = resolve(root, "docs/mushaf-madinah/golden");
const metricsPath = join(goldenDir, "golden-metrics.json");
const fpPath = join(goldenDir, "golden-fingerprints.json");
const pages = [1, 2, 3, 5, 12, 50, 255, 400, 604];
const widths = [320, 390, 430];
const vh = 844;
const fpW = 80;
const fpH = 160;
const writeMode = process.env.MUSHAF_FREEZE_WRITE === "1";
const REF_COMMIT = "20357d9ab2c01fff23fa44ed89e28c253c0773a4";
const REF_TAG = "mushaf-good-20357d9ab";
const TOL = {
  fontSizePx: 0.51,
  widestLinePx: 2,
  blockHeightPx: 2,
  lineCount: 0,
  fingerprintMad: 6,
};

mkdirSync(goldenDir, { recursive: true });

function contentType(file) {
  const e = extname(file).toLowerCase();
  if (e === ".html") return "text/html; charset=utf-8";
  if (e === ".js") return "text/javascript; charset=utf-8";
  if (e === ".css") return "text/css; charset=utf-8";
  if (e === ".json") return "application/json";
  if (e === ".woff2") return "font/woff2";
  if (e === ".png") return "image/png";
  return "application/octet-stream";
}

async function ensurePreview() {
  const baseFromEnv = process.env.MUSHAF_GATE_BASE_URL || process.env.BASE_URL || "";
  if (baseFromEnv) return { base: baseFromEnv.replace(/\/$/, ""), stop: async () => {} };

  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("dist/index.html مفقود — شغّل pnpm build أو عيّن MUSHAF_GATE_BASE_URL");
  }
  const port = Number(process.env.MUSHAF_FREEZE_PORT || 24218);
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

function keyOf(page, vw) {
  return `${page}@${vw}`;
}

function mad(a, b) {
  if (!a || !b || a.length !== b.length) return 255;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}

async function fingerprintFromPng(page, pngBuf) {
  const b64 = pngBuf.toString("base64");
  return page.evaluate(
    async ({ b64, fpW, fpH }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = fpW;
      c.height = fpH;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, fpW, fpH);
      const data = ctx.getImageData(0, 0, fpW, fpH).data;
      const gray = new Uint8Array(fpW * fpH);
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        gray[p] = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      }
      let bin = "";
      for (let i = 0; i < gray.length; i++) bin += String.fromCharCode(gray[i]);
      return btoa(bin);
    },
    { b64, fpW, fpH },
  );
}

function decodeFp(b64) {
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

async function main() {
  const { base, stop } = await ensurePreview();
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const metrics = {
    refCommit: REF_COMMIT,
    refTag: REF_TAG,
    viewportHeight: vh,
    pages,
    widths,
    tolerance: TOL,
    cells: {},
  };
  const fingerprints = { refCommit: REF_COMMIT, cells: {} };

  let expected = null;
  let expectedFp = null;
  if (!writeMode) {
    if (!existsSync(metricsPath) || !existsSync(fpPath)) {
      throw new Error("التجهيزة الذهبية مفقودة — شغّل MUSHAF_FREEZE_WRITE=1 أولًا");
    }
    expected = JSON.parse(readFileSync(metricsPath, "utf8"));
    expectedFp = JSON.parse(readFileSync(fpPath, "utf8"));
  }

  try {
    for (const vw of widths) {
      const context = await browser.newContext({
        viewport: { width: vw, height: vh },
        deviceScaleFactor: 1,
        locale: "ar-SA",
      });
      const page = await context.newPage();
      for (const n of pages) {
        const url = `${base}/mushaf?page=${n}`;
        await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
        await page.waitForSelector('[data-pane="current"] [data-testid="mushaf-page"]', {
          timeout: 45_000,
        });
        await page.evaluate(() => {
          const el = document.querySelector('[data-testid="mushaf-controls"]');
          if (el) el.setAttribute("data-open", "0");
        });
        await page.waitForTimeout(350);
        const paint = await page.evaluate(() => {
          const current = document.querySelector('[data-pane="current"]');
          const pageEl = current?.querySelector('[data-testid="mushaf-page"]');
          const body = current?.querySelector(".mm-page__body");
          const lines = current
            ? [...current.querySelectorAll(".mm-ayah-line, .mm-basmala")]
            : [];
          const fontSize = lines[0] ? parseFloat(getComputedStyle(lines[0]).fontSize) : 0;
          const widestLinePx = lines.length
            ? Math.max(...lines.map((el) => el.scrollWidth))
            : 0;
          const blockHeightPx = body ? body.getBoundingClientRect().height : 0;
          const lineCount = current
            ? current.querySelectorAll('.mm-slot[data-kind="line"]').length
            : 0;
          const familyRaw = pageEl
            ? getComputedStyle(pageEl).getPropertyValue("--mm-qpc-family").trim()
            : "";
          return {
            fontSize,
            widestLinePx,
            blockHeightPx,
            lineCount,
            family: familyRaw.replace(/^["']+|["']+$/g, ""),
          };
        });
        const pngName = `p${String(n).padStart(3, "0")}-w${vw}.png`;
        const pngPath = join(goldenDir, pngName);
        const buf = await page.locator('[data-testid="mushaf-viewport"]').screenshot({ type: "png" });
        const fp = await fingerprintFromPng(page, buf);
        const cellKey = keyOf(n, vw);
        metrics.cells[cellKey] = paint;
        fingerprints.cells[cellKey] = fp;

        if (writeMode) {
          writeFileSync(pngPath, buf);
          console.log(`write ${pngName}`, paint);
          continue;
        }

        const exp = expected.cells?.[cellKey];
        if (!exp) {
          failures.push({ cell: cellKey, reason: "missing-metric" });
          continue;
        }
        if (Math.abs(paint.fontSize - exp.fontSize) > TOL.fontSizePx) {
          failures.push({
            cell: cellKey,
            reason: "fontSize",
            got: paint.fontSize,
            expected: exp.fontSize,
          });
        }
        if (Math.abs(paint.widestLinePx - exp.widestLinePx) > TOL.widestLinePx) {
          failures.push({
            cell: cellKey,
            reason: "widestLinePx",
            got: paint.widestLinePx,
            expected: exp.widestLinePx,
          });
        }
        if (Math.abs(paint.blockHeightPx - exp.blockHeightPx) > TOL.blockHeightPx) {
          failures.push({
            cell: cellKey,
            reason: "blockHeightPx",
            got: paint.blockHeightPx,
            expected: exp.blockHeightPx,
          });
        }
        if (Math.abs(paint.lineCount - exp.lineCount) > TOL.lineCount) {
          failures.push({
            cell: cellKey,
            reason: "lineCount",
            got: paint.lineCount,
            expected: exp.lineCount,
          });
        }
        if (!existsSync(pngPath)) {
          failures.push({ cell: cellKey, reason: "missing-png" });
        }
        const expFp = expectedFp.cells?.[cellKey];
        const diff = mad(decodeFp(fp), decodeFp(expFp || ""));
        if (diff > TOL.fingerprintMad) {
          failures.push({ cell: cellKey, reason: "visual", mad: Number(diff.toFixed(2)) });
        } else {
          console.log(`ok ${cellKey} font=${paint.fontSize} mad=${diff.toFixed(2)}`);
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
    await stop();
  }

  if (writeMode) {
    writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
    writeFileSync(fpPath, JSON.stringify(fingerprints));
    console.log("✓ freeze-baseline wrote", goldenDir);
    return;
  }

  if (failures.length) {
    console.error("فشل التجهيزة الذهبية:", JSON.stringify(failures, null, 2));
    process.exit(1);
  }
  console.log("✓ mushaf freeze-baseline ok", pages.join(","), widths.join("/"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
