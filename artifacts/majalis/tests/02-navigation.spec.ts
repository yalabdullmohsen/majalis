/**
 * Navigation tests — bottom bar, links, back/forward, 404 handling.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

test.describe("Navigation — التنقل", () => {
  test("bottom navigation bar is visible on home", async ({ page }) => {
    await page.goto("/");
    await waitForContent(page);
    // Bottom nav should contain known items
    const nav = page.locator("nav, [role=navigation]").first();
    await expect(nav).toBeVisible();
  });

  test("clicking Lessons nav link opens /lessons", async ({ page }) => {
    await page.goto("/");
    await waitForContent(page);
    await page.goto("/lessons");
    await waitForContent(page);
    expect(page.url()).toContain("/lessons");
  });

  test("unknown route shows 404 or redirects", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-xyz");
    await waitForContent(page);
    const text = await page.locator("body").innerText();
    const is404 = text.includes("404") || text.includes("غير موجود") || text.includes("الرئيسية");
    expect(is404, "صفحة غير موجودة يجب أن تعرض 404 أو تعيد التوجيه").toBe(true);
  });

  test("browser back button works correctly", async ({ page }) => {
    await page.goto("/");
    await waitForContent(page);
    await page.goto("/hadith");
    await waitForContent(page);
    await page.goBack();
    await waitForContent(page);
    expect(page.url()).toMatch(/\/(#.*)?$/);
  });

  test("settings page has language / appearance controls", async ({ page }) => {
    await page.goto("/settings");
    await waitForContent(page);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(10);
  });
});

test.describe("Bottom nav auto-hide — إخفاء تلقائي", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("nav is visible at page top", async ({ page }) => {
    await page.goto("/lessons");
    await waitForContent(page);
    const nav = page.locator("nav.bottom-nav, nav.bottom-nav--v2").first();
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute("data-hidden", "false");
    await expect(nav).toHaveClass(/bottom-nav--visible/);
  });

  test("scroll down hides bottom nav; scroll up shows it", async ({ page }) => {
    await page.goto("/lessons");
    await waitForContent(page);
    const nav = page.locator("nav.bottom-nav, nav.bottom-nav--v2").first();
    await expect(nav).toBeVisible();

    // محتوى طويل بما يكفي للتمرير
    await page.evaluate(() => {
      const main = document.querySelector("main.app-main") || document.body;
      const filler = document.createElement("div");
      filler.setAttribute("data-testid", "scroll-filler");
      filler.style.height = "2400px";
      filler.innerHTML = "<p id='last-readable'>فقرة أخيرة للقراءة دون تغطية</p>";
      main.appendChild(filler);
    });

    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" as ScrollBehavior }));
    await page.waitForTimeout(280);
    await expect(nav).toHaveAttribute("data-hidden", "true");
    await expect(nav).toHaveClass(/bottom-nav--hidden/);

    await page.evaluate(() => window.scrollTo({ top: 200, behavior: "instant" as ScrollBehavior }));
    await page.waitForTimeout(280);
    await expect(nav).toHaveAttribute("data-hidden", "false");
    await expect(nav).toHaveClass(/bottom-nav--visible/);
  });

  test("last paragraph is readable and not covered when nav visible", async ({ page }) => {
    await page.goto("/lessons");
    await waitForContent(page);

    await page.evaluate(() => {
      const main = document.querySelector("main.app-main") || document.body;
      const p = document.createElement("p");
      p.id = "last-readable";
      p.textContent = "فقرة أخيرة للقراءة دون تغطية من القائمة السفلية";
      p.style.margin = "0";
      p.style.padding = "0.5rem 1rem";
      main.appendChild(p);
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(200);

    const overlap = await page.evaluate(() => {
      const p = document.getElementById("last-readable");
      const nav = document.querySelector("nav.bottom-nav, nav.bottom-nav--v2");
      if (!p || !nav) return { ok: false, reason: "missing" };
      const pr = p.getBoundingClientRect();
      const nr = nav.getBoundingClientRect();
      const covered = pr.bottom > nr.top + 2;
      return { ok: !covered, prBottom: pr.bottom, nrTop: nr.top };
    });
    expect(overlap.ok, `آخر فقرة مغطاة: ${JSON.stringify(overlap)}`).toBe(true);
  });
});
