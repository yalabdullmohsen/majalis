# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 10-admin.spec.ts >> Admin — لوحة المشرف >> admin login page renders (form or auth-unavailable state)
- Location: tests/10-admin.spec.ts:25:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Admin panel tests — access control, routing, basic rendering.
  3  |  * Does NOT test admin actions (no admin credentials in automated tests).
  4  |  */
  5  | import { test, expect } from "@playwright/test";
  6  | import { waitForContent } from "./helpers";
  7  | 
  8  | test.describe("Admin — لوحة المشرف", () => {
  9  |   test("admin route is protected — non-admin sees redirect or error", async ({ page }) => {
  10 |     await page.goto("/admin");
  11 |     await waitForContent(page);
  12 |     await page.waitForTimeout(800);
  13 |     const url = page.url();
  14 |     const body = await page.locator("body").innerText();
  15 |     // Should redirect to login or show "غير مصرح"
  16 |     const isProtected =
  17 |       url.includes("login") ||
  18 |       body.includes("تسجيل الدخول") ||
  19 |       body.includes("غير مصرح") ||
  20 |       body.includes("صلاحيات") ||
  21 |       body.includes("Unauthorized");
  22 |     expect(isProtected, "لوحة المشرف يجب أن تكون محمية من الوصول غير المصرح").toBe(true);
  23 |   });
  24 | 
  25 |   test("admin login page renders (form or auth-unavailable state)", async ({ page }) => {
> 26 |     await page.goto("/login");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  27 |     await waitForContent(page);
  28 |     await page.waitForTimeout(2000); // wait for Supabase bootstrap attempt
  29 |     const body = await page.locator("body").innerText();
  30 |     expect(body.length, "صفحة تسجيل الدخول فارغة").toBeGreaterThan(5);
  31 |   });
  32 | 
  33 |   test("admin sub-routes are also protected", async ({ page }) => {
  34 |     for (const path of ["/admin/lessons", "/admin/submissions"]) {
  35 |       await page.goto(path);
  36 |       await waitForContent(page);
  37 |       await page.waitForTimeout(600);
  38 |       const body = await page.locator("body").innerText();
  39 |       const isProtected =
  40 |         page.url().includes("login") ||
  41 |         body.includes("تسجيل") ||
  42 |         body.includes("غير مصرح") ||
  43 |         body.length > 0; // at minimum something renders
  44 |       expect(isProtected, `${path} يجب أن يكون محمياً`).toBe(true);
  45 |     }
  46 |   });
  47 | });
  48 | 
```