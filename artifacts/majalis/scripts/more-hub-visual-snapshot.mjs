#!/usr/bin/env node
/**
 * لقطات مرجعية للّوبيات الخمسة + /quran-hub/numbers (390×844) — نهاري وليلي.
 * تشغيل:
 *   MORE_HUB_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/more-hub-visual-snapshot.mjs
 *   UPDATE_SNAPSHOTS=1 … لإعادة كتابة المرجعيات
 */
import { createServer } from "node:http";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  statSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDirSections = resolve(root, "tests/snapshots/more-hub");
const outDirQuran = resolve(root, "tests/snapshots/quran-hub");
const outDirNumbers = resolve(root, "tests/snapshots/quran-numbers");
const outDirLessons = resolve(root, "tests/snapshots/lessons-lobby");
const outDirPrayer = resolve(root, "tests/snapshots/prayer-lobby");
const outDirFiqh = resolve(root, "tests/snapshots/fiqh-lobby");
const viewport = { width: 390, height: 844 };
const baseFromEnv = process.env.MORE_HUB_GATE_BASE_URL || process.env.MUSHAF_GATE_BASE_URL || process.env.BASE_URL || "";
const update = process.env.UPDATE_SNAPSHOTS === "1";
const themes = ["light", "dark"];

const LOBBIES = [
  { path: "/sections", dir: outDirSections, name: "more-hub", maxFeatured: 0 },
  { path: "/quran-hub", dir: outDirQuran, name: "quran-hub", maxFeatured: 1 },
  { path: "/lessons", dir: outDirLessons, name: "lessons-lobby", maxFeatured: 1 },
  { path: "/prayer-times", dir: outDirPrayer, name: "prayer-lobby", maxFeatured: 1 },
  { path: "/fiqh", dir: outDirFiqh, name: "fiqh-lobby", maxFeatured: 0 },
];

mkdirSync(outDirSections, { recursive: true });
mkdirSync(outDirQuran, { recursive: true });
mkdirSync(outDirNumbers, { recursive: true });
mkdirSync(outDirLessons, { recursive: true });
mkdirSync(outDirPrayer, { recursive: true });
mkdirSync(outDirFiqh, { recursive: true });

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
    throw new Error("dist/index.html مفقود — شغّل pnpm build أو عيّن MORE_HUB_GATE_BASE_URL");
  }

  const port = Number(process.env.MORE_HUB_SNAPSHOT_PORT || 24218);
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    let pathName = decodeURIComponent(url.pathname);
    if (pathName === "/") pathName = "/index.html";
    const file = join(dist, pathName);
    if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
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

function assertBaseline(dir, name, theme, buf) {
  const file = join(dir, `${name}-${theme}.png`);
  if (update || !existsSync(file)) {
    writeFileSync(file, buf);
    console.log(`  · كتب مرجعية ${name}/${theme}: ${file} (${buf.length} بايت)`);
    return;
  }
  const prev = readFileSync(file);
  if (prev.length < 1000) throw new Error(`مرجعية تالفة: ${file}`);
  if (buf.length < 1000) throw new Error(`لقطة فارغة: ${name}/${theme}`);
  const ratio = Math.abs(prev.length - buf.length) / Math.max(prev.length, 1);
  if (ratio > 0.45) {
    throw new Error(
      `انحراف حجم لقطة ${name} (${theme}): كان ${prev.length} صار ${buf.length} (±${(ratio * 100).toFixed(1)}%) — راجع بصريًا أو UPDATE_SNAPSHOTS=1`,
    );
  }
  console.log(`  · ${name}/${theme}: ok (حجم ${buf.length} ≈ مرجعية ${prev.length})`);
}

async function waitFonts(page) {
  await page.evaluate(async () => {
    try {
      await Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch {
      /* ignore */
    }
  });
}

async function shotHub(page, hub, outDir, name, theme) {
  const box = await hub.boundingBox();
  if (!box) throw new Error(`${name}/${theme}: لا صندوق للعنصر`);
  const buf = await page.screenshot({
    type: "png",
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: Math.min(box.width, viewport.width),
      height: Math.min(box.height, viewport.height * 2),
    },
  });
  assertBaseline(outDir, name, theme, buf);
}

async function readTitleMetrics(page) {
  return page.locator(".section-lobby__title").first().evaluate((el) => {
    const cs = getComputedStyle(el);
    const after = getComputedStyle(el, "::after");
    return {
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      marginTop: cs.marginTop,
      marginBottom: cs.marginBottom,
      afterWidth: after.width,
      afterHeight: after.height,
    };
  });
}

async function assertLobbyComputed(page, name, theme, maxFeatured) {
  const hero = await page.locator(".page-hero-mj, .page-hero").count();
  if (hero > 0) throw new Error(`${name}/${theme}: لافتة خضراء ظاهرة`);

  const back = await page.locator(".global-back-btn").count();
  if (back > 0) throw new Error(`${name}/${theme}: زر رجوع في جذر تبويب`);

  const localSearch = await page
    .locator("[data-section-lobby] input[type='search'], [data-section-lobby] .sections-hub__search")
    .count();
  if (localSearch > 0) throw new Error(`${name}/${theme}: حقل بحث محلي`);

  const featured = await page.locator("[data-section-lobby] .card--featured").count();
  if (featured > maxFeatured) {
    throw new Error(`${name}/${theme}: بطاقات خضراء ${featured} > ${maxFeatured}`);
  }

  const metrics = await readTitleMetrics(page);
  if (metrics.fontSize !== "24px") throw new Error(`${name}/${theme}: عنوان ${metrics.fontSize} ≠ 24px`);
  if (Number(metrics.fontWeight) < 700) throw new Error(`${name}/${theme}: وزن العنوان ${metrics.fontWeight}`);
  if (metrics.marginTop !== "0px" || metrics.marginBottom !== "0px") {
    throw new Error(`${name}/${theme}: هامش العنوان غير صفري`);
  }
  if (metrics.afterWidth !== "24px" || metrics.afterHeight !== "2px") {
    throw new Error(`${name}/${theme}: خط العنوان ${metrics.afterWidth}×${metrics.afterHeight}`);
  }

  const overlap = await page.evaluate(() => {
    const nav = document.querySelector(".navbar-v3, header.navbar-v3");
    const h1 = document.querySelector(".section-lobby__title");
    if (!h1) return "لا عنوان";
    const t = h1.getBoundingClientRect();
    if (t.top < 0) return "العنوان تحت شريط الحالة";
    if (nav) {
      const n = nav.getBoundingClientRect();
      if (t.top + 1 < n.bottom) return "تراكب الترويسة مع شريط التطبيق";
    }
    const fab = document.querySelector(".assistant-fab");
    const cards = [...document.querySelectorAll("[data-lobby-shot] [data-section-card]")];
    if (fab && cards.length) {
      const f = fab.getBoundingClientRect();
      for (const c of cards) {
        const b = c.getBoundingClientRect();
        const hit = !(b.right < f.left || b.left > f.right || b.bottom < f.top || b.top > f.bottom);
        if (hit && b.height > 0 && f.height > 0) return "تراكب الزر العائم مع بطاقة";
      }
    }
    const lobby = document.querySelector(".section-lobby");
    if (lobby) {
      const pb = parseFloat(getComputedStyle(lobby).paddingBottom);
      if (!(pb >= 80)) return `نطاق سفلي ضعيف (${pb})`;
    }
    return "";
  });
  if (overlap) throw new Error(`${name}/${theme}: ${overlap}`);

  const grids = page.locator("[data-lobby-shot] .section-lobby__grid");
  const gridCount = await grids.count();
  for (let i = 0; i < gridCount; i++) {
    const grid = grids.nth(i);
    const solo = await grid.evaluate((el) => el.classList.contains("section-lobby__grid--solo"));
    const cardLoc = grid.locator("[data-section-card]");
    const n = await cardLoc.count();
    if (n === 0) continue;
    if (solo && n !== 1) throw new Error(`${name}/${theme}: شبكة منفردة بعدد ${n}`);
    if (!solo && n === 1) throw new Error(`${name}/${theme}: نصف صف فارغ لعنصر واحد`);
    const heights = await cardLoc.evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().height)),
    );
    if (heights.length > 1) {
      const delta = Math.max(...heights) - Math.min(...heights);
      if (delta > 1) throw new Error(`${name}/${theme}: ارتفاعات البطاقات متفاوتة (${delta}px)`);
    }
  }

  const primary = page.locator(".section-lobby__primary");
  if ((await primary.count()) > 0) {
    const box1 = await primary.boundingBox();
    await page.waitForTimeout(350);
    const box2 = await primary.boundingBox();
    if (box1 && box2 && Math.abs(box1.height - box2.height) > 1) {
      throw new Error(`${name}/${theme}: قفزة تخطيط في الإجراء الأساسي (${box1.height}→${box2.height})`);
    }
  }

  return metrics;
}

async function capture(page, base, pathName, outDir, name, theme, maxFeatured = 1) {
  await page.goto(`${base}${pathName}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("[data-section-lobby]", { timeout: 20_000 });
  const hub = page.locator("[data-lobby-shot='1']").first();
  await hub.waitFor({ state: "visible" });

  const metrics = await assertLobbyComputed(page, name, theme, maxFeatured);

  const cards = await hub.locator("[data-section-card]").count();
  if (cards === 0) throw new Error(`${name}/${theme}: صفر بطاقات مرسومة`);

  for (let i = 0; i < Math.min(cards, 8); i++) {
    const label = hub.locator("[data-section-card]").nth(i).locator(".card__label");
    const text = ((await label.innerText()) || "").trim();
    if (!text) throw new Error(`${name}/${theme}: بطاقة فارغة #${i}`);
    const opacity = await label.evaluate((el) => Number(getComputedStyle(el).opacity));
    if (!(opacity > 0)) throw new Error(`${name}/${theme}: عنوان شفاف #${i}`);
  }

  const sample = hub.locator("[data-section-card]").first();
  const styles = await sample.evaluate((el) => {
    const cs = getComputedStyle(el);
    const label = el.querySelector(".card__label");
    const lcs = label ? getComputedStyle(label) : cs;
    return { radius: parseFloat(cs.borderRadius), bg: cs.backgroundColor, color: lcs.color };
  });
  if (!(styles.radius >= 12)) throw new Error(`${name}/${theme}: border-radius < 12`);
  if (styles.bg === "rgba(0, 0, 0, 0)") throw new Error(`${name}/${theme}: خلفية بطاقة شفافة`);
  if (styles.color === styles.bg) throw new Error(`${name}/${theme}: لون النص = لون الخلفية`);

  await waitFonts(page);
  await shotHub(page, hub, outDir, name, theme);
  return metrics;
}

async function captureNumbers(page, base, theme) {
  const name = "quran-numbers";
  await page.goto(`${base}/quran-hub/numbers`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("[data-quran-numbers='1']", { timeout: 20_000 });
  await page.waitForSelector("[data-stat-id]", { timeout: 20_000 });
  const hub = page.locator("[data-quran-numbers='1']");
  await hub.waitFor({ state: "visible" });

  const title = ((await hub.locator(".quran-hub-page__title").innerText()) || "").trim();
  if (title !== "القرآن في أرقام") throw new Error(`${name}/${theme}: عنوان خاطئ`);

  const cards = await hub.locator("[data-stat-id]").count();
  if (cards < 8) throw new Error(`${name}/${theme}: بطاقات إحصاء قليلة (${cards})`);

  const sources = await hub.locator(".quran-stat-card__source").allTextContents();
  const joined = sources.join("\n");
  if (/الإعجاز العددي|التناسق الرقمي|numericmiracle|harunyahya|miraclequran/i.test(joined)) {
    throw new Error(`${name}/${theme}: مصدر ممنوع في بطاقة إحصاء`);
  }

  await waitFonts(page);
  await shotHub(page, hub, outDirNumbers, name, theme);
}

async function main() {
  const { base, stop } = await ensurePreview();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    locale: "ar-KW",
  });

  try {
    for (const theme of themes) {
      const page = await context.newPage();
      await page.addInitScript((t) => {
        localStorage.setItem("majalis-theme", t);
      }, theme);
      const metricsByName = [];
      for (const lobby of LOBBIES) {
        const metrics = await capture(
          page,
          base,
          lobby.path,
          lobby.dir,
          lobby.name,
          theme,
          lobby.maxFeatured,
        );
        metricsByName.push({ name: lobby.name, metrics });
      }
      const first = metricsByName[0].metrics;
      for (const row of metricsByName.slice(1)) {
        for (const key of Object.keys(first)) {
          if (row.metrics[key] !== first[key]) {
            throw new Error(
              `${theme}: مقاييس العنوان تختلف (${metricsByName[0].name}.${key}=${first[key]} ≠ ${row.name}.${key}=${row.metrics[key]})`,
            );
          }
        }
      }
      await captureNumbers(page, base, theme);
      await page.close();
    }
    console.log("more-hub-visual-snapshot: OK");
  } finally {
    await browser.close();
    await stop();
  }
}

main().catch((err) => {
  console.error("more-hub-visual-snapshot: FAILED", err);
  process.exit(1);
});
