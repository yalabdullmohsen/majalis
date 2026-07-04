# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-quran.spec.ts >> Quran — المصحف >> quran page loads with surah list
- Location: tests/05-quran.spec.ts:8:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/quran
Call log:
  - navigating to "http://localhost:5173/quran", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Quran tests — page loads, surah list, navigation, audio controls.
  3  |  */
  4  | import { test, expect } from "@playwright/test";
  5  | import { waitForContent } from "./helpers";
  6  | 
  7  | test.describe("Quran — المصحف", () => {
  8  |   test("quran page loads with surah list", async ({ page }) => {
> 9  |     await page.goto("/quran");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/quran
  10 |     await waitForContent(page);
  11 |     await page.waitForTimeout(800);
  12 |     const body = await page.locator("body").innerText();
  13 |     // قسم القرآن أُحيل لـ"قريباً" — نتحقق فقط من تحميل الصفحة بمحتوى
  14 |     const hasContent = body.length > 10;
  15 |     expect(hasContent, "صفحة القرآن يجب أن تحمّل بمحتوى").toBe(true);
  16 |   });
  17 | 
  18 |   test("clicking on Surah Al-Fatiha navigates to its page", async ({ page }) => {
  19 |     await page.goto("/quran");
  20 |     await waitForContent(page);
  21 |     await page.waitForTimeout(600);
  22 |     const fatiha = page.locator('text=الفاتحة').first();
  23 |     if (await fatiha.count() > 0) {
  24 |       await fatiha.click();
  25 |       await waitForContent(page);
  26 |       const body = await page.locator("body").innerText();
  27 |       const hasFatiha = body.includes("الفاتحة") || body.includes("بسم الله");
  28 |       expect(hasFatiha).toBe(true);
  29 |     }
  30 |   });
  31 | 
  32 |   test("quran page has search or filter capability", async ({ page }) => {
  33 |     await page.goto("/quran");
  34 |     await waitForContent(page);
  35 |     const searchEl = page.locator('input[type="search"], input[placeholder*="بحث"], input[placeholder*="سورة"]');
  36 |     // Either search exists or list is visible
  37 |     const hasSearch = await searchEl.count() > 0;
  38 |     const hasList = await page.locator("body").innerText().then((t) => t.length > 50);
  39 |     expect(hasSearch || hasList).toBe(true);
  40 |   });
  41 | 
  42 |   test("quran radio page loads and shows station list", async ({ page }) => {
  43 |     await page.goto("/quran-radio");
  44 |     await waitForContent(page);
  45 |     await page.waitForTimeout(600);
  46 |     const body = await page.locator("body").innerText();
  47 |     expect(body.length, "صفحة راديو القرآن فارغة").toBeGreaterThan(20);
  48 |   });
  49 | 
  50 |   test("quran radio play button is clickable", async ({ page }) => {
  51 |     // Grant autoplay
  52 |     await page.context().grantPermissions(["camera", "microphone"]);
  53 |     await page.goto("/quran-radio");
  54 |     await waitForContent(page);
  55 |     await page.waitForTimeout(600);
  56 |     const playBtn = page.locator('button').filter({ hasText: /تشغيل|▶|play/i }).first();
  57 |     if (await playBtn.count() > 0) {
  58 |       await playBtn.click();
  59 |       await page.waitForTimeout(600);
  60 |       // Should not crash — just verify page is still responsive
  61 |       const body = await page.locator("body").innerText();
  62 |       expect(body.length).toBeGreaterThan(5);
  63 |     }
  64 |   });
  65 | });
  66 | 
```