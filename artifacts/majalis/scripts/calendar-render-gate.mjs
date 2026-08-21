#!/usr/bin/env node
/**
 * بوابة عرض تقويم الدروس — Playwright 390×844.
 * صفر تقاطع خلايا · صفر لون رابط افتراضي · صفر فيض خارج البطاقة.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "docs/calendar-gates");
mkdirSync(outDir, { recursive: true });

const [vw, vh] = (process.env.CALENDAR_GATE_VIEWPORT || "390x844").split("x").map(Number);
const LINK_BLUE = /rgb\(\s*0\s*,\s*0\s*,\s*238\s*\)|#0000ee/i;

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
  if (process.env.CALENDAR_GATE_BASE_URL) {
    return { base: process.env.CALENDAR_GATE_BASE_URL.replace(/\/$/, ""), stop: async () => {} };
  }
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) throw new Error("dist مفقود — ابنِ الحزمة أولًا");
  const port = 24216 + 3;
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

function overlap(a, b) {
  const dx = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const dy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return dx > 0.5 && dy > 0.5 ? Math.round(dx * dy) : 0;
}

async function measureView(page, viewLabel, clickTab) {
  if (clickTab) {
    await page.locator(`.cal-view-tab:has-text("${clickTab}")`).click();
    await page.waitForTimeout(400);
  }
  await page.waitForSelector(".cal-grid, .cal-week-grid, .cal-day-panel", { timeout: 15_000 });

  const card = page.locator(".cal-month.ui-card, .cal-week.ui-card, .cal-day.ui-card").first();
  const cardBox = await card.boundingBox();
  if (!cardBox) throw new Error(`no card box ${viewLabel}`);

  const cells = page.locator(".cal-cell--month, .cal-cell--week");
  const n = await cells.count();
  const boxes = [];
  for (let i = 0; i < n; i++) {
    const b = await cells.nth(i).boundingBox();
    if (b) boxes.push(b);
  }

  let maxOverlap = 0;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      maxOverlap = Math.max(maxOverlap, overlap(boxes[i], boxes[j]));
    }
  }

  const overflows = await page.evaluate(({ cardSel }) => {
    const cardEl = document.querySelector(cardSel);
    if (!cardEl) return { horiz: true, linkBlue: 0 };
    const cr = cardEl.getBoundingClientRect();
    let horiz = false;
    let linkBlue = 0;
    const all = cardEl.querySelectorAll("*");
    all.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      if (r.right > cr.right + 1 || r.left < cr.left - 1) horiz = true;
      const cs = getComputedStyle(el);
      if (/^a$/i.test(el.tagName) && (cs.color === "rgb(0, 0, 238)" || cs.color === "rgb(0, 0, 238)")) linkBlue++;
      if (cs.color === "rgb(0, 0, 238)" && el.textContent?.trim()) linkBlue++;
    });
    return { horiz, linkBlue };
  }, { cardSel: ".cal-month.ui-card, .cal-week.ui-card, .cal-day.ui-card" });

  await page.screenshot({ path: join(outDir, `calendar-${viewLabel}.png`), fullPage: false });

  return {
    view: viewLabel,
    cells: n,
    maxOverlapPx: maxOverlap,
    horizOverflow: overflows.horiz,
    linkBlueCount: overflows.linkBlue,
    cardHeight: Math.round(cardBox.height),
  };
}

async function main() {
  const { base, stop } = await ensureBase();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: vw, height: vh }, locale: "ar-KW" });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("majalis.onboarding.onboarding_seen", "1");
      localStorage.setItem("majalis.onboarding.onboarding_major_version", "1");
    } catch { /* ignore */ }
  });
  const page = await context.newPage();

  await page.goto(`${base}/calendar`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForSelector(".cal-grid, .cal-grid--skeleton", { timeout: 20_000 });
  await page.waitForFunction(
    () => document.querySelector(".cal-grid:not(.cal-grid--skeleton)"),
    { timeout: 30_000 },
  );

  const rows = [];
  rows.push(await measureView(page, "month", null));
  rows.push(await measureView(page, "week", "أسبوعي"));
  rows.push(await measureView(page, "day", "يومي"));

  await browser.close();
  await stop();

  const report = { viewport: `${vw}x${vh}`, rows, failures: [] };
  for (const r of rows) {
    if (r.maxOverlapPx > 0) report.failures.push(`${r.view}: overlap ${r.maxOverlapPx}px`);
    if (r.horizOverflow) report.failures.push(`${r.view}: horizontal overflow`);
    if (r.linkBlueCount > 0) report.failures.push(`${r.view}: link-blue ${r.linkBlueCount}`);
  }

  writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));

  if (report.failures.length) {
    console.error(report.failures.join("\n"));
    process.exit(1);
  }
  console.log(`✓ calendar-render-gate ok ${rows.length} views`);
  for (const r of rows) {
    console.log(`  ${r.view}: cells=${r.cells} overlap=${r.maxOverlapPx}px horiz=${r.horizOverflow ? "yes" : "no"}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
