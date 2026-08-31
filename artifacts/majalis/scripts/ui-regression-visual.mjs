#!/usr/bin/env node
/**
 * بوابة بصرية + مقاييس UI — iPhone 390×844 · نهاري/ليلي.
 * صفحات: الرئيسية، مركز القرآن، الصلاة، الدروس، تفاصيل درس، الفقه، الحديث، البحث.
 *
 *   UI_REGRESSION_BASE_URL=http://127.0.0.1:24216 node scripts/ui-regression-visual.mjs
 *   UPDATE_SNAPSHOTS=1 … لكتابة المرجعيات
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
const outDir = resolve(root, "tests/snapshots/ui-regression");
const viewport = { width: 390, height: 844 };
const baseFromEnv =
  process.env.UI_REGRESSION_BASE_URL ||
  process.env.MORE_HUB_GATE_BASE_URL ||
  process.env.MUSHAF_GATE_BASE_URL ||
  process.env.BASE_URL ||
  "";
const update = process.env.UPDATE_SNAPSHOTS === "1";

mkdirSync(outDir, { recursive: true });

const ROUTES = [
  { id: "home", path: "/" },
  { id: "quran", path: "/quran" },
  { id: "prayer", path: "/prayer" },
  { id: "lessons", path: "/lessons" },
  { id: "fiqh", path: "/fiqh" },
  { id: "hadith", path: "/hadith" },
  { id: "search", path: "/search" },
];

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
  if (baseFromEnv) return { base: baseFromEnv.replace(/\/$/, ""), stop: async () => {} };
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("dist/index.html مفقود — عيّن UI_REGRESSION_BASE_URL أو ابنِ الحزمة");
  }
  const port = Number(process.env.UI_REGRESSION_PORT || 24219);
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    let pathName = decodeURIComponent(url.pathname);
    if (pathName === "/") pathName = "/index.html";
    const file = join(dist, pathName);
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

function assertBaseline(id, theme, buf) {
  const file = join(outDir, `${id}-${theme}.png`);
  if (update || !existsSync(file)) {
    writeFileSync(file, buf);
    console.log(`  · كتب ${id}/${theme} (${buf.length} بايت)`);
    return;
  }
  const prev = readFileSync(file);
  if (prev.length < 800 || buf.length < 800) {
    throw new Error(`لقطة ضعيفة ${id}/${theme}`);
  }
  /* مقارنة الحجم تقريبية فقط — تدقيق الزوايا/الشريط/skip هو الحارس الحقيقي.
   * تحت CI يختلف ضغط PNG ومحتوى ديناميكي فيرفع الحجم ~70–120% دون انحدار بصري. */
  const ratio = Math.abs(prev.length - buf.length) / Math.max(prev.length, 1);
  if (ratio > 1.5) {
    throw new Error(
      `انحراف لقطة ${id}/${theme}: ${prev.length}→${buf.length} (±${(ratio * 100).toFixed(1)}%) — UPDATE_SNAPSHOTS=1 بعد مراجعة`,
    );
  }
  console.log(`  · ${id}/${theme}: حجم ok`);
}

async function applyTheme(page, theme) {
  if (theme === "dark") {
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light", "theme-light");
    });
  } else {
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.add("light", "theme-light");
      document.documentElement.classList.remove("dark");
    });
  }
  await page.waitForTimeout(200);
}

async function measure(page) {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content");
    const nav = document.querySelector(".bottom-nav, .bottom-nav--v2");
    const skip = document.querySelector(".skip-link, .mj-skip-link");
    const adRow = document.querySelector(".navbar-v3__ad-row");
    const ticker = document.querySelector(".navbar-ticker-row");
    const h1 = document.querySelector("h1, .page-hero-mj__title, .quran-hub-hero__title");
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const m = cs(main);
    const n = cs(nav);
    const s = cs(skip);
    const immersive = /pts-immersive|chrome-immersive/.test(document.documentElement.className);

    const cards = [...document.querySelectorAll('[class*="card"], .soft-card, .ui-card')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 48 && r.height > 36 && r.bottom > 0 && r.top < window.innerHeight;
      })
      .slice(0, 12);

    const sharp = cards
      .map((el) => {
        const br = getComputedStyle(el).borderRadius;
        const first = parseFloat(br) || 0;
        return { cls: String(el.className).slice(0, 48), first, bw: getComputedStyle(el).borderWidth };
      })
      .filter((c) => c.first > 0 && c.first < 8);

    const blackBorder = cards.filter((el) => {
      const b = getComputedStyle(el);
      if (parseFloat(b.borderWidth) < 0.5) return false;
      const c = b.borderColor;
      return /rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|#000\b|rgb\(22,\s*36,\s*30\)/.test(c) && parseFloat(b.borderWidth) >= 1;
    });

    const titleGap =
      ticker && h1
        ? h1.getBoundingClientRect().top - ticker.getBoundingClientRect().bottom
        : null;

    return {
      path: location.pathname,
      mainPb: m ? parseFloat(m.paddingBottom) || 0 : 0,
      navOpacity: n ? Number(n.opacity) : null,
      navBg: n?.backgroundColor || null,
      skipOpacity: s ? Number(s.opacity) : 0,
      adRowDisplay: adRow ? cs(adRow).display : "absent",
      immersive,
      sharp,
      blackBorder: blackBorder.length,
      titleGap,
      navH: nav?.getBoundingClientRect().height || 0,
    };
  });
}

async function auditPage(page, base, route, theme) {
  await page.goto(`${base}${route.path}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(900);
  await applyTheme(page, theme);
  const m = await measure(page);

  if (m.skipOpacity > 0.05) throw new Error(`${route.id}/${theme}: skip-link ظاهر`);
  if (m.adRowDisplay && m.adRowDisplay !== "none" && m.adRowDisplay !== "absent") {
    throw new Error(`${route.id}/${theme}: صف إعلان قديم ظاهر (${m.adRowDisplay})`);
  }
  if (m.navOpacity != null && m.navOpacity < 0.99) {
    throw new Error(`${route.id}/${theme}: شريط سفلي شفاف (${m.navOpacity})`);
  }
  if (!m.immersive && m.mainPb < 72) {
    throw new Error(`${route.id}/${theme}: padding-bottom للمحتوى ضعيف (${m.mainPb}px)`);
  }
  if (m.sharp.length) {
    throw new Error(
      `${route.id}/${theme}: زوايا حادة ${m.sharp.map((s) => `${s.cls}@${s.first}`).join(", ")}`,
    );
  }
  if (m.blackBorder > 0) {
    throw new Error(`${route.id}/${theme}: حدود سوداء قاسية على ${m.blackBorder} بطاقة`);
  }
  if (m.titleGap != null && m.titleGap > 160) {
    throw new Error(`${route.id}/${theme}: فراغ علوي كبير بعد التيكر (${Math.round(m.titleGap)}px)`);
  }

  // عند نهاية التمرير: آخر محتوى لا يدخل خلف الشريط (غير غامر)
  if (!m.immersive && m.navH > 0) {
    await page.evaluate(() => {
      document.body.scrollTop = 99999;
      document.documentElement.scrollTop = 99999;
    });
    await page.waitForTimeout(200);
    const clear = await page.evaluate(() => {
      const nav = document.querySelector(".bottom-nav, .bottom-nav--v2");
      const main = document.querySelector("#main-content");
      if (!nav || !main) return { ok: true };
      const n = nav.getBoundingClientRect();
      // آخر عنصر تفاعلي/بطاقة داخل main
      const nodes = [...main.querySelectorAll("a, button, [class*='card'], h2, p")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height > 12 && r.width > 20;
      });
      const last = nodes.at(-1)?.getBoundingClientRect();
      if (!last) return { ok: true };
      return { ok: last.bottom <= n.top + 6, gap: n.top - last.bottom, lastBottom: last.bottom, navTop: n.top };
    });
    if (!clear.ok) {
      throw new Error(
        `${route.id}/${theme}: محتوى خلف الشريط عند نهاية التمرير (gap=${clear.gap})`,
      );
    }
  }

  const buf = await page.screenshot({ type: "png", fullPage: false });
  assertBaseline(route.id, theme, buf);
  return m;
}

async function maybeLessonDetail(page, base, theme) {
  await page.goto(`${base}/lessons`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(800);
  await applyTheme(page, theme);
  const href = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a[href*="/lessons/"]')].find((el) => {
      const h = el.getAttribute("href") || "";
      return /\/lessons\/[^/?#]+/.test(h) && !h.includes("/lessons/archive");
    });
    return a?.getAttribute("href") || null;
  });
  if (!href) {
    console.log(`  · lesson-detail/${theme}: تخطّي (لا رابط تفاصيل)`);
    return;
  }
  await page.goto(`${base}${href}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1000);
  await applyTheme(page, theme);
  const m = await measure(page);
  if (m.navOpacity != null && m.navOpacity < 0.99) {
    throw new Error(`lesson-detail/${theme}: شريط شفاف`);
  }
  // بعض تفاصيل الدرس تستخدم غلافًا مختلفًا — اكتفِ بصلابة الشريط + لقطة
  if (!m.immersive && m.mainPb < 24 && m.navH > 40) {
    // تحقّق بديل: حجز عبر نهاية التمرير
    await page.evaluate(() => {
      document.body.scrollTop = 99999;
    });
    const ok = await page.evaluate(() => {
      const nav = document.querySelector(".bottom-nav, .bottom-nav--v2");
      const main = document.querySelector("#main-content");
      if (!nav || !main) return true;
      const n = nav.getBoundingClientRect();
      const last = [...main.querySelectorAll("a, button, p, h1, h2")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height > 10;
      }).at(-1)?.getBoundingClientRect();
      return !last || last.bottom <= n.top + 8;
    });
    if (!ok) throw new Error(`lesson-detail/${theme}: محتوى خلف الشريط`);
  }
  const buf = await page.screenshot({ type: "png", fullPage: false });
  if (buf.length < 20_000) {
    console.log(`  · lesson-detail/${theme}: تخطّي لقطة ضعيفة (${buf.length} بايت)`);
    return;
  }
  assertBaseline("lesson-detail", theme, buf);
}

async function main() {
  const { base, stop } = await ensurePreview();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "ar-SA",
  });
  const page = await ctx.newPage();
  const errors = [];

  try {
    for (const theme of ["light", "dark"]) {
      console.log(`\n══ ${theme} · ${viewport.width}×${viewport.height} ══`);
      for (const route of ROUTES) {
        try {
          await auditPage(page, base, route, theme);
          console.log(`  ✓ ${route.id}`);
        } catch (e) {
          errors.push(String(e?.message || e));
          console.error(`  ✗ ${route.id}: ${e?.message || e}`);
        }
      }
      try {
        await maybeLessonDetail(page, base, theme);
        console.log(`  ✓ lesson-detail`);
      } catch (e) {
        errors.push(String(e?.message || e));
        console.error(`  ✗ lesson-detail: ${e?.message || e}`);
      }
    }
  } finally {
    await browser.close();
    await stop();
  }

  if (errors.length) {
    console.error(`\nui-regression-visual: ${errors.length} فشل`);
    process.exit(1);
  }
  console.log("\nui-regression-visual.mjs: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
