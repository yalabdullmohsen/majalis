# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-search.spec.ts >> Search — البحث >> lessons page search filters results
- Location: tests/04-search.spec.ts:22:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/lessons
Call log:
  - navigating to "http://localhost:5173/lessons", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Search tests — global search, page-level search, filters.
  3  |  */
  4  | import { test, expect } from "@playwright/test";
  5  | import { waitForContent } from "./helpers";
  6  | 
  7  | test.describe("Search — البحث", () => {
  8  |   test("search page loads and shows input", async ({ page }) => {
  9  |     await page.goto("/search");
  10 |     await waitForContent(page);
  11 |     await expect(page.locator('input[type="search"], input[placeholder*="بحث"], input[aria-label*="بحث"]').first()).toBeVisible();
  12 |   });
  13 | 
  14 |   test("search query via URL shows results or empty state", async ({ page }) => {
  15 |     await page.goto("/search/صلاة");
  16 |     await waitForContent(page);
  17 |     await page.waitForTimeout(1500); // wait for Supabase results
  18 |     const body = await page.locator("body").innerText();
  19 |     expect(body.length).toBeGreaterThan(5);
  20 |   });
  21 | 
  22 |   test("lessons page search filters results", async ({ page }) => {
> 23 |     await page.goto("/lessons");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/lessons
  24 |     await waitForContent(page);
  25 |     const searchInput = page.locator('input[aria-label*="بحث"], input[placeholder*="بحث"]').first();
  26 |     if (await searchInput.count() > 0 && await searchInput.isVisible()) {
  27 |       await searchInput.fill("فقه");
  28 |       await page.waitForTimeout(800); // debounce
  29 |       const body = await page.locator("body").innerText();
  30 |       expect(body.length).toBeGreaterThan(5);
  31 |     }
  32 |   });
  33 | 
  34 |   test("hadith page search works", async ({ page }) => {
  35 |     await page.goto("/hadith");
  36 |     await waitForContent(page);
  37 |     await page.waitForTimeout(1000);
  38 |     const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"]').first();
  39 |     if (await searchInput.count() > 0 && await searchInput.isVisible()) {
  40 |       await searchInput.fill("تقوى");
  41 |       await page.waitForTimeout(800);
  42 |       const body = await page.locator("body").innerText();
  43 |       expect(body.length).toBeGreaterThan(5);
  44 |     }
  45 |   });
  46 | 
  47 |   test("search clears and resets correctly", async ({ page }) => {
  48 |     await page.goto("/search");
  49 |     await waitForContent(page);
  50 |     const input = page.locator('input').first();
  51 |     await input.fill("اختبار");
  52 |     await page.waitForTimeout(500);
  53 |     await input.clear();
  54 |     await page.waitForTimeout(300);
  55 |     expect(await input.inputValue()).toBe("");
  56 |   });
  57 | });
  58 | 
```