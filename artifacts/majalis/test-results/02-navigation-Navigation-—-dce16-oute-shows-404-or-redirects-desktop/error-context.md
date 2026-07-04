# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-navigation.spec.ts >> Navigation — التنقل >> unknown route shows 404 or redirects
- Location: tests/02-navigation.spec.ts:24:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/this-page-does-not-exist-xyz
Call log:
  - navigating to "http://localhost:5173/this-page-does-not-exist-xyz", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Navigation tests — bottom bar, links, back/forward, 404 handling.
  3  |  */
  4  | import { test, expect } from "@playwright/test";
  5  | import { waitForContent } from "./helpers";
  6  | 
  7  | test.describe("Navigation — التنقل", () => {
  8  |   test("bottom navigation bar is visible on home", async ({ page }) => {
  9  |     await page.goto("/");
  10 |     await waitForContent(page);
  11 |     // Bottom nav should contain known items
  12 |     const nav = page.locator("nav, [role=navigation]").first();
  13 |     await expect(nav).toBeVisible();
  14 |   });
  15 | 
  16 |   test("clicking Lessons nav link opens /lessons", async ({ page }) => {
  17 |     await page.goto("/");
  18 |     await waitForContent(page);
  19 |     await page.goto("/lessons");
  20 |     await waitForContent(page);
  21 |     expect(page.url()).toContain("/lessons");
  22 |   });
  23 | 
  24 |   test("unknown route shows 404 or redirects", async ({ page }) => {
> 25 |     await page.goto("/this-page-does-not-exist-xyz");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/this-page-does-not-exist-xyz
  26 |     await waitForContent(page);
  27 |     const text = await page.locator("body").innerText();
  28 |     const is404 = text.includes("404") || text.includes("غير موجود") || text.includes("الرئيسية");
  29 |     expect(is404, "صفحة غير موجودة يجب أن تعرض 404 أو تعيد التوجيه").toBe(true);
  30 |   });
  31 | 
  32 |   test("browser back button works correctly", async ({ page }) => {
  33 |     await page.goto("/");
  34 |     await waitForContent(page);
  35 |     await page.goto("/hadith");
  36 |     await waitForContent(page);
  37 |     await page.goBack();
  38 |     await waitForContent(page);
  39 |     expect(page.url()).toMatch(/\/(#.*)?$/);
  40 |   });
  41 | 
  42 |   test("settings page has language / appearance controls", async ({ page }) => {
  43 |     await page.goto("/settings");
  44 |     await waitForContent(page);
  45 |     const body = await page.locator("body").innerText();
  46 |     expect(body.length).toBeGreaterThan(10);
  47 |   });
  48 | });
  49 | 
```