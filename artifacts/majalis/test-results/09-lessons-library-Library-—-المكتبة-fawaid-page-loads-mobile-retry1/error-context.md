# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-lessons-library.spec.ts >> Library — المكتبة >> fawaid page loads
- Location: tests/09-lessons-library.spec.ts:69:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/fawaid
Call log:
  - navigating to "http://localhost:5173/fawaid", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Lessons & Library tests.
  3  |  */
  4  | import { test, expect } from "@playwright/test";
  5  | import { waitForContent } from "./helpers";
  6  | 
  7  | test.describe("Lessons — الدروس", () => {
  8  |   test.beforeEach(async ({ page }) => {
  9  |     await page.goto("/lessons");
  10 |     await waitForContent(page);
  11 |     await page.waitForTimeout(1000);
  12 |   });
  13 | 
  14 |   test("lessons page shows lesson cards", async ({ page }) => {
  15 |     const body = await page.locator("body").innerText();
  16 |     expect(body.length, "صفحة الدروس فارغة").toBeGreaterThan(50);
  17 |   });
  18 | 
  19 |   test("lessons search input filters results", async ({ page }) => {
  20 |     const searchInput = page.locator('input[aria-label*="بحث"]').first();
  21 |     if (await searchInput.count() > 0 && await searchInput.isVisible()) {
  22 |       await searchInput.fill("فقه");
  23 |       await page.waitForTimeout(600);
  24 |       const body = await page.locator("body").innerText();
  25 |       expect(body.length).toBeGreaterThan(5);
  26 |     }
  27 |   });
  28 | 
  29 |   test("lessons tab switching works", async ({ page }) => {
  30 |     const tabs = page.locator('button[role="tab"], button').filter({ hasText: /دروس|دورات|مساجد/ });
  31 |     if (await tabs.count() > 1) {
  32 |       await tabs.nth(1).click();
  33 |       await page.waitForTimeout(400);
  34 |       const body = await page.locator("body").innerText();
  35 |       expect(body.length).toBeGreaterThan(5);
  36 |     }
  37 |   });
  38 | 
  39 |   test("kuwait lessons page loads", async ({ page }) => {
  40 |     await page.goto("/kuwait-lessons");
  41 |     await waitForContent(page);
  42 |     const body = await page.locator("body").innerText();
  43 |     expect(body.length).toBeGreaterThan(5);
  44 |   });
  45 | });
  46 | 
  47 | test.describe("Library — المكتبة", () => {
  48 |   test("library page loads with books", async ({ page }) => {
  49 |     await page.goto("/library");
  50 |     await waitForContent(page);
  51 |     await page.waitForTimeout(1000);
  52 |     const body = await page.locator("body").innerText();
  53 |     expect(body.length, "المكتبة فارغة").toBeGreaterThan(20);
  54 |   });
  55 | 
  56 |   test("library search works", async ({ page }) => {
  57 |     await page.goto("/library");
  58 |     await waitForContent(page);
  59 |     await page.waitForTimeout(600);
  60 |     const search = page.locator('input[type="search"], input[placeholder*="بحث"]').first();
  61 |     if (await search.count() > 0 && await search.isVisible()) {
  62 |       await search.fill("فقه");
  63 |       await page.waitForTimeout(600);
  64 |     }
  65 |     const body = await page.locator("body").innerText();
  66 |     expect(body.length).toBeGreaterThan(5);
  67 |   });
  68 | 
  69 |   test("fawaid page loads", async ({ page }) => {
> 70 |     await page.goto("/fawaid");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/fawaid
  71 |     await waitForContent(page);
  72 |     await page.waitForTimeout(800);
  73 |     const body = await page.locator("body").innerText();
  74 |     expect(body.length).toBeGreaterThan(20);
  75 |   });
  76 | });
  77 | 
```