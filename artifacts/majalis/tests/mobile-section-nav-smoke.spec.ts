/**
 * Smoke تنقّل الموبايل بين أقسام الشريط السفلي.
 * يتأكد: لا شاشة فارغة، لا أخطاء console حرجة، استجابة بعد الضغط.
 */
import { test, expect, type Page } from "@playwright/test";
import { collectConsoleErrors, waitForContent } from "./helpers";

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
});

const TABS = [
  { href: "/quran-hub", name: /قرآن|مركز/ },
  { href: "/lessons", name: /دروس/ },
  { href: "/prayer-times", name: /صلاة|مواقيت/ },
  { href: "/fiqh", name: /فقه/ },
  { href: "/sections", name: /أقسام|المزيد/ },
] as const;

async function dismissSplash(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("majalis-theme", "light");
    window.localStorage.setItem("majlis_intro_seen", "1");
    window.localStorage.setItem("majalis-intro-seen", "1");
    window.sessionStorage.setItem("mj.launch-splash.session.v2", "1");
  });
}

async function assertPageAlive(page: Page, path: string) {
  await page.waitForFunction(
    () => {
      const splash = document.getElementById("mj-launch-splash");
      const splashGone =
        !splash ||
        splash.hasAttribute("hidden") ||
        splash.classList.contains("mj-launch-splash--out") ||
        getComputedStyle(splash).display === "none";
      const text = (document.body?.innerText || "").replace(/\s+/g, " ").trim();
      return splashGone && text.length > 24;
    },
    { timeout: 25_000 },
  );
  const body = await page.locator("body").innerText();
  expect(body.length, `صفحة فارغة: ${path}`).toBeGreaterThan(24);
  expect(page.url()).toContain(path.split("?")[0]);
}

test.describe("Mobile bottom-nav section smoke", () => {
  test("يفتح كل قسم من الشريط السفلي بدون تعليق أو أخطاء", async ({ page }) => {
    await dismissSplash(page);
    const errors = collectConsoleErrors(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    await assertPageAlive(page, "/");

    const nav = page.locator('[data-bottom-nav], nav[aria-label="التنقل السفلي"]').first();
    await expect(nav).toBeVisible({ timeout: 15_000 });

    for (const tab of TABS) {
      const link = nav.locator(`a[href="${tab.href}"]`).first();
      await expect(link, `تبويب ${tab.href}`).toBeVisible();
      await link.click();
      await waitForContent(page);
      await assertPageAlive(page, tab.href);
      // لمس فعّال: العنصر النشط يجب أن يظهر
      await expect(link).toHaveAttribute("aria-current", "page");
    }

    const critical = errors
      .map((e) => e.text())
      .filter((t) => !/favicon|supabase|Failed to load resource|ResizeObserver/i.test(t));
    expect(critical, `أخطاء JS أثناء تنقّل الأقسام: ${critical.join(" | ")}`).toHaveLength(0);
  });

  test("الرجوع السريع بين دروس وفقه لا يترك شاشة فارغة", async ({ page }) => {
    await dismissSplash(page);
    await page.goto("/lessons", { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    await assertPageAlive(page, "/lessons");

    await page.goto("/fiqh", { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    await assertPageAlive(page, "/fiqh");

    await page.goBack();
    await waitForContent(page);
    await assertPageAlive(page, "/lessons");
  });
});
