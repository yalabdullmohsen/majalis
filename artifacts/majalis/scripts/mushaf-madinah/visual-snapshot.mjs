#!/usr/bin/env node
/**
 * لقطات بصرية للمصحف الجديد — صفحات 1,2,3,4,598,602
 * تشغيل: MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/mushaf-madinah/visual-snapshot.mjs
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, writeFileSync, statSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const outDir = resolve(root, "docs/mushaf-madinah/snapshots");
const pages = [1, 2, 3, 4, 5, 7, 48, 283, 600, 603];
const viewport = { width: 390, height: 844 };
const baseFromEnv = process.env.MUSHAF_GATE_BASE_URL || process.env.BASE_URL || "";

mkdirSync(outDir, { recursive: true });

function contentType(file) {
  const e = extname(file).toLowerCase();
  if (e === ".html") return "text/html; charset=utf-8";
  if (e === ".js") return "text/javascript; charset=utf-8";
  if (e === ".css") return "text/css; charset=utf-8";
  if (e === ".json") return "application/json";
  if (e === ".woff2") return "font/woff2";
  if (e === ".svg") return "image/svg+xml";
  if (e === ".png") return "image/png";
  return "application/octet-stream";
}

async function ensurePreview() {
  if (baseFromEnv) return { base: baseFromEnv.replace(/\/$/, ""), stop: async () => {} };

  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("dist/index.html مفقود — شغّل pnpm build أولًا أو عيّن MUSHAF_GATE_BASE_URL");
  }

  const port = Number(process.env.MUSHAF_SNAPSHOT_PORT || 24217);
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    let path = decodeURIComponent(url.pathname);
    if (path === "/") path = "/index.html";
    const file = join(dist, path);
    if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
      // SPA fallback
      const index = join(dist, "index.html");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      createReadStream(index).pipe(res);
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
  const { base, stop } = await ensurePreview();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    locale: "ar-SA",
  });
  const page = await context.newPage();
  const report = [];

  try {
    for (const n of pages) {
      const url = `${base}/mushaf?page=${n}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForSelector('[data-pane="current"] [data-testid="mushaf-page"]', { timeout: 45_000 });
      // أخفِ الأدوات للقطة نظيفة
      await page.evaluate(() => {
        const el = document.querySelector('[data-testid="mushaf-controls"]');
        if (el) el.setAttribute("data-open", "0");
      });
      await page.waitForTimeout(400);
      const paint = await page.evaluate(() => {
        const current = document.querySelector('[data-pane="current"]');
        const pageEl = current?.querySelector('[data-testid="mushaf-page"]');
        const line = current?.querySelector(
          ".nm-line, .nm-basmala, .mm-ayah-line, .mm-basmala",
        );
        const familyRaw = pageEl
          ? (
              getComputedStyle(pageEl).getPropertyValue("--nm-qpc-family").trim() ||
              getComputedStyle(pageEl).getPropertyValue("--mm-qpc-family").trim()
            )
          : "";
        const family = familyRaw.replace(/^["']+|["']+$/g, "");
        const fontCheck = family
          ? document.fonts.check(`16px "${family}"`) || document.fonts.check(`16px ${family}`)
          : false;
        const fontSize = line ? parseFloat(getComputedStyle(line).fontSize) : 0;
        const pageOverflow = !!pageEl && pageEl.scrollWidth > pageEl.clientWidth + 1;
        const lineOverflow = pageEl
          ? [...pageEl.querySelectorAll(".nm-line, .nm-basmala, .mm-ayah-line, .mm-basmala")].some(
              (el) => el.scrollWidth > el.clientWidth + 1,
            )
          : true;
        const ink = pageEl ? [...pageEl.querySelectorAll(".nm-slot, .mm-slot")] : [];
        let overlap = false;
        for (const slot of ink) {
          const kind = slot.getAttribute("data-kind");
          if (kind !== "line") continue;
          const slotBox = slot.getBoundingClientRect();
          if (slotBox.height < 2) continue;
          for (const glyph of slot.querySelectorAll(
            ".nm-line, .nm-basmala, .mm-ayah-line, .mm-basmala",
          )) {
            const box = glyph.getBoundingClientRect();
            if (box.bottom > slotBox.bottom + 1.5 || box.top < slotBox.top - 1.5) overlap = true;
          }
        }
        const body = pageEl?.querySelector(".nm-page__body, .mm-page__body");
        const slots = body ? [...body.querySelectorAll(".nm-slot, .mm-slot")] : [];
        const lineSlots = slots.filter((el) => el.getAttribute("data-kind") === "line");
        const slotHeights = slots.map((el) => el.getBoundingClientRect().height);
        const avgH = slotHeights.length
          ? slotHeights.reduce((a, b) => a + b, 0) / slotHeights.length
          : 0;
        const baselineDev = slotHeights.length
          ? Math.max(...slotHeights.map((h) => Math.abs(h - avgH)))
          : 0;
        const lineTops = lineSlots.map((el) => el.getBoundingClientRect().top).sort((a, b) => a - b);
        const gaps = [];
        for (let i = 1; i < lineTops.length; i++) gaps.push(lineTops[i] - lineTops[i - 1]);
        const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
        const gapDev = gaps.length ? Math.max(...gaps.map((g) => Math.abs(g - avgGap))) : 0;
        const lineSum = lineSlots.reduce((s, el) => s + el.getBoundingClientRect().height, 0);
        const bodyH = body ? body.getBoundingClientRect().height : 0;
        const opening = pageEl?.getAttribute("data-opening") === "1";
        return {
          fontCheck,
          fontSize,
          pageOverflow,
          lineOverflow,
          overlap,
          family,
          opening,
          domSlots: slots.length,
          lineSlots: lineSlots.length,
          baselineDev,
          gapDev,
          lineSum,
          bodyH,
          heightFit: lineSum <= bodyH + 2,
        };
      });
      const file = join(outDir, `page-${String(n).padStart(3, "0")}.png`);
      await page.locator('[data-testid="mushaf-viewport"]').screenshot({ path: file });
      const hasPdf = await page.evaluate(() => !!document.querySelector("embed[type='application/pdf'], iframe[src*='.pdf'], canvas.mm-pdf"));
      const font = await page.evaluate(() => {
        const current = document.querySelector('[data-pane="current"]');
        const line = current?.querySelector(
          ".nm-line, .nm-basmala, .mm-ayah-line, .mm-basmala",
        );
        return line ? getComputedStyle(line).fontFamily : "";
      });
      const lineSlots = await page
        .locator('[data-pane="current"] .nm-slot .nm-line, [data-pane="current"] .mm-slot .mm-ayah-line')
        .count();
      const openingMax = n <= 2 ? 46 : 35;
      report.push({
        page: n,
        file: file.replace(root + "/", ""),
        hasPdf,
        fontFamily: font,
        ayahLineCount: lineSlots,
        ...paint,
        ok:
          !hasPdf &&
          /qpc-v2-p/i.test(font) &&
          lineSlots > 0 &&
          paint.fontCheck === true &&
          paint.fontSize >= 12 &&
          paint.fontSize <= openingMax &&
          paint.pageOverflow === false &&
          paint.lineOverflow === false &&
          paint.overlap === false &&
          paint.heightFit === true &&
          (paint.opening
            ? paint.domSlots >= 4 && paint.domSlots <= 10
            : paint.domSlots === 15 && paint.baselineDev <= 2.5),
      });
      console.log(`✓ snapshot page ${n} → ${file}`);
    }
  } finally {
    await browser.close();
    await stop();
  }

  const failed = report.filter((r) => !r.ok);
  writeFileSync(join(outDir, "report.json"), JSON.stringify({ viewport, report }, null, 2));

  const baselinePath = join(outDir, "geometry-baseline.json");
  if (!existsSync(baselinePath)) {
    console.error("مرجع الهندسة مفقود:", baselinePath);
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  const geometryFailed = [];
  for (const row of report) {
    const expected = baseline.pages?.[String(row.page)];
    if (!expected) {
      geometryFailed.push({ page: row.page, reason: "missing-baseline" });
      continue;
    }
    if (Boolean(expected.opening) !== Boolean(row.opening)) {
      geometryFailed.push({ page: row.page, reason: "opening-mismatch" });
    }
    if (row.lineSlots < expected.minLineSlots || row.lineSlots > expected.maxLineSlots) {
      geometryFailed.push({
        page: row.page,
        reason: "line-slots",
        got: row.lineSlots,
        min: expected.minLineSlots,
        max: expected.maxLineSlots,
      });
    }
    if (!expected.opening && row.domSlots !== 15) {
      geometryFailed.push({ page: row.page, reason: "dom-slots", got: row.domSlots });
    }
    const maxDev = expected.maxBaselineGapDevPx ?? 2.5;
    if (!expected.opening && row.baselineDev > maxDev) {
      geometryFailed.push({ page: row.page, reason: "baseline", got: row.baselineDev, max: maxDev });
    }
  }
  if (failed.length || geometryFailed.length) {
    console.error("فشل التحقق البصري:", { failed, geometryFailed });
    process.exit(1);
  }
  console.log("✓ mushaf visual-snapshot ok", pages.join(","));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
