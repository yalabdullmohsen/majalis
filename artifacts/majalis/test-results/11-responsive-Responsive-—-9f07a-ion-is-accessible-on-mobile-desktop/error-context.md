# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-responsive.spec.ts >> Responsive — التجاوب مع الشاشات >> home page — navigation is accessible on mobile
- Location: tests/11-responsive.spec.ts:28:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Responsive design tests — mobile (375×812) and desktop (1280×800).
  3  |  * These tests run on both projects defined in playwright.config.ts.
  4  |  */
  5  | import { test, expect } from "@playwright/test";
  6  | import { waitForContent } from "./helpers";
  7  | 
  8  | const KEY_PAGES = ["/", "/lessons", "/hadith", "/quran", "/adhkar", "/muezzins"];
  9  | 
  10 | test.describe("Responsive — التجاوب مع الشاشات", () => {
  11 |   for (const path of KEY_PAGES) {
  12 |     test(`${path} renders without overflow`, async ({ page }) => {
  13 |       await page.goto(path);
  14 |       await waitForContent(page);
  15 |       await page.waitForTimeout(500);
  16 | 
  17 |       const { width } = page.viewportSize()!;
  18 | 
  19 |       // Check horizontal scroll — body should not be wider than viewport
  20 |       const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  21 |       expect(
  22 |         bodyWidth,
  23 |         `${path} يسبب تمرير أفقي (body=${bodyWidth}px > viewport=${width}px)`,
  24 |       ).toBeLessThanOrEqual(width + 1); // 1px tolerance for rounding
  25 |     });
  26 |   }
  27 | 
  28 |   test("home page — navigation is accessible on mobile", async ({ page }) => {
> 29 |     await page.goto("/");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  30 |     await waitForContent(page);
  31 |     // Bottom nav or hamburger should be present
  32 |     const nav = page.locator('nav, [role="navigation"], [class*="bottom-nav"], [class*="tab-bar"]').first();
  33 |     await expect(nav).toBeVisible();
  34 |   });
  35 | 
  36 |   test("hadith page — cards fit in viewport without overlap", async ({ page }) => {
  37 |     await page.goto("/hadith");
  38 |     await waitForContent(page);
  39 |     await page.waitForTimeout(1200);
  40 |     // No horizontal scroll
  41 |     const { width } = page.viewportSize()!;
  42 |     const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  43 |     expect(scrollW).toBeLessThanOrEqual(width + 2);
  44 |   });
  45 | 
  46 |   test("quran page — surah list scrollable vertically on mobile", async ({ page }) => {
  47 |     await page.goto("/quran");
  48 |     await waitForContent(page);
  49 |     await page.waitForTimeout(600);
  50 |     const scrollH = await page.evaluate(() => document.documentElement.scrollHeight);
  51 |     const viewH = page.viewportSize()!.height;
  52 |     // Content should either fit or be scrollable
  53 |     expect(scrollH).toBeGreaterThan(0);
  54 |     void viewH;
  55 |   });
  56 | 
  57 |   test("login page renders on mobile without overflow", async ({ page }) => {
  58 |     await page.goto("/login");
  59 |     await waitForContent(page);
  60 |     await page.waitForTimeout(1000);
  61 |     // No horizontal scroll
  62 |     const { width } = page.viewportSize()!;
  63 |     const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  64 |     expect(scrollW, "صفحة الدخول تسبب تمرير أفقي على الهاتف").toBeLessThanOrEqual(width + 2);
  65 |     // Page has content
  66 |     const body = await page.locator("body").innerText();
  67 |     expect(body.length).toBeGreaterThan(5);
  68 |     // If form is visible, check it fits in viewport
  69 |     const emailInput = page.locator('input[type="email"]');
  70 |     if (await emailInput.count() > 0) {
  71 |       const box = await emailInput.boundingBox();
  72 |       if (box) {
  73 |         expect(box.x + box.width).toBeLessThanOrEqual(width + 2);
  74 |       }
  75 |     }
  76 |   });
  77 | });
  78 | 
```