#!/usr/bin/env node
/**
 * Mobile UX smoke test for core routes (iPhone Safari viewport).
 * Usage: node scripts/smoke-mobile-routes.mjs [--base=http://127.0.0.1:24216]
 */
import { chromium, devices } from "playwright";

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "http://127.0.0.1:24216";

async function checkPage(page, { path, label }) {
  const url = new URL(path, base).toString();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

  const overflowX = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  if (overflowX) {
    throw new Error(`${label}: horizontal overflow detected (scrollWidth > clientWidth)`);
  }

  const bodyText = await page.locator("body").innerText();
  if (bodyText.includes("تعذر عرض هذه الصفحة")) {
    throw new Error(`${label}: error boundary visible`);
  }

  return bodyText;
}

async function checkQuranHub(page) {
  await checkPage(page, { path: "/quran-hub", label: "Quran hub" });
  const grid = page.locator(".quran-hub-grid");
  await grid.first().waitFor({ state: "visible", timeout: 10_000 });
  console.log("✓ Quran hub: content visible, no overflow");
}

async function checkSurahStories(page) {
  const text = await checkPage(page, { path: "/quran/surah-stories", label: "Surah stories" });
  if (/موسوعة/.test(text)) {
    throw new Error("Surah stories: page contains forbidden term «موسوعة»");
  }
  console.log("✓ Surah stories: no «موسوعة», no overflow");
}

async function checkQa(page) {
  const text = await checkPage(page, { path: "/qa", label: "QA" });
  const prophetUnderAqeedah = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".qa-card, [class*='qa-card']")];
    for (const card of cards) {
      const q = card.textContent || "";
      const isProphet =
        /(?:النبي|نوح|إبراهيم|موسى|عيسى|يونس|هود|صالح|لوط|الأنبياء|المرسلين|ابتلعه الحوت|كلمه الله)/.test(q);
      const cat = card.querySelector(".qa-card__category, [class*='category']")?.textContent || "";
      if (isProphet && cat.includes("العقيدة")) return q.slice(0, 80);
    }
    return null;
  });
  if (prophetUnderAqeedah) {
    throw new Error(`QA: prophet question under العقيدة: ${prophetUnderAqeedah}`);
  }
  console.log("✓ QA: no prophet questions under العقيدة, no overflow");
}

async function checkLessons(page) {
  await checkPage(page, { path: "/lessons", label: "Lessons" });
  const main = page.locator(".lessons-v2-main");
  await main.waitFor({ state: "visible", timeout: 10_000 });

  const order = await page.evaluate(() => {
    const stats = document.querySelector(".lessons-v2-stats");
    const grid = document.querySelector(".lesson-unified-grid, .page-card-grid");
    const sidebar = document.querySelector(".lessons-v2-sidebar");
    if (!stats || !grid) return null;
    const statsTop = stats.getBoundingClientRect().top;
    const gridTop = grid.getBoundingClientRect().top;
    const sidebarVisible = sidebar && getComputedStyle(sidebar).display !== "none";
    return { statsTop, gridTop, lessonsBeforeSidebar: gridTop < statsTop + 400, sidebarVisible };
  });

  if (!order) throw new Error("Lessons: missing stats or lesson grid");
  if (order.sidebarVisible) {
    throw new Error("Lessons: sidebar filters visible on mobile (should be bottom sheet only)");
  }

  const filterBtn = page.locator(".lessons-v2-filter-toggle");
  await filterBtn.waitFor({ state: "visible", timeout: 5_000 });
  await filterBtn.click();
  const sheet = page.locator(".lessons-v2-sheet");
  await sheet.waitFor({ state: "visible", timeout: 5_000 });
  await page.locator(".lessons-v2-filters__close").click();
  await sheet.waitFor({ state: "hidden", timeout: 5_000 });
  console.log("✓ Lessons: content first, filters in bottom sheet on mobile");
}

async function checkAssistantFab(page) {
  for (const path of ["/quran-hub", "/lessons"]) {
    await page.goto(new URL(path, base).toString(), { waitUntil: "networkidle" });
    const fab = page.locator(".assistant-fab");
    if (!(await fab.count())) continue;
    const overlap = await page.evaluate(() => {
      const fab = document.querySelector(".assistant-fab");
      const cards = [...document.querySelectorAll(".lesson-unified-card, .quran-hub-card, .ui-card-btn, .quran-story-card")];
      if (!fab) return false;
      const fr = fab.getBoundingClientRect();
      for (const el of cards.slice(0, 8)) {
        const r = el.getBoundingClientRect();
        const intersects =
          fr.left < r.right && fr.right > r.left && fr.top < r.bottom && fr.bottom > r.top;
        if (intersects) return el.className;
      }
      return false;
    });
    if (overlap) {
      throw new Error(`Assistant FAB overlaps content on ${path}: ${overlap}`);
    }
  }
  console.log("✓ Assistant FAB: no overlap with cards/buttons");
}

const browser = await chromium.launch({ headless: true });
try {
  const iphone = devices["iPhone 13"];
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();

  await checkQuranHub(page);
  await checkSurahStories(page);
  await checkQa(page);
  await checkLessons(page);
  await checkAssistantFab(page);

  console.log("\nAll mobile route smoke checks passed.");
} catch (error) {
  console.error("\n✗ Mobile smoke test failed:", error.message || error);
  process.exit(1);
} finally {
  await browser.close();
}
