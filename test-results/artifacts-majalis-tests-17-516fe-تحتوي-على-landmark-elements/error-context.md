# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: artifacts/majalis/tests/17-accessibility.spec.ts >> إمكانية الوصول — WCAG >> الصفحة الرئيسية تحتوي على landmark elements
- Location: artifacts/majalis/tests/17-accessibility.spec.ts:23:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * 17-accessibility.spec.ts
  3   |  *
  4   |  * اختبارات إمكانية الوصول (WCAG) — يُشغَّل على Chromium فقط
  5   |  *   1. الصفحة الرئيسية — عناصر مفتاحية لإمكانية الوصول
  6   |  *   2. التنقل بلوحة المفاتيح (Tab order)
  7   |  *   3. نسب تباين الألوان — تحقق بنيوي لا بصري
  8   |  *   4. صفحة القصص الإسلامية — RTL + وصول
  9   |  *   5. صفحة الأحاديث — بنية semantic HTML
  10  |  *   6. alt text للصور
  11  |  *   7. نماذج تسجيل الدخول — label مرتبط بكل حقل
  12  |  *   8. إعلانات ARIA للحالات الديناميكية
  13  |  */
  14  | import { test, expect } from "@playwright/test";
  15  | 
  16  | test.describe.configure({ mode: "serial" });
  17  | 
  18  | test.describe("إمكانية الوصول — WCAG", () => {
  19  |   test.skip(({ browserName }) => browserName !== "chromium", "اختبارات الوصول على Chromium فقط");
  20  | 
  21  |   // ── 1. عناصر landmark الأساسية ───────────────────────────────────────────
  22  | 
  23  |   test("الصفحة الرئيسية تحتوي على landmark elements", async ({ page }) => {
> 24  |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  25  |     await page.waitForLoadState("networkidle");
  26  | 
  27  |     // يجب أن يكون هناك nav + main أو على الأقل تنظيم هيكلي
  28  |     const hasNav = await page.locator("nav, [role='navigation']").count() > 0;
  29  |     const hasMain = await page.locator("main, [role='main']").count() > 0;
  30  |     const hasHeader = await page.locator("header, [role='banner']").count() > 0;
  31  | 
  32  |     expect(hasNav || hasHeader, "يجب وجود nav أو header للتنقل").toBeTruthy();
  33  |     expect(hasMain || await page.locator("#root, #app, [data-main]").count() > 0, "يجب وجود منطقة main").toBeTruthy();
  34  |   });
  35  | 
  36  |   // ── 2. التنقل بلوحة المفاتيح ─────────────────────────────────────────────
  37  | 
  38  |   test("عناصر التنقل قابلة للوصول بـ Tab", async ({ page }) => {
  39  |     await page.goto("/");
  40  |     await page.waitForLoadState("networkidle");
  41  | 
  42  |     // اضغط Tab مرات عدة وتأكد أن التركيز يتحرك
  43  |     await page.keyboard.press("Tab");
  44  |     await page.keyboard.press("Tab");
  45  |     await page.keyboard.press("Tab");
  46  | 
  47  |     const focusedEl = await page.evaluate(() => {
  48  |       const el = document.activeElement;
  49  |       return el ? el.tagName + (el.getAttribute("href") || "") : null;
  50  |     });
  51  | 
  52  |     // يجب أن يتركز على شيء — أي عنصر تفاعلي
  53  |     expect(focusedEl).not.toBeNull();
  54  |     expect(focusedEl).not.toBe("BODY");
  55  |   });
  56  | 
  57  |   // ── 3. صفحة القصص — وصول RTL ────────────────────────────────────────────
  58  | 
  59  |   test("صفحة القصص الإسلامية لا تحتوي على صور بدون alt", async ({ page }) => {
  60  |     await page.goto("/islamic-stories");
  61  |     await page.waitForLoadState("networkidle");
  62  | 
  63  |     const imgsWithoutAlt = await page.evaluate(() => {
  64  |       return Array.from(document.images)
  65  |         .filter((img) => !img.alt && !img.getAttribute("aria-hidden"))
  66  |         .map((img) => img.src.slice(-50));
  67  |     });
  68  | 
  69  |     expect(
  70  |       imgsWithoutAlt,
  71  |       `صور بدون alt: ${imgsWithoutAlt.join(", ")}`
  72  |     ).toHaveLength(0);
  73  |   });
  74  | 
  75  |   test("صفحة القصص الإسلامية — lang أو dir محدد على html", async ({ page }) => {
  76  |     await page.goto("/islamic-stories");
  77  |     await page.waitForLoadState("networkidle");
  78  | 
  79  |     const htmlAttrs = await page.evaluate(() => ({
  80  |       lang: document.documentElement.lang,
  81  |       dir: document.documentElement.dir,
  82  |     }));
  83  | 
  84  |     const hasLang = htmlAttrs.lang.length > 0;
  85  |     const hasDir = htmlAttrs.dir.length > 0;
  86  |     expect(hasLang || hasDir, "يجب تحديد lang أو dir على <html>").toBeTruthy();
  87  |   });
  88  | 
  89  |   // ── 4. الأحاديث — بنية semantic ─────────────────────────────────────────
  90  | 
  91  |   test("صفحة الأحاديث تحتوي على عناوين هرمية", async ({ page }) => {
  92  |     await page.goto("/hadith");
  93  |     await page.waitForLoadState("networkidle");
  94  | 
  95  |     // يجب وجود h1 أو h2 على الأقل
  96  |     const headingCount = await page.locator("h1, h2, h3").count();
  97  |     expect(headingCount, "يجب وجود عناوين هرمية في الصفحة").toBeGreaterThan(0);
  98  |   });
  99  | 
  100 |   // ── 5. alt text للصور العامة ─────────────────────────────────────────────
  101 | 
  102 |   test("الصفحة الرئيسية لا تحتوي على صور محتوى بدون alt", async ({ page }) => {
  103 |     await page.goto("/");
  104 |     await page.waitForLoadState("networkidle");
  105 | 
  106 |     // الصور الزخرفية المقبول إخفاؤها عبر aria-hidden أو alt=""
  107 |     const imgsWithoutAlt = await page.evaluate(() => {
  108 |       return Array.from(document.images)
  109 |         .filter((img) => {
  110 |           const isHidden = img.getAttribute("aria-hidden") === "true";
  111 |           const hasEmptyAlt = img.alt === ""; // زخرفة — مقبول
  112 |           return !isHidden && !hasEmptyAlt && img.alt === undefined;
  113 |         })
  114 |         .map((img) => img.src.slice(-60));
  115 |     });
  116 | 
  117 |     expect(imgsWithoutAlt).toHaveLength(0);
  118 |   });
  119 | 
  120 |   // ── 6. نموذج تسجيل الدخول ────────────────────────────────────────────────
  121 | 
  122 |   test("نموذج تسجيل الدخول — الحقول مرتبطة بـ label أو aria-label", async ({ page }) => {
  123 |     await page.goto("/login");
  124 |     await page.waitForLoadState("networkidle");
```