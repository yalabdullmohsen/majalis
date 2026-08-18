#!/usr/bin/env node
/**
 * بوابة above-fold لصفحة الدروس — 390×844.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = join(root, "docs/lessons-gates");
mkdirSync(outDir, { recursive: true });

const [vw, vh] = (process.env.LESSONS_GATE_VIEWPORT || "390x844").split("x").map(Number);

function contentType(file) {
  const e = extname(file).toLowerCase();
  if (e === ".html") return "text/html; charset=utf-8";
  if (e === ".js") return "text/javascript; charset=utf-8";
  if (e === ".css") return "text/css; charset=utf-8";
  return "application/octet-stream";
}

async function ensureBase() {
  if (process.env.LESSONS_GATE_BASE_URL) {
    return { base: process.env.LESSONS_GATE_BASE_URL.replace(/\/$/, ""), stop: async () => {} };
  }
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) throw new Error("dist مفقود");
  const port = 24216 + 4;
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

async function main() {
  const { base, stop } = await ensureBase();
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: vw, height: vh }, locale: "ar-KW" })).newPage();

  await page.goto(`${base}/lessons`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForSelector(".lessons-page-compact", { timeout: 30_000 });
  const routeError = await page.locator("h1").filter({ hasText: "تعذّر عرض هذه الصفحة" }).count();
  if (routeError > 0) {
    throw new Error("LessonsPage crashed — ErrorBoundary active");
  }
  await page.waitForFunction(
    () => !document.querySelector(".page-loading-guard--loading") && document.querySelectorAll(".lesson-compact-row").length > 0,
    { timeout: 45_000 },
  );

  const metrics = await page.evaluate(() => {
    const vhPx = window.innerHeight;
    const quickBar = document.querySelector(".lessons-quick-bar");
    const firstLesson = document.querySelector(".lesson-compact-row");
    const chips = document.querySelector(".section-lobby__chips");
    const shot = document.querySelector(".section-lobby__shot");
    const rows = [...document.querySelectorAll(".lesson-compact-row")];

    const quickH = quickBar?.getBoundingClientRect().height ?? 0;
    const firstTop = firstLesson?.getBoundingClientRect().top ?? vhPx;
    const shotTop = shot?.getBoundingClientRect().top ?? 0;
    const listTop = document.querySelector(".lessons-v2-section--main, .lessons-v2-section")
      ?.getBoundingClientRect().top ?? firstTop;

    let gapMax = 0;
    if (shot) {
      const kids = [...shot.children].filter((el) => el.getBoundingClientRect().height > 0);
      for (let i = 1; i < kids.length; i++) {
        const gap = kids[i].getBoundingClientRect().top - kids[i - 1].getBoundingClientRect().bottom;
        gapMax = Math.max(gapMax, gap);
      }
    }

    let emptyCard = false;
    for (const row of rows.slice(0, 8)) {
      const r = row.getBoundingClientRect();
      const textH = row.querySelector(".lesson-compact-row__text")?.getBoundingClientRect().height ?? 0;
      if (r.height > textH * 2 + 16) emptyCard = true;
    }

    const twoScreens = rows.filter((r) => r.getBoundingClientRect().top < vhPx * 2).length;
    const contentOffsetRatio = shotTop > 0 ? (firstTop - shotTop) / vhPx : firstTop / vhPx;

    return {
      viewportH: vhPx,
      quickBarHeightPx: Math.round(quickH),
      firstLessonTopPx: Math.round(firstTop),
      shotTopPx: Math.round(shotTop),
      listTopRatio: listTop / vhPx,
      firstLessonAboveFold: firstTop < vhPx,
      firstLessonTopRatio: firstTop / vhPx,
      contentOffsetRatio,
      visibleInTwoScreens: twoScreens,
      maxVerticalGapPx: Math.round(gapMax),
      emptyCardDetected: emptyCard,
      lessonCount: rows.length,
      hasQuickBar: !!quickBar,
      hasChips: !!chips,
    };
  });

  await page.screenshot({ path: join(outDir, "lessons-compact.png"), fullPage: false });

  const failures = [];
  if (!metrics.firstLessonAboveFold) failures.push("first lesson not above fold");
  if (metrics.contentOffsetRatio > 0.16) {
    failures.push(`content offset ${(metrics.contentOffsetRatio * 100).toFixed(1)}% > 16%`);
  }
  if (metrics.quickBarHeightPx > 56) failures.push(`quick bar ${metrics.quickBarHeightPx}px > 56px`);
  if (metrics.maxVerticalGapPx > 12) failures.push(`vertical gap ${metrics.maxVerticalGapPx}px > 12px`);
  if (metrics.emptyCardDetected) failures.push("empty card height > 2x content");
  if (metrics.visibleInTwoScreens < 3) failures.push(`visible cards ${metrics.visibleInTwoScreens} < 3`);

  const report = { viewport: `${vw}x${vh}`, metrics, failures };
  writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));

  await browser.close();
  await stop();

  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log("✓ lessons-above-fold gate ok");
  console.log(JSON.stringify(metrics, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
