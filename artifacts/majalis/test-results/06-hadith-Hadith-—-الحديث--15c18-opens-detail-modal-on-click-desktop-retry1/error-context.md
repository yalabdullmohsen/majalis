# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-hadith.spec.ts >> Hadith — الحديث >> hadith card opens detail modal on click
- Location: tests/06-hadith.spec.ts:19:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/hadith
Call log:
  - navigating to "http://localhost:5173/hadith", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Hadith page tests — cards, modal, copy button, filters.
  3  |  */
  4  | import { test, expect } from "@playwright/test";
  5  | import { waitForContent } from "./helpers";
  6  | 
  7  | test.describe("Hadith — الحديث", () => {
  8  |   test.beforeEach(async ({ page }) => {
> 9  |     await page.goto("/hadith");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/hadith
  10 |     await waitForContent(page);
  11 |     await page.waitForTimeout(1500); // wait for Supabase fetch
  12 |   });
  13 | 
  14 |   test("page loads and shows hadith cards", async ({ page }) => {
  15 |     const body = await page.locator("body").innerText();
  16 |     expect(body.length, "صفحة الحديث فارغة").toBeGreaterThan(50);
  17 |   });
  18 | 
  19 |   test("hadith card opens detail modal on click", async ({ page }) => {
  20 |     const cards = page.locator('[class*="hadith-card"], article').filter({ hasText: /حديث|قال|روى/ });
  21 |     if (await cards.count() > 0) {
  22 |       await cards.first().click();
  23 |       await page.waitForTimeout(400);
  24 |       // Modal or detail should appear
  25 |       const modal = page.locator('[role="dialog"], [class*="modal"]');
  26 |       const bodyText = await page.locator("body").innerText();
  27 |       const hasDetail = await modal.count() > 0 || bodyText.includes("المصدر");
  28 |       expect(hasDetail, "النقر على بطاقة الحديث يجب أن يفتح التفاصيل").toBe(true);
  29 |     }
  30 |   });
  31 | 
  32 |   test("Escape closes hadith modal", async ({ page }) => {
  33 |     const cards = page.locator('[class*="hadith-card"], article').filter({ hasText: /حديث|قال|روى/ });
  34 |     if (await cards.count() > 0) {
  35 |       await cards.first().click();
  36 |       await page.waitForTimeout(300);
  37 |       await page.keyboard.press("Escape");
  38 |       await page.waitForTimeout(300);
  39 |       const modal = page.locator('[role="dialog"]');
  40 |       if (await modal.count() > 0) {
  41 |         await expect(modal).not.toBeVisible();
  42 |       }
  43 |     }
  44 |   });
  45 | 
  46 |   test("collection filter chips are clickable", async ({ page }) => {
  47 |     const filter = page.locator('[class*="filter"], button').filter({ hasText: /البخاري|مسلم|متفق/ }).first();
  48 |     if (await filter.count() > 0) {
  49 |       await filter.click();
  50 |       await page.waitForTimeout(400);
  51 |       const body = await page.locator("body").innerText();
  52 |       expect(body.length).toBeGreaterThan(5);
  53 |     }
  54 |   });
  55 | 
  56 |   test("hadith copy button copies text (no crash)", async ({ page }) => {
  57 |     // Grant clipboard write
  58 |     await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  59 |     const copyBtn = page.locator('button[aria-label*="نسخ"], button[title*="نسخ"]').first();
  60 |     if (await copyBtn.count() > 0) {
  61 |       await copyBtn.click();
  62 |       await page.waitForTimeout(300);
  63 |       // Button should show "تم النسخ" or similar
  64 |       const btnText = await copyBtn.innerText().catch(() => "");
  65 |       const body = await page.locator("body").innerText();
  66 |       const success = btnText.includes("✓") || body.includes("تم") || btnText.includes("تم");
  67 |       // At minimum it shouldn't crash
  68 |       expect(await page.locator("body").innerText()).toBeTruthy();
  69 |     }
  70 |   });
  71 | });
  72 | 
```