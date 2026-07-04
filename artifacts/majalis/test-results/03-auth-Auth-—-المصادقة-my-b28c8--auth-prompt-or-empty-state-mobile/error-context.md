# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-auth.spec.ts >> Auth — المصادقة >> my-submissions page shows auth prompt or empty state
- Location: tests/03-auth.spec.ts:101:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/my-submissions
Call log:
  - navigating to "http://localhost:5173/my-submissions", waiting until "load"

```

# Test source

```ts
  2   |  * Authentication tests.
  3   |  * NOTE: Full auth-flow tests (actual login/register) require real Supabase
  4   |  * credentials (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local).
  5   |  * Without credentials, the login page shows a loading/unavailable state.
  6   |  * These tests handle both scenarios gracefully.
  7   |  */
  8   | import { test, expect } from "@playwright/test";
  9   | import { waitForContent } from "./helpers";
  10  | 
  11  | /** True if the page has the login form (Supabase configured) */
  12  | async function hasAuthForm(page: import("@playwright/test").Page): Promise<boolean> {
  13  |   return (await page.locator('input[type="email"]').count()) > 0;
  14  | }
  15  | 
  16  | test.describe("Auth — المصادقة", () => {
  17  |   test("login page renders (form or unavailable message)", async ({ page }) => {
  18  |     await page.goto("/login");
  19  |     await waitForContent(page);
  20  |     await page.waitForTimeout(2000); // wait for Supabase bootstrap attempt
  21  |     const body = await page.locator("body").innerText();
  22  |     expect(body.length, "صفحة تسجيل الدخول فارغة").toBeGreaterThan(5);
  23  |   });
  24  | 
  25  |   test("login form — when available, has email + password inputs", async ({ page }) => {
  26  |     await page.goto("/login");
  27  |     await waitForContent(page);
  28  |     await page.waitForTimeout(2000);
  29  | 
  30  |     if (!(await hasAuthForm(page))) {
  31  |       test.skip(); // Supabase not configured locally — skip
  32  |     }
  33  |     await expect(page.locator('input[type="email"]')).toBeVisible();
  34  |     await expect(page.locator('input[type="password"]')).toBeVisible();
  35  |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  36  |   });
  37  | 
  38  |   test("login form — empty submit stays on login page", async ({ page }) => {
  39  |     await page.goto("/login");
  40  |     await waitForContent(page);
  41  |     await page.waitForTimeout(2000);
  42  | 
  43  |     if (!(await hasAuthForm(page))) {
  44  |       test.skip();
  45  |     }
  46  |     await page.locator('button[type="submit"]').first().click();
  47  |     await page.waitForTimeout(500);
  48  |     expect(page.url()).toContain("/login");
  49  |   });
  50  | 
  51  |   test("login form — invalid credentials shows error", async ({ page }) => {
  52  |     await page.goto("/login");
  53  |     await waitForContent(page);
  54  |     await page.waitForTimeout(2000);
  55  | 
  56  |     if (!(await hasAuthForm(page))) {
  57  |       test.skip();
  58  |     }
  59  |     await page.locator('input[type="email"]').fill("invalid@test.com");
  60  |     await page.locator('input[type="password"]').fill("wrongpassword123");
  61  |     await page.locator('button[type="submit"]').first().click();
  62  |     await page.waitForTimeout(4000);
  63  |     const body = await page.locator("body").innerText();
  64  |     const hasError =
  65  |       body.includes("خطأ") || body.includes("غير") || body.includes("Invalid") ||
  66  |       body.includes("incorrect") || body.includes("تعذر");
  67  |     expect(hasError, "يجب أن تظهر رسالة خطأ عند بيانات غير صحيحة").toBe(true);
  68  |   });
  69  | 
  70  |   test("register page renders (form or unavailable message)", async ({ page }) => {
  71  |     await page.goto("/register");
  72  |     await waitForContent(page);
  73  |     await page.waitForTimeout(2000);
  74  |     const body = await page.locator("body").innerText();
  75  |     expect(body.length, "صفحة التسجيل فارغة").toBeGreaterThan(5);
  76  |   });
  77  | 
  78  |   test("register form — when available, has required fields", async ({ page }) => {
  79  |     await page.goto("/register");
  80  |     await waitForContent(page);
  81  |     await page.waitForTimeout(2000);
  82  | 
  83  |     if (!(await hasAuthForm(page))) {
  84  |       test.skip();
  85  |     }
  86  |     await expect(page.locator('input[type="email"]')).toBeVisible();
  87  |     await expect(page.locator('input[type="password"]')).toBeVisible();
  88  |   });
  89  | 
  90  |   test("link from login to register exists", async ({ page }) => {
  91  |     await page.goto("/login");
  92  |     await waitForContent(page);
  93  |     const registerLink = page.locator("a[href*='register']");
  94  |     if (await registerLink.count() > 0) {
  95  |       await registerLink.first().click();
  96  |       await waitForContent(page);
  97  |       expect(page.url()).toContain("register");
  98  |     }
  99  |   });
  100 | 
  101 |   test("my-submissions page shows auth prompt or empty state", async ({ page }) => {
> 102 |     await page.goto("/my-submissions");
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/my-submissions
  103 |     await waitForContent(page);
  104 |     await page.waitForTimeout(800);
  105 |     // Should show either: login redirect, "سجّل دخول" message, or empty submissions
  106 |     const body = await page.locator("body").innerText();
  107 |     expect(body.length, "/my-submissions يجب أن تعرض شيئاً").toBeGreaterThan(0);
  108 |     // Must NOT crash with a JS error
  109 |     const url = page.url();
  110 |     expect(url).not.toContain("error");
  111 |   });
  112 | 
  113 |   test("profile page requires auth", async ({ page }) => {
  114 |     await page.goto("/profile");
  115 |     await waitForContent(page);
  116 |     await page.waitForTimeout(500);
  117 |     const body = await page.locator("body").innerText();
  118 |     expect(body.length).toBeGreaterThan(0);
  119 |   });
  120 | });
  121 | 
```