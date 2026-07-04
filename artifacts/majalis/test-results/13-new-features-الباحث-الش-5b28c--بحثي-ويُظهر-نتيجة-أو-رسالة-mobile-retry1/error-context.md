# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 13-new-features.spec.ts >> الباحث الشرعي (RAG) — /scholarly-research >> يقبل استعلام بحثي ويُظهر نتيجة أو رسالة
- Location: tests/13-new-features.spec.ts:26:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/scholarly-research
Call log:
  - navigating to "http://localhost:5173/scholarly-research", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * 13-new-features.spec.ts
  3  |  *
  4  |  * اختبارات الميزات الجديدة:
  5  |  *   - الباحث الشرعي (RAG) — /scholarly-research
  6  |  *   - دليل الجامعات — /universities
  7  |  */
  8  | import { test, expect } from "@playwright/test";
  9  | 
  10 | // ── الباحث الشرعي ─────────────────────────────────────────────────────────────
  11 | 
  12 | test.describe("الباحث الشرعي (RAG) — /scholarly-research", () => {
  13 |   test("يفتح الصفحة بدون تسجيل دخول", async ({ page }) => {
  14 |     await page.goto("/scholarly-research");
  15 |     await expect(page).not.toHaveURL(/\/(login|admin)/);
  16 |     await expect(page.locator("body")).not.toContainText("غير مصرح");
  17 |   });
  18 | 
  19 |   test("يعرض حقل البحث", async ({ page }) => {
  20 |     await page.goto("/scholarly-research");
  21 |     await page.waitForLoadState("networkidle");
  22 |     const input = page.locator("input, textarea").first();
  23 |     await expect(input).toBeVisible();
  24 |   });
  25 | 
  26 |   test("يقبل استعلام بحثي ويُظهر نتيجة أو رسالة", async ({ page }) => {
> 27 |     await page.goto("/scholarly-research");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/scholarly-research
  28 |     await page.waitForLoadState("networkidle");
  29 |     const input = page.locator("input, textarea").first();
  30 |     await input.fill("حكم الصلاة");
  31 |     // زر البحث أو Enter
  32 |     const btn = page.locator("button").filter({ hasText: /بحث|ابحث|إرسال/ }).first();
  33 |     if (await btn.isVisible()) {
  34 |       await btn.click();
  35 |     } else {
  36 |       await input.press("Enter");
  37 |     }
  38 |     // انتظار الاستجابة (حتى 15 ثانية)
  39 |     await page.waitForTimeout(3000);
  40 |     // يجب أن يكون هناك محتوى أو رسالة تحميل
  41 |     const body = page.locator("body");
  42 |     await expect(body).not.toContainText("خطأ غير متوقع");
  43 |   });
  44 | });
  45 | 
  46 | // ── دليل الجامعات ──────────────────────────────────────────────────────────────
  47 | 
  48 | test.describe("دليل الجامعات — /universities", () => {
  49 |   test("يفتح الصفحة بدون تسجيل دخول", async ({ page }) => {
  50 |     await page.goto("/universities");
  51 |     await expect(page).not.toHaveURL(/\/(login|admin)/);
  52 |     await expect(page.locator("body")).not.toContainText("غير مصرح");
  53 |   });
  54 | 
  55 |   test("يعرض محتوى الصفحة", async ({ page }) => {
  56 |     await page.goto("/universities");
  57 |     await page.waitForLoadState("networkidle");
  58 |     const body = page.locator("body");
  59 |     // يجب أن يظهر عنوان أو قائمة
  60 |     await expect(body).not.toContainText("خطأ غير متوقع");
  61 |     await expect(body).not.toBeEmpty();
  62 |   });
  63 | 
  64 |   test("صفحة المقارنة تفتح بدون خطأ", async ({ page }) => {
  65 |     await page.goto("/universities/compare");
  66 |     await expect(page).not.toHaveURL(/\/(login|admin)/);
  67 |     const body = page.locator("body");
  68 |     await expect(body).not.toContainText("خطأ غير متوقع");
  69 |   });
  70 | 
  71 |   test("يعرض حقل البحث عند وجوده", async ({ page }) => {
  72 |     await page.goto("/universities");
  73 |     await page.waitForLoadState("networkidle");
  74 |     // الصفحة تحتوي على input أو محتوى
  75 |     const hasContent = await page.locator("body").textContent();
  76 |     expect(hasContent?.length).toBeGreaterThan(10);
  77 |   });
  78 | });
  79 | 
```