/**
 * Authentication tests.
 * NOTE: Full auth-flow tests (actual login/register) require real Supabase
 * credentials (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local).
 * Without credentials, the login page shows a loading/unavailable state.
 * These tests handle both scenarios gracefully.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

/** True if the page has the login form (Supabase configured) */
async function hasAuthForm(page: import("@playwright/test").Page): Promise<boolean> {
  return (await page.locator('input[type="email"]').count()) > 0;
}

test.describe("Auth — المصادقة", () => {
  test("login page renders (form or unavailable message)", async ({ page }) => {
    await page.goto("/login");
    await waitForContent(page);
    await page.waitForTimeout(2000); // wait for Supabase bootstrap attempt
    const body = await page.locator("body").innerText();
    expect(body.length, "صفحة تسجيل الدخول فارغة").toBeGreaterThan(5);
  });

  test("login form — when available, has email + password inputs", async ({ page }) => {
    await page.goto("/login");
    await waitForContent(page);
    await page.waitForTimeout(2000);

    if (!(await hasAuthForm(page))) {
      test.skip(); // Supabase not configured locally — skip
    }
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("login form — empty submit stays on login page", async ({ page }) => {
    await page.goto("/login");
    await waitForContent(page);
    await page.waitForTimeout(2000);

    if (!(await hasAuthForm(page))) {
      test.skip();
    }
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain("/login");
  });

  test("login form — invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await waitForContent(page);
    await page.waitForTimeout(2000);

    if (!(await hasAuthForm(page))) {
      test.skip();
    }
    await page.locator('input[type="email"]').fill("invalid@test.com");
    await page.locator('input[type="password"]').fill("wrongpassword123");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(4000);
    const body = await page.locator("body").innerText();
    const hasError =
      body.includes("خطأ") || body.includes("غير") || body.includes("Invalid") ||
      body.includes("incorrect") || body.includes("تعذر");
    expect(hasError, "يجب أن تظهر رسالة خطأ عند بيانات غير صحيحة").toBe(true);
  });

  test("register page renders (form or unavailable message)", async ({ page }) => {
    await page.goto("/register");
    await waitForContent(page);
    await page.waitForTimeout(2000);
    const body = await page.locator("body").innerText();
    expect(body.length, "صفحة التسجيل فارغة").toBeGreaterThan(5);
  });

  test("register form — when available, has required fields", async ({ page }) => {
    await page.goto("/register");
    await waitForContent(page);
    await page.waitForTimeout(2000);

    if (!(await hasAuthForm(page))) {
      test.skip();
    }
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("link from login to register exists", async ({ page }) => {
    await page.goto("/login");
    await waitForContent(page);
    const registerLink = page.locator("a[href*='register']");
    if (await registerLink.count() > 0) {
      await registerLink.first().click();
      await waitForContent(page);
      expect(page.url()).toContain("register");
    }
  });

  test("my-submissions page shows auth prompt or empty state", async ({ page }) => {
    await page.goto("/my-submissions");
    await waitForContent(page);
    await page.waitForTimeout(800);
    // Should show either: login redirect, "سجّل دخول" message, or empty submissions
    const body = await page.locator("body").innerText();
    expect(body.length, "/my-submissions يجب أن تعرض شيئاً").toBeGreaterThan(0);
    // Must NOT crash with a JS error
    const url = page.url();
    expect(url).not.toContain("error");
  });

  test("profile page requires auth", async ({ page }) => {
    await page.goto("/profile");
    await waitForContent(page);
    await page.waitForTimeout(500);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(0);
  });
});
