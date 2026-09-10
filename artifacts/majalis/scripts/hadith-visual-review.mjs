/**
 * لقطات مراجعة بصرية — أقسام الحديث / الصحيح / مصطلح الحديث
 * على عروض iPhone صغير / قياسي / كبير + فحوصات قبول.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../../tmp/hadith-visual");
mkdirSync(OUT, { recursive: true });

const BASE = process.env.VISUAL_BASE_URL || "http://127.0.0.1:24226";

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667, deviceScaleFactor: 2 },
  { name: "iphone-14", width: 390, height: 844, deviceScaleFactor: 3 },
  { name: "iphone-14-pro-max", width: 430, height: 932, deviceScaleFactor: 3 },
];

const ROUTES = [
  { id: "hub", path: "/hadith" },
  { id: "sahih", path: "/hadith/sahih" },
  { id: "science", path: "/hadith-science" },
];

async function assertPage(page, routeId, vpName) {
  const issues = [];

  const fabVisible = await page
    .locator(".floating-back-btn, [data-floating-back='1']")
    .first()
    .isVisible()
    .catch(() => false);
  if (fabVisible) issues.push("FAB رجوع عائم ظاهر");

  if (routeId === "sahih") {
    const guides = await page.locator(".hadith-class-guide").count();
    if (guides > 0) issues.push(`HadithClassGuide مكدّس (${guides})`);
    const inlineBack = page.locator(".hadith-page__chrome .app-back-btn--inline").first();
    const backVisible = await inlineBack.isVisible().catch(() => false);
    if (!backVisible) issues.push("رجوع داخلي غير ظاهر");

    const filter = page.locator(".hadith-toolbar .ds-filter-toggle").first();
    if (await filter.count()) {
      const box = await filter.boundingBox();
      if (box && box.height > 52) issues.push(`زر تصفية مرتفع (${Math.round(box.height)}px)`);
      if (box && box.width < 40) issues.push("زر تصفية ضيق جدًا (لفّ عمودي؟)");
    }

    const classAlone = await page.evaluate(() => {
      const nav = document.querySelector(".hadith-class-switch");
      if (!nav) return false;
      const links = [...nav.querySelectorAll(".hadith-class-switch__link")];
      if (links.length < 4) return false;
      const topic = links.find((a) => (a.textContent || "").includes("الموضوع"));
      const books = links.find((a) => (a.textContent || "").includes("الكتب"));
      if (!topic || !books) return false;
      const tops = links.map((el) => el.getBoundingClientRect().top);
      const firstRow = Math.min(...tops);
      const topicAlone =
        Math.abs(topic.getBoundingClientRect().top - firstRow) > 8 &&
        books.getBoundingClientRect().width > nav.getBoundingClientRect().width * 0.85;
      return topicAlone;
    });
    if (classAlone) issues.push("تفريد «الموضوع» في صف منفصل");
  }

  const overflowX = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  if (overflowX) issues.push("overflow أفقي للمستند");

  // فشل فقط إذا كان أعلى عنصر حرج تحت الشريط (لا شبكة طويلة تتجاوز الطيّة)
  const covered = await page.evaluate(() => {
    const nav =
      document.querySelector("[data-bottom-nav]") ||
      document.querySelector(".bottom-nav") ||
      document.querySelector("nav.bottom-nav-bar") ||
      document.querySelector(".bnav") ||
      document.querySelector('[class*="bottom-nav"]');
    if (!nav) return null;
    const navTop = nav.getBoundingClientRect().top;
    const candidates = [
      document.querySelector(".topic-page__group-title"),
      document.querySelector(".hs-search"),
      document.querySelector(".hadith-toolbar"),
      document.querySelector(".hadith-class-switch"),
    ].filter(Boolean);
    for (const el of candidates) {
      const r = el.getBoundingClientRect();
      if (r.height < 4 || r.width < 4) continue;
      if (r.top >= navTop - 10) {
        return (el.className || el.tagName || "el").toString().slice(0, 48);
      }
    }
    return null;
  });
  if (covered) issues.push(`محتوى تحت Bottom Nav: ${covered}`);

  return issues;
}

const browser = await chromium.launch({ headless: true });
const report = [];

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    locale: "ar-SA",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  for (const route of ROUTES) {
    const url = `${BASE}${route.path}`;
    let ok = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForTimeout(1400);
        ok = true;
        break;
      } catch (e) {
        if (attempt === 2) throw e;
        await page.waitForTimeout(800);
      }
    }
    const file = join(OUT, `${route.id}__${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    const issues = await assertPage(page, route.id, vp.name);
    report.push({ file, url, issues, ok, vp: vp.name, route: route.id });
    console.log(`${route.id}@${vp.name}: ${issues.length ? issues.join("; ") : "ok"} → ${file}`);
  }
  await context.close();
}

await browser.close();
writeFileSync(join(OUT, "report.json"), JSON.stringify({ BASE, report }, null, 2));
const failed = report.filter((r) => r.issues.length);
console.log("OUT", OUT);
console.log(failed.length ? `FAIL ${failed.length}` : "ALL_OK");
process.exit(failed.length ? 1 : 0);
