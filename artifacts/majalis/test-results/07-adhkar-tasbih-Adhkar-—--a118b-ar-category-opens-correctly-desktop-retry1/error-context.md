# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-adhkar-tasbih.spec.ts >> Adhkar — الأذكار >> adhkar category opens correctly
- Location: tests/07-adhkar-tasbih.spec.ts:16:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/adhkar
Call log:
  - navigating to "http://localhost:5173/adhkar", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Adhkar & Tasbeeh tests — counter, categories, navigation.
  3  |  */
  4  | import { test, expect } from "@playwright/test";
  5  | import { waitForContent } from "./helpers";
  6  | 
  7  | test.describe("Adhkar — الأذكار", () => {
  8  |   test("adhkar page loads with categories", async ({ page }) => {
  9  |     await page.goto("/adhkar");
  10 |     await waitForContent(page);
  11 |     const body = await page.locator("body").innerText();
  12 |     const hasContent = body.includes("أذكار") || body.includes("دعاء") || body.includes("ذكر");
  13 |     expect(hasContent, "صفحة الأذكار لا تحتوي محتوى").toBe(true);
  14 |   });
  15 | 
  16 |   test("adhkar category opens correctly", async ({ page }) => {
> 17 |     await page.goto("/adhkar");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/adhkar
  18 |     await waitForContent(page);
  19 |     const categoryBtn = page.locator("button, a").filter({ hasText: /الصباح|المساء|النوم|الصلاة/ }).first();
  20 |     if (await categoryBtn.count() > 0) {
  21 |       await categoryBtn.click();
  22 |       await waitForContent(page);
  23 |       const body = await page.locator("body").innerText();
  24 |       expect(body.length).toBeGreaterThan(50);
  25 |     }
  26 |   });
  27 | });
  28 | 
  29 | test.describe("Tasbih — التسبيح", () => {
  30 |   test("tasbih page loads counter", async ({ page }) => {
  31 |     await page.goto("/tasbih");
  32 |     await waitForContent(page);
  33 |     const body = await page.locator("body").innerText();
  34 |     const hasCounter = body.includes("تسبيح") || body.includes("0") || body.match(/\d+/);
  35 |     expect(hasCounter, "صفحة التسبيح لا تحمل عداداً").toBeTruthy();
  36 |   });
  37 | 
  38 |   test("counter increments on click", async ({ page }) => {
  39 |     await page.goto("/tasbih");
  40 |     await waitForContent(page);
  41 |     await page.waitForTimeout(500);
  42 | 
  43 |     // The main counter button shows "اضغط" or is the large tap area
  44 |     const mainBtn = page.locator("button").filter({ hasText: /اضغط/ }).first();
  45 |     const fallback = page.locator('button[class*="counter"], [class*="tasbih-btn"], [class*="tap"]').first();
  46 |     const btn = (await mainBtn.count() > 0) ? mainBtn : fallback;
  47 | 
  48 |     if (await btn.count() > 0) {
  49 |       // Read the counter number before clicking
  50 |       const counterEl = page.locator('[class*="count"], [class*="number"]').filter({ hasText: /^\d+$/ }).first();
  51 |       const before = await counterEl.innerText().catch(() => "");
  52 |       await btn.click();
  53 |       await page.waitForTimeout(300);
  54 |       const after = await counterEl.innerText().catch(() => "1");
  55 |       // Counter text should have changed OR body changed
  56 |       const bodyAfter = await page.locator("body").innerText();
  57 |       const changed = after !== before || bodyAfter.length > 0;
  58 |       expect(changed, "زر التسبيح يجب أن يعمل").toBe(true);
  59 |     }
  60 |   });
  61 | 
  62 |   test("clicking main area increments counter", async ({ page }) => {
  63 |     await page.goto("/tasbih");
  64 |     await waitForContent(page);
  65 |     await page.waitForTimeout(400);
  66 | 
  67 |     // Try clicking the page center where the counter usually is
  68 |     const { width, height } = page.viewportSize()!;
  69 |     await page.mouse.click(width / 2, height / 2);
  70 |     await page.waitForTimeout(200);
  71 |     const body = await page.locator("body").innerText();
  72 |     expect(body.length).toBeGreaterThan(0);
  73 |   });
  74 | });
  75 | 
```