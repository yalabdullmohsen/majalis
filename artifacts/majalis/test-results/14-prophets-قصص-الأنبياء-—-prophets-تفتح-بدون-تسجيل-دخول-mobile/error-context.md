# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 14-prophets.spec.ts >> قصص الأنبياء — /prophets >> تفتح بدون تسجيل دخول
- Location: tests/14-prophets.spec.ts:21:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/prophets
Call log:
  - navigating to "http://localhost:5173/prophets", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * 14-prophets.spec.ts
  3   |  *
  4   |  * اختبارات صفحة قصص الأنبياء — /prophets
  5   |  *   1. الصفحة تفتح بدون تسجيل دخول
  6   |  *   2. شبكة بطاقات الأنبياء تظهر
  7   |  *   3. النقر على بطاقة يفتح تفاصيل النبي
  8   |  *   4. زر الرجوع يعود إلى الشبكة
  9   |  *   5. تبويب الجدول الزمني (Timeline) يعمل
  10  |  *   6. تبويب المسابقة (Quiz) يعمل
  11  |  *   7. الـ SEO: title + description مضبوطة
  12  |  *   8. مسار /prophets/:slug يفتح بدون خطأ
  13  |  */
  14  | import { test, expect } from "@playwright/test";
  15  | 
  16  | test.describe("قصص الأنبياء — /prophets", () => {
  17  |   test.describe.configure({ mode: "serial" });
  18  | 
  19  |   // ── 1. الوصول العام ─────────────────────────────────────────────────────────
  20  | 
  21  |   test("تفتح بدون تسجيل دخول", async ({ page }) => {
> 22  |     await page.goto("/prophets");
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/prophets
  23  |     await expect(page).not.toHaveURL(/\/(login|admin)/);
  24  |     await expect(page.locator("body")).not.toContainText("غير مصرح");
  25  |     await expect(page.locator("body")).not.toContainText("Unauthorized");
  26  |   });
  27  | 
  28  |   // ── 2. شبكة البطاقات ────────────────────────────────────────────────────────
  29  | 
  30  |   test("تعرض شبكة بطاقات الأنبياء", async ({ page }) => {
  31  |     await page.goto("/prophets");
  32  |     await page.waitForLoadState("networkidle");
  33  |     // يجب أن يكون هناك عدة بطاقات (على الأقل 10 أنبياء)
  34  |     const cards = page.locator(".prophet-card, [class*='prophet'][class*='card'], .ps-card");
  35  |     const count = await cards.count();
  36  |     expect(count).toBeGreaterThanOrEqual(5);
  37  |   });
  38  | 
  39  |   test("تعرض أسماء أنبياء بالعربية", async ({ page }) => {
  40  |     await page.goto("/prophets");
  41  |     await page.waitForLoadState("networkidle");
  42  |     const body = await page.locator("body").textContent();
  43  |     // يجب أن تظهر أسماء أنبياء أساسية
  44  |     expect(body).toContain("آدم");
  45  |     expect(body).toContain("نوح");
  46  |     expect(body).toContain("موسى");
  47  |   });
  48  | 
  49  |   // ── 3. فتح تفاصيل نبي ──────────────────────────────────────────────────────
  50  | 
  51  |   test("النقر على بطاقة يفتح تفاصيل النبي", async ({ page }) => {
  52  |     await page.goto("/prophets");
  53  |     await page.waitForLoadState("networkidle");
  54  | 
  55  |     // اضغط على أول بطاقة
  56  |     const firstCard = page.locator(".prophet-card, [class*='prophet'][class*='card'], .ps-card").first();
  57  |     if (await firstCard.isVisible()) {
  58  |       await firstCard.click();
  59  |       await page.waitForTimeout(500);
  60  |       // يجب أن تظهر تفاصيل (زر الرجوع أو قسم Hero)
  61  |       const hasDetail = await page.locator("button").filter({ hasText: /رجوع|العودة|←|‹/ }).isVisible().catch(() => false);
  62  |       const hasHero = await page.locator(".prophet-detail, .ps-detail, [class*='detail']").isVisible().catch(() => false);
  63  |       expect(hasDetail || hasHero).toBeTruthy();
  64  |     }
  65  |   });
  66  | 
  67  |   // ── 4. زر الرجوع ────────────────────────────────────────────────────────────
  68  | 
  69  |   test("زر الرجوع يعود إلى الشبكة", async ({ page }) => {
  70  |     await page.goto("/prophets");
  71  |     await page.waitForLoadState("networkidle");
  72  | 
  73  |     const firstCard = page.locator(".prophet-card, [class*='prophet'][class*='card'], .ps-card").first();
  74  |     if (await firstCard.isVisible()) {
  75  |       await firstCard.click();
  76  |       await page.waitForTimeout(400);
  77  | 
  78  |       const backBtn = page.locator("button").filter({ hasText: /رجوع|العودة/ }).first();
  79  |       if (await backBtn.isVisible()) {
  80  |         await backBtn.click();
  81  |         await page.waitForTimeout(400);
  82  |         // يجب أن تعود الشبكة
  83  |         const cards = page.locator(".prophet-card, [class*='prophet'][class*='card'], .ps-card");
  84  |         await expect(cards.first()).toBeVisible({ timeout: 3000 });
  85  |       }
  86  |     }
  87  |   });
  88  | 
  89  |   // ── 5. تبويب الجدول الزمني ──────────────────────────────────────────────────
  90  | 
  91  |   test("تبويب الجدول الزمني يعرض محتوى", async ({ page }) => {
  92  |     await page.goto("/prophets");
  93  |     await page.waitForLoadState("networkidle");
  94  | 
  95  |     const timelineTab = page.locator("button, [role='tab']").filter({ hasText: /جدول|زمني|timeline/i }).first();
  96  |     if (await timelineTab.isVisible()) {
  97  |       await timelineTab.click();
  98  |       await page.waitForTimeout(400);
  99  |       const body = await page.locator("body").textContent();
  100 |       // الجدول الزمني يجب أن يعرض على الأقل اسم نبي واحد
  101 |       const hasName = body?.includes("آدم") || body?.includes("نوح") || body?.includes("موسى");
  102 |       expect(hasName).toBeTruthy();
  103 |     }
  104 |   });
  105 | 
  106 |   // ── 6. تبويب المسابقة ───────────────────────────────────────────────────────
  107 | 
  108 |   test("تبويب المسابقة يعرض أسئلة", async ({ page }) => {
  109 |     await page.goto("/prophets");
  110 |     await page.waitForLoadState("networkidle");
  111 | 
  112 |     const quizTab = page.locator("button, [role='tab']").filter({ hasText: /مسابقة|اختبار|quiz/i }).first();
  113 |     if (await quizTab.isVisible()) {
  114 |       await quizTab.click();
  115 |       await page.waitForTimeout(400);
  116 |       // يجب أن يظهر سؤال أو زر البداية
  117 |       const body = await page.locator("body").textContent();
  118 |       const hasQuiz = body?.includes("سؤال") || body?.includes("ابدأ") || body?.includes("اختر");
  119 |       expect(hasQuiz).toBeTruthy();
  120 |     }
  121 |   });
  122 | 
```