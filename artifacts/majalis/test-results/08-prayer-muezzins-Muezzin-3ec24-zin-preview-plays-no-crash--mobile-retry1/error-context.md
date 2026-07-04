# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-prayer-muezzins.spec.ts >> Muezzins — المؤذنون >> clicking muezzin preview plays (no crash)
- Location: tests/08-prayer-muezzins.spec.ts:78:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/muezzins
Call log:
  - navigating to "http://localhost:5173/muezzins", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * Prayer times & Muezzins tests.
  3   |  */
  4   | import { test, expect } from "@playwright/test";
  5   | import { waitForContent } from "./helpers";
  6   | 
  7   | test.describe("Prayer Times — مواقيت الصلاة", () => {
  8   |   test("prayer times page loads", async ({ page }) => {
  9   |     await page.goto("/prayer-times");
  10  |     await waitForContent(page);
  11  |     const body = await page.locator("body").innerText();
  12  |     const hasPrayers =
  13  |       body.includes("الفجر") ||
  14  |       body.includes("الظهر") ||
  15  |       body.includes("العصر") ||
  16  |       body.includes("المغرب") ||
  17  |       body.includes("العشاء") ||
  18  |       body.includes("صلاة");
  19  |     expect(hasPrayers, "صفحة مواقيت الصلاة لا تعرض أوقات الصلاة").toBe(true);
  20  |   });
  21  | 
  22  |   test("prayer times shows qibla link or direction", async ({ page }) => {
  23  |     await page.goto("/prayer-times");
  24  |     await waitForContent(page);
  25  |     const qiblaLink = page.locator("a[href*='qibla'], button").filter({ hasText: /قبلة|اتجاه/ });
  26  |     // Either qibla link exists or page has useful content
  27  |     const body = await page.locator("body").innerText();
  28  |     expect(body.length).toBeGreaterThan(20);
  29  |   });
  30  | 
  31  |   test("qibla page loads", async ({ page }) => {
  32  |     await page.goto("/qibla");
  33  |     await waitForContent(page);
  34  |     const body = await page.locator("body").innerText();
  35  |     expect(body.length).toBeGreaterThan(5);
  36  |   });
  37  | 
  38  |   test("adhan settings page loads with toggle controls", async ({ page }) => {
  39  |     await page.goto("/adhan-settings");
  40  |     await waitForContent(page);
  41  |     const body = await page.locator("body").innerText();
  42  |     const hasSettings = body.includes("أذان") || body.includes("إعداد") || body.includes("مؤذن");
  43  |     expect(hasSettings).toBe(true);
  44  |   });
  45  | });
  46  | 
  47  | test.describe("Muezzins — المؤذنون", () => {
  48  |   test("muezzins page loads with muezzin cards", async ({ page }) => {
  49  |     await page.goto("/muezzins");
  50  |     await waitForContent(page);
  51  |     await page.waitForTimeout(600);
  52  |     const body = await page.locator("body").innerText();
  53  |     const hasMuezzins = body.includes("مؤذن") || body.includes("أذان") || body.includes("تقييم");
  54  |     expect(hasMuezzins, "صفحة المؤذنين لا تحتوي بطاقات").toBe(true);
  55  |   });
  56  | 
  57  |   test("muezzin style filter works", async ({ page }) => {
  58  |     await page.goto("/muezzins");
  59  |     await waitForContent(page);
  60  |     const filterBtn = page.locator("button").filter({ hasText: /خاشع|رسمي|تقليدي|كلاسيكي/ }).first();
  61  |     if (await filterBtn.count() > 0) {
  62  |       await filterBtn.click();
  63  |       await page.waitForTimeout(400);
  64  |       const body = await page.locator("body").innerText();
  65  |       expect(body.length).toBeGreaterThan(10);
  66  |     }
  67  |   });
  68  | 
  69  |   test("muezzin preview button exists", async ({ page }) => {
  70  |     await page.goto("/muezzins");
  71  |     await waitForContent(page);
  72  |     await page.waitForTimeout(600);
  73  |     const previewBtns = page.locator("button").filter({ hasText: /▶|معاينة|تشغيل/ });
  74  |     const count = await previewBtns.count();
  75  |     expect(count, "لا توجد أزرار معاينة للمؤذنين").toBeGreaterThan(0);
  76  |   });
  77  | 
  78  |   test("clicking muezzin preview plays (no crash)", async ({ page }) => {
  79  |     await page.context().grantPermissions([]);
> 80  |     await page.goto("/muezzins");
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/muezzins
  81  |     await waitForContent(page);
  82  |     await page.waitForTimeout(600);
  83  |     const previewBtn = page.locator("button").filter({ hasText: /▶/ }).first();
  84  |     if (await previewBtn.count() > 0) {
  85  |       await previewBtn.click();
  86  |       await page.waitForTimeout(500);
  87  |       // Page should remain functional
  88  |       const body = await page.locator("body").innerText();
  89  |       expect(body.length).toBeGreaterThan(5);
  90  |     }
  91  |   });
  92  | 
  93  |   test("muezzin detail page loads", async ({ page }) => {
  94  |     await page.goto("/muezzins/sudais");
  95  |     await waitForContent(page);
  96  |     const body = await page.locator("body").innerText();
  97  |     expect(body.length).toBeGreaterThan(5);
  98  |   });
  99  | 
  100 |   test("muezzin favorites page loads", async ({ page }) => {
  101 |     await page.goto("/muezzins/favorites");
  102 |     await waitForContent(page);
  103 |     const body = await page.locator("body").innerText();
  104 |     const hasContent = body.includes("مفضل") || body.includes("مؤذن") || body.includes("مكتبة");
  105 |     expect(hasContent).toBe(true);
  106 |   });
  107 | });
  108 | 
```