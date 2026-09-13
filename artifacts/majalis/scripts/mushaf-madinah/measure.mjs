#!/usr/bin/env node
/**
 * قياس خفيف لصفحات المصحف الجديدة (بديل single-pass القديم).
 * يكتب JSON لكل shard لاستهلاك assert/layout-bands.
 *
 * هوية السجل: عند الفشل يُطبع [MUSHAF_MEASURE_FAIL] لكل مقياس مخالف
 * (بلا نص قرآني، بلا أسرار).
 *
 * ملاحظة: السطر `measured 4 FAIL qpc-v2-p4` يعني الصفحة 4 بخط qpc-v2-p4
 * — وليس بالضرورة «مجموعة بيانات» مستقلة؛ في مصفوفة CI ذات 4 shards
 * الصفحة 4 تقع في shard 4 من الصفحات المرجعية PR.
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
const fontMaxPx = 38;
const presetId = process.env.MUSHAF_MEASURE_PRESET_ID || "sunnah-mushaf-signature-v1";
const rendererId = process.env.MUSHAF_MEASURE_RENDERER_ID || "new-mushaf-reader";

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

function primaryFontId(fontFamily) {
  const m = String(fontFamily || "").match(/qpc-v2-p\d+/i);
  return m ? m[0] : String(fontFamily || "").split(",")[0]?.trim() || "unknown";
}

function evaluateOk(n, m) {
  const failures = [];
  const slotsExpected = n <= 2 ? "1..15" : 15;
  const slotsOk = n <= 2 ? m.slots > 0 && m.slots <= 15 : m.slots === 15;
  if (!slotsOk) {
    failures.push({
      metricName: "slots",
      expected: slotsExpected,
      actual: m.slots,
      delta: n <= 2 ? null : m.slots - 15,
      allowedTolerance: 0,
      failureReason: "slot-count-mismatch",
    });
  }
  if (m.hasPdf) {
    failures.push({
      metricName: "hasPdf",
      expected: false,
      actual: true,
      delta: 1,
      allowedTolerance: 0,
      failureReason: "pdf-surface-present",
    });
  }
  if (!/qpc-v2-p/i.test(m.fontFamily || "")) {
    failures.push({
      metricName: "fontFamily",
      expected: "qpc-v2-p*",
      actual: primaryFontId(m.fontFamily),
      delta: null,
      allowedTolerance: 0,
      failureReason: "font-family-mismatch",
    });
  }
  if (String(m.pageAttr) !== String(n)) {
    failures.push({
      metricName: "pageAttr",
      expected: String(n),
      actual: String(m.pageAttr ?? ""),
      delta: null,
      allowedTolerance: 0,
      failureReason: "page-attr-mismatch",
    });
  }
  if (m.fontCheck !== true) {
    failures.push({
      metricName: "fontCheck",
      expected: true,
      actual: m.fontCheck,
      delta: null,
      allowedTolerance: 0,
      failureReason: "font-not-ready",
    });
  }
  if (!(m.fontSize >= 12 && m.fontSize <= fontMaxPx)) {
    failures.push({
      metricName: "fontSize",
      expected: `12..${fontMaxPx}`,
      actual: m.fontSize,
      delta: m.fontSize < 12 ? m.fontSize - 12 : m.fontSize - fontMaxPx,
      allowedTolerance: 0,
      failureReason: "font-size-out-of-range",
    });
  }
  if (m.pageOverflow !== false) {
    failures.push({
      metricName: "pageOverflow",
      expected: false,
      actual: m.pageOverflow,
      delta: 1,
      allowedTolerance: 0,
      failureReason: "page-horizontal-overflow",
    });
  }
  if (m.lineOverflow !== false) {
    failures.push({
      metricName: "lineOverflow",
      expected: false,
      actual: m.lineOverflow,
      delta: 1,
      allowedTolerance: 0,
      failureReason: "line-horizontal-overflow",
    });
  }
  if (m.overlap !== false) {
    failures.push({
      metricName: "overlap",
      expected: false,
      actual: m.overlap,
      delta: 1,
      allowedTolerance: 0,
      failureReason: "glyph-slot-overlap",
    });
  }
  return { ok: failures.length === 0, failures };
}

function logFailures(n, m, failures, meta) {
  const fontId = primaryFontId(m.fontFamily);
  const datasetId = `qpc-v2-p${n}`;
  for (const f of failures) {
    console.error(
      [
        "[MUSHAF_MEASURE_FAIL]",
        `dataset=${datasetId}`,
        `shardId=${shard}`,
        `page=${n}`,
        `pageType=${meta.pageType}`,
        `viewport=${vw}x${vh}`,
        `theme=${meta.theme}`,
        `presetId=${meta.presetId}`,
        `presetVersion=${meta.presetVersion}`,
        `rendererId=${meta.rendererId}`,
        `fontId=${fontId}`,
        `fontVersion=${meta.fontVersion}`,
        `geometryVersion=${meta.geometryVersion}`,
        `baselineVersion=${meta.baselineVersion}`,
        `metric=${f.metricName}`,
        `expected=${f.expected}`,
        `actual=${f.actual}`,
        `delta=${f.delta}`,
        `tolerance=${f.allowedTolerance}`,
        `reason=${f.failureReason}`,
        `screenshotPath=${meta.screenshotPath}`,
        `resultJsonPath=${out}`,
      ].join(" "),
    );
  }
}

async function main() {
  if (!pages.length) {
    writeFileSync(outPath, JSON.stringify({ shard, pages: [], measurements: [] }, null, 2));
    console.log("empty shard", shard);
    return;
  }

  console.log(
    `[MUSHAF_MEASURE] shard=${shard}/${shards} pages=${pages.join(",")} viewport=${vw}x${vh} out=${out}`,
  );

  const { base, stop } = await ensureBase();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: vw || 390, height: vh || 844 } });
  const page = await context.newPage();
  const measurements = [];
  const shotDir = resolve(dirname(outPath), "screenshots");
  mkdirSync(shotDir, { recursive: true });

  try {
    for (const n of pages) {
      await page.goto(`${base}/mushaf?page=${n}`, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForSelector('[data-pane="current"] [data-testid="mushaf-page"]', {
        timeout: 45_000,
      });
      const m = await page.evaluate(() => {
        const current = document.querySelector('[data-pane="current"]');
        const rootEl = current?.querySelector('[data-testid="mushaf-page"]');
        const frame = current?.querySelector('[data-testid="mushaf-page-frame"]');
        const line =
          current?.querySelector(".nm-line, .nm-basmala, .mm-ayah-line, .mm-basmala");
        const rect = frame?.getBoundingClientRect();
        const pageEl = rootEl;
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
          if (kind === "empty") continue;
          const slotBox = slot.getBoundingClientRect();
          if (slotBox.height < 2) continue;
          for (const glyph of slot.querySelectorAll(
            ".nm-line, .nm-basmala, .nm-surah-banner, .mm-ayah-line, .mm-basmala, .mm-surah-frame",
          )) {
            const box = glyph.getBoundingClientRect();
            if (box.bottom > slotBox.bottom + 1.5 || box.top < slotBox.top - 1.5) overlap = true;
          }
        }
        const root = document.querySelector(".nm-root, .mm-root, [data-mushaf-metrics]");
        return {
          pageAttr: rootEl?.getAttribute("data-page"),
          slots: ink.length,
          ayahLines: current?.querySelectorAll(".nm-line, .mm-ayah-line").length ?? 0,
          banners: current?.querySelectorAll(".nm-surah-banner, .mm-surah-frame").length ?? 0,
          fontFamily: line ? getComputedStyle(line).fontFamily : family,
          frameWidth: rect?.width ?? 0,
          frameHeight: rect?.height ?? 0,
          hasPdf: !!document.querySelector("embed[type='application/pdf'], iframe[src*='.pdf']"),
          fontCheck,
          fontSize,
          pageOverflow,
          lineOverflow,
          overlap,
          pageType: rootEl?.getAttribute("data-page-type") || (ink.length < 15 ? "opening" : "standard"),
          theme:
            document.documentElement.getAttribute("data-theme") ||
            (document.documentElement.classList.contains("dark") ? "dark" : "light"),
          presetId: root?.getAttribute("data-active-preset-id") || "",
          presetVersion: root?.getAttribute("data-active-preset-version") || "",
          rendererId: root?.getAttribute("data-renderer-id") || "",
          fontVersion: root?.getAttribute("data-font-version") || "",
          geometryVersion: root?.getAttribute("data-mushaf-layout-source") || "",
          renderCacheVersion: root?.getAttribute("data-render-cache-version") || "",
          readerChromeVisible: root?.getAttribute("data-reader-chrome") === "1",
          measuredFontSizeAttr: root?.getAttribute("data-font-size") || "",
        };
      });

      const { ok, failures } = evaluateOk(n, m);
      const fontId = primaryFontId(m.fontFamily);
      const screenshotPath = join(shotDir, `p${n}-${ok ? "ok" : "fail"}.png`);
      if (!ok) {
        try {
          const handle = await page.$('[data-pane="current"] [data-testid="mushaf-page"]');
          if (handle) await handle.screenshot({ path: screenshotPath });
          else await page.screenshot({ path: screenshotPath, fullPage: false });
        } catch {
          /* احتفظ بالتقرير حتى لو فشل الالتقاط */
        }
        logFailures(n, m, failures, {
          pageType: m.pageType,
          theme: m.theme,
          presetId: m.presetId || presetId,
          presetVersion: m.presetVersion || "unknown",
          rendererId: m.rendererId || rendererId,
          fontVersion: m.fontVersion || "qpc-v2-woff2-604",
          geometryVersion: m.geometryVersion || "unknown",
          baselineVersion: m.renderCacheVersion || "runtime",
          screenshotPath: screenshotPath.replace(root + "/", ""),
        });
      }

      measurements.push({
        page: n,
        datasetId: `qpc-v2-p${n}`,
        shardId: shard,
        ...m,
        ok,
        failures,
        screenshotPath: ok ? null : screenshotPath.replace(root + "/", ""),
      });
      console.log("measured", n, ok ? "ok" : "FAIL", fontId);
    }
  } finally {
    await browser.close();
    await stop();
  }

  writeFileSync(
    outPath,
    JSON.stringify(
      {
        shard,
        shards,
        viewport: `${vw}x${vh}`,
        pages,
        resultJsonPath: out,
        measurements,
      },
      null,
      2,
    ),
  );
  if (measurements.some((x) => !x.ok)) {
    console.error(
      `[MUSHAF_MEASURE] FAIL shard=${shard} failedPages=${measurements
        .filter((x) => !x.ok)
        .map((x) => x.page)
        .join(",")} resultJsonPath=${out}`,
    );
    process.exit(1);
  }
  console.log("✓ measure wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
