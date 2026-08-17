#!/usr/bin/env node
/**
 * بوابات بصرية: تقاطع الأسطر · البسملة ±٢٪ · إطار السورة البسيط.
 * يتطلب dist — MUSHAF_GATE_PAGES=1,2,187,235,440,452,453,586,600,604 أو 1-604.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const chapters = JSON.parse(readFileSync(resolve(root, "public/data/quran-v2/chapters.json"), "utf8"));

const shard = Number(process.env.MUSHAF_GATE_SHARD || 1);
const shards = Number(process.env.MUSHAF_GATE_SHARDS || 1);
const pagesEnv =
  process.env.MUSHAF_GATE_PAGES ||
  "1,2,187,235,440,452,453,586,600,604";
const allPages = pagesEnv
  .split(",")
  .flatMap((part) => {
    const p = part.trim();
    if (p.includes("-")) {
      const [a, b] = p.split("-").map(Number);
      const out = [];
      for (let i = a; i <= b; i++) out.push(i);
      return out;
    }
    return [Number(p)];
  })
  .filter((n) => n >= 1 && n <= 604);
const pages = allPages.filter((_, i) => i % shards === shard - 1);
const [vw, vh] = (process.env.MUSHAF_GATE_VIEWPORT || "390x844").split("x").map(Number);
const outDir = resolve(root, process.env.MUSHAF_VISUAL_OUT || "artifacts/mushaf-visual-gates");
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
    return { base: process.env.MUSHAF_GATE_BASE_URL.replace(/\/$/, ""), stop: async () => {} };
  }
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) throw new Error("dist مفقود — ابنِ الحزمة أولًا");
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
  return { base: `http://127.0.0.1:${port}`, stop: () => new Promise((r) => server.close(() => r())) };
}

function surahStartsOnPage(raw) {
  const out = [];
  for (const v of raw) {
    const sn = Number(v.verse_key.split(":")[0]);
    if (v.verse_key.endsWith(":1") && !out.includes(sn)) out.push(sn);
  }
  return out;
}

function expectBasmala(pageNum) {
  const raw = JSON.parse(
    readFileSync(resolve(root, `public/data/quran-v2/pages/page-${String(pageNum).padStart(3, "0")}.json`), "utf8"),
  );
  for (const sn of surahStartsOnPage(raw)) {
    const ch = chapters.find((c) => c.id === sn);
    if (ch?.bismillah_pre && sn !== 1) return true;
  }
  return pageNum === 2;
}

async function main() {
  if (!pages.length) {
    console.log("empty shard", shard);
    return;
  }
  const { base, stop } = await ensureBase();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: vw || 390, height: vh || 844 } });
  const page = await context.newPage();
  const rows = [];
  const failures = [];

  try {
    for (const n of pages) {
      await page.goto(`${base}/mushaf?page=${n}`, { waitUntil: "networkidle", timeout: 90_000 });
      await page.waitForSelector('[data-pane="current"] [data-testid="mushaf-page"]', { timeout: 60_000 });
      await page.waitForFunction(
        () => {
          const rootEl = document.querySelector('[data-pane="current"] [data-testid="mushaf-page"]');
          if (!rootEl) return false;
          const raw =
            rootEl.style.getPropertyValue("--mm-qpc-size") ||
            getComputedStyle(rootEl).getPropertyValue("--mm-qpc-size");
          const px = parseFloat(raw);
          return Number.isFinite(px) && px >= 12;
        },
        { timeout: 45_000 },
      );
      await page.waitForTimeout(250);

      const metrics = await page.evaluate(() => {
        const current = document.querySelector('[data-pane="current"]');
        const pageEl = current?.querySelector('[data-testid="mushaf-page"]');
        const slots = [...(current?.querySelectorAll(".mm-slot") ?? [])];
        const slotRects = slots.map((s) => {
          const r = s.getBoundingClientRect();
          return { slot: Number(s.getAttribute("data-slot")), kind: s.getAttribute("data-kind"), ...r };
        });

        let maxOverlapPx = 0;
        for (let i = 0; i < slotRects.length; i++) {
          for (let j = i + 1; j < slotRects.length; j++) {
            const a = slotRects[i];
            const b = slotRects[j];
            const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            if (overlapY > 1 && overlapX > 1) maxOverlapPx = Math.max(maxOverlapPx, overlapY);
          }
        }

        let inkOverlap = false;
        for (const slot of slots) {
          const kind = slot.getAttribute("data-kind");
          if (kind === "empty") continue;
          const box = slot.getBoundingClientRect();
          for (const ink of slot.querySelectorAll(
            ".mm-ayah-line, .mm-basmala, .mm-surah-frame",
          )) {
            const ib = ink.getBoundingClientRect();
            if (ib.bottom > box.bottom + 1.5 || ib.top < box.top - 1.5) inkOverlap = true;
          }
        }

        const ayahLine = current?.querySelector(".mm-ayah-line");
        const pageEl2 = current?.querySelector('[data-testid="mushaf-page"]');
        const qpcVar = pageEl2
          ? parseFloat(
              pageEl2.style.getPropertyValue("--mm-qpc-size") ||
                getComputedStyle(pageEl2).getPropertyValue("--mm-qpc-size"),
            )
          : 0;
        const ayahSize = ayahLine ? parseFloat(getComputedStyle(ayahLine).fontSize) : qpcVar;
        const basmala = current?.querySelector('.mm-basmala[data-basmala="qpc"]');
        const basmalaSize = basmala ? parseFloat(getComputedStyle(basmala).fontSize) : 0;
        const refSize = qpcVar > 0 ? qpcVar : ayahSize;
        let basmalaCenterPx = 0;
        if (basmala) {
          const br = basmala.getBoundingClientRect();
          const sr = basmala.parentElement?.getBoundingClientRect();
          if (sr) basmalaCenterPx = Math.abs(br.left + br.width / 2 - (sr.left + sr.width / 2));
        }

        const frame = current?.querySelector(".mm-surah-frame");
        let frameMetrics = null;
        if (frame) {
          const cs = getComputedStyle(frame);
          const fr = frame.getBoundingClientRect();
          const slotR = frame.closest(".mm-slot")?.getBoundingClientRect();
          const name = frame.querySelector(".mm-surah-frame__name");
          const nameSize = name ? parseFloat(getComputedStyle(name).fontSize) : 0;
          frameMetrics = {
            bgImage: cs.backgroundImage,
            boxShadow: cs.boxShadow,
            svgCount: frame.querySelectorAll("svg").length,
            heightPx: fr.height,
            slotHeightPx: slotR?.height ?? 0,
            nameRatio: ayahSize > 0 ? nameSize / ayahSize : 0,
          };
        }

        const horizOverflow = [...(pageEl?.querySelectorAll(".mm-ayah-line, .mm-basmala") ?? [])].some(
          (el) => el.scrollWidth > el.clientWidth + 1,
        );

        return {
          slotCount: slots.length,
          maxOverlapPx,
          inkOverlap,
          ayahSize,
          qpcVar,
          refSize,
          basmalaSize,
          basmalaCenterPx,
          basmalaPresent: !!basmala,
          frameMetrics,
          horizOverflow,
        };
      });

      const basmalaRatio =
        metrics.refSize > 0 && metrics.basmalaSize > 0 ? metrics.basmalaSize / metrics.refSize : 1;
      const row = {
        page: n,
        slots: metrics.slotCount,
        ayahFontPx: metrics.ayahSize,
        qpcVarPx: metrics.qpcVar,
        basmalaFontPx: metrics.basmalaSize,
        basmalaRatio,
        basmalaCenterPx: metrics.basmalaCenterPx,
        frameHeightPx: metrics.frameMetrics?.heightPx ?? 0,
        frameSlotHeightPx: metrics.frameMetrics?.slotHeightPx ?? 0,
        nameRatio: metrics.frameMetrics?.nameRatio ?? 0,
        maxOverlapPx: metrics.maxOverlapPx,
        horizOverflow: metrics.horizOverflow,
      };
      rows.push(row);

      const issues = [];
      if (n >= 3 && metrics.slotCount !== 15) issues.push(`slots=${metrics.slotCount}`);
      if (metrics.maxOverlapPx > 0) issues.push(`overlap=${metrics.maxOverlapPx.toFixed(1)}px`);
      if (metrics.inkOverlap) issues.push("inkOverflow");
      if (metrics.horizOverflow) issues.push("horizOverflow");

      if (expectBasmala(n)) {
        if (!metrics.basmalaPresent) issues.push("missingBasmala");
        if (metrics.basmalaSize > 0 && Math.abs(basmalaRatio - 1) > 0.02) issues.push(`basmalaRatio=${basmalaRatio.toFixed(3)}`);
        if (metrics.basmalaCenterPx > 2) issues.push(`basmalaOffCenter=${metrics.basmalaCenterPx.toFixed(1)}px`);
      }
      if (n === 187 && metrics.basmalaPresent) issues.push("tawbahBasmala");

      if (metrics.frameMetrics) {
        const fm = metrics.frameMetrics;
        if (fm.bgImage !== "none") issues.push("frameBgImage");
        if (fm.boxShadow && fm.boxShadow !== "none") issues.push("frameShadow");
        if (fm.svgCount > 0) issues.push("frameSvg");
        if (fm.slotHeightPx > 0 && fm.heightPx > fm.slotHeightPx + 1) issues.push("frameTooTall");
        if (fm.nameRatio > 0 && (fm.nameRatio < 0.8 || fm.nameRatio > 0.9)) issues.push(`nameRatio=${fm.nameRatio.toFixed(3)}`);
      }

      if (issues.length) failures.push({ page: n, issues });
      await page.screenshot({ path: join(outDir, `page-${String(n).padStart(3, "0")}.png`) });
      console.log(n, issues.length ? `FAIL ${issues.join(",")}` : "ok");
    }
  } finally {
    await browser.close();
    await stop();
  }

  writeFileSync(join(outDir, `report-shard-${shard}.json`), JSON.stringify({ rows, failures }, null, 2));
  if (failures.length) {
    console.error("visual-gates failures:", failures.length);
    process.exit(1);
  }
  console.log("✓ visual-gates ok", pages.length, "pages");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
