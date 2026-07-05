# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 17-accessibility.spec.ts >> إمكانية الوصول — WCAG >> صفحة القصص الإسلامية — lang أو dir محدد على html
- Location: tests/17-accessibility.spec.ts:80:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "تخطّي إلى المحتوى" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - button "القائمة" [ref=e8] [cursor=pointer]:
          - img [ref=e9]
          - generic [ref=e11]: القائمة
        - link "المجلس العلمي" [ref=e12] [cursor=pointer]:
          - /url: /
          - generic [ref=e13]: المجلس العلمي
      - navigation "التنقل الرئيسي" [ref=e14]:
        - link "الرئيسية" [ref=e15] [cursor=pointer]:
          - /url: /
        - link "الدروس" [ref=e16] [cursor=pointer]:
          - /url: /lessons
        - link "القرآن" [ref=e17] [cursor=pointer]:
          - /url: /quran
        - link "المكتبة" [ref=e18] [cursor=pointer]:
          - /url: /library
        - link "الأذكار" [ref=e19] [cursor=pointer]:
          - /url: /adhkar
        - link "الصلاة" [ref=e20] [cursor=pointer]:
          - /url: /prayer-times
      - generic [ref=e21]:
        - button "البحث الشامل (⌘K)" [ref=e22] [cursor=pointer]:
          - img [ref=e23]
          - generic [ref=e26]: بحث
          - generic [ref=e27]: ⌘K
        - generic [ref=e28]:
          - textbox "كلمة البحث" [ref=e30]:
            - /placeholder: بحث...
          - button "بحث" [ref=e31] [cursor=pointer]
        - generic [ref=e32]:
          - link "دخول" [ref=e33] [cursor=pointer]:
            - /url: /login
          - link "إنشاء حساب" [ref=e34] [cursor=pointer]:
            - /url: /register
        - button "Switch to English" [ref=e35] [cursor=pointer]: EN
  - main [ref=e36]:
    - generic [ref=e37]:
      - generic [ref=e38]:
        - generic:
          - img
        - generic [ref=e39]:
          - generic [ref=e40]:
            - img [ref=e41]
            - img [ref=e43]
            - img [ref=e45]
          - heading "القصص الإسلامية" [level=1] [ref=e47]
          - generic [ref=e48]: صحابة الكرام · الفتوحات الإسلامية · التاريخ الحضاري
          - generic [ref=e49]:
            - generic [ref=e50]: صحابة · 0
            - generic [ref=e51]: فتوحات · 0
            - generic [ref=e52]: تاريخ · 0
      - generic [ref=e53]:
        - textbox "🔍 ابحث في القصص…" [ref=e55]
        - generic [ref=e56]:
          - generic [ref=e57]: التصنيف
          - generic [ref=e58]:
            - button "الكل" [ref=e59] [cursor=pointer]
            - button "صحابة" [ref=e60] [cursor=pointer]
            - button "فتوحات" [ref=e61] [cursor=pointer]
            - button "تاريخ" [ref=e62] [cursor=pointer]
        - generic [ref=e63]:
          - generic [ref=e64]: الحقبة الزمنية
          - generic [ref=e65]:
            - button "الكل" [ref=e66] [cursor=pointer]
            - button "نبوي" [ref=e67] [cursor=pointer]
            - button "راشدي" [ref=e68] [cursor=pointer]
            - button "أموي" [ref=e69] [cursor=pointer]
            - button "عباسي" [ref=e70] [cursor=pointer]
            - button "عثماني" [ref=e71] [cursor=pointer]
            - button "حديث" [ref=e72] [cursor=pointer]
        - generic [ref=e73]: 0 قصة
        - generic [ref=e74]:
          - generic [ref=e75]: ⚠️
          - generic [ref=e76]: قاعدة البيانات غير مُهيأة.
  - contentinfo "تذييل موقع المجلس العلمي" [ref=e77]:
    - generic [ref=e78]:
      - generic [ref=e79]:
        - img [ref=e80]
        - img [ref=e83]
        - generic [ref=e84]:
          - strong [ref=e85]: المجلس العلمي
          - paragraph [ref=e86]: تطبيق علمي شرعي للدروس والعبادة والمحتوى اليومي.
          - paragraph [ref=e87]:
            - link "yalabdullmohsen1@gmail.com" [ref=e88] [cursor=pointer]:
              - /url: mailto:yalabdullmohsen1@gmail.com
      - generic [ref=e89]:
        - generic [ref=e90]:
          - paragraph [ref=e91]: المحتوى
          - navigation [ref=e92]:
            - link "الدروس" [ref=e93] [cursor=pointer]:
              - /url: /lessons
            - link "الفوائد" [ref=e94] [cursor=pointer]:
              - /url: /fawaid
            - link "الأحاديث" [ref=e95] [cursor=pointer]:
              - /url: /hadith
            - link "القصص" [ref=e96] [cursor=pointer]:
              - /url: /stories
            - link "الأسئلة" [ref=e97] [cursor=pointer]:
              - /url: /qa
        - generic [ref=e98]:
          - paragraph [ref=e99]: العبادة
          - navigation [ref=e100]:
            - link "القرآن" [ref=e101] [cursor=pointer]:
              - /url: /quran
            - link "الأذكار" [ref=e102] [cursor=pointer]:
              - /url: /adhkar
            - link "مواقيت الصلاة" [ref=e103] [cursor=pointer]:
              - /url: /prayer-times
            - link "التسابيح" [ref=e104] [cursor=pointer]:
              - /url: /tasbih
        - generic [ref=e105]:
          - paragraph [ref=e106]: التطبيق
          - navigation [ref=e107]:
            - link "من نحن" [ref=e108] [cursor=pointer]:
              - /url: /about
            - link "تواصل معنا" [ref=e109] [cursor=pointer]:
              - /url: /contact
            - link "مميزات قيد التطوير" [ref=e110] [cursor=pointer]:
              - /url: /features-in-progress
            - link "الخصوصية" [ref=e111] [cursor=pointer]:
              - /url: /privacy
            - link "الشروط" [ref=e112] [cursor=pointer]:
              - /url: /terms
      - paragraph [ref=e113]: © 2026 المجلس العلمي
  - button "فتح المساعد العلمي" [ref=e114] [cursor=pointer]:
    - img [ref=e115]
    - generic [ref=e118]: المساعد
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
  24  |     await page.goto("/");
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
  65  |         .filter((img) => {
  66  |           // alt="" مقبول (صورة زخرفية) — نرفض فقط غياب السمة كلياً
  67  |           const isHidden = img.getAttribute("aria-hidden") === "true";
  68  |           const hasAltAttr = img.hasAttribute("alt"); // alt="" = موجود
  69  |           return !isHidden && !hasAltAttr;
  70  |         })
  71  |         .map((img) => img.src.slice(-50));
  72  |     });
  73  | 
  74  |     expect(
  75  |       imgsWithoutAlt,
  76  |       `صور بدون alt attribute: ${imgsWithoutAlt.join(", ")}`
  77  |     ).toHaveLength(0);
  78  |   });
  79  | 
  80  |   test("صفحة القصص الإسلامية — lang أو dir محدد على html", async ({ page }) => {
  81  |     await page.goto("/islamic-stories");
> 82  |     await page.waitForLoadState("networkidle");
      |                ^ Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
  83  | 
  84  |     const htmlAttrs = await page.evaluate(() => ({
  85  |       lang: document.documentElement.lang,
  86  |       dir: document.documentElement.dir,
  87  |     }));
  88  | 
  89  |     const hasLang = htmlAttrs.lang.length > 0;
  90  |     const hasDir = htmlAttrs.dir.length > 0;
  91  |     expect(hasLang || hasDir, "يجب تحديد lang أو dir على <html>").toBeTruthy();
  92  |   });
  93  | 
  94  |   // ── 4. الأحاديث — بنية semantic ─────────────────────────────────────────
  95  | 
  96  |   test("صفحة الأحاديث تحتوي على عناوين هرمية", async ({ page }) => {
  97  |     await page.goto("/hadith");
  98  |     await page.waitForLoadState("networkidle");
  99  | 
  100 |     // يجب وجود h1 أو h2 على الأقل
  101 |     const headingCount = await page.locator("h1, h2, h3").count();
  102 |     expect(headingCount, "يجب وجود عناوين هرمية في الصفحة").toBeGreaterThan(0);
  103 |   });
  104 | 
  105 |   // ── 5. alt text للصور العامة ─────────────────────────────────────────────
  106 | 
  107 |   test("الصفحة الرئيسية لا تحتوي على صور محتوى بدون alt", async ({ page }) => {
  108 |     await page.goto("/");
  109 |     await page.waitForLoadState("networkidle");
  110 | 
  111 |     // الصور الزخرفية المقبول إخفاؤها عبر aria-hidden أو alt=""
  112 |     const imgsWithoutAlt = await page.evaluate(() => {
  113 |       return Array.from(document.images)
  114 |         .filter((img) => {
  115 |           const isHidden = img.getAttribute("aria-hidden") === "true";
  116 |           const hasEmptyAlt = img.alt === ""; // زخرفة — مقبول
  117 |           return !isHidden && !hasEmptyAlt && img.alt === undefined;
  118 |         })
  119 |         .map((img) => img.src.slice(-60));
  120 |     });
  121 | 
  122 |     expect(imgsWithoutAlt).toHaveLength(0);
  123 |   });
  124 | 
  125 |   // ── 6. نموذج تسجيل الدخول ────────────────────────────────────────────────
  126 | 
  127 |   test("نموذج تسجيل الدخول — الحقول مرتبطة بـ label أو aria-label", async ({ page }) => {
  128 |     await page.goto("/login");
  129 |     await page.waitForLoadState("networkidle");
  130 |     await page.waitForTimeout(500);
  131 | 
  132 |     const inputs = page.locator("input:not([type='hidden']):not([type='submit'])");
  133 |     const count = await inputs.count();
  134 | 
  135 |     if (count === 0) {
  136 |       // نموذج غير متاح — يُقبل في هذه الحالة
  137 |       return;
  138 |     }
  139 | 
  140 |     for (let i = 0; i < count; i++) {
  141 |       const input = inputs.nth(i);
  142 |       const id = await input.getAttribute("id");
  143 |       const ariaLabel = await input.getAttribute("aria-label");
  144 |       const ariaLabelledBy = await input.getAttribute("aria-labelledby");
  145 |       const placeholder = await input.getAttribute("placeholder");
  146 | 
  147 |       const hasLabel =
  148 |         ariaLabel ||
  149 |         ariaLabelledBy ||
  150 |         placeholder ||
  151 |         (id && (await page.locator(`label[for="${id}"]`).count()) > 0);
  152 | 
  153 |       expect(hasLabel, `حقل input رقم ${i + 1} بدون تسمية وصفية`).toBeTruthy();
  154 |     }
  155 |   });
  156 | 
  157 |   // ── 7. أزرار لها نص أو aria-label ────────────────────────────────────────
  158 | 
  159 |   test("الأزرار في الصفحة الرئيسية لها نص وصفي", async ({ page }) => {
  160 |     await page.goto("/");
  161 |     await page.waitForLoadState("networkidle");
  162 | 
  163 |     const emptyButtons = await page.evaluate(() => {
  164 |       return Array.from(document.querySelectorAll("button"))
  165 |         .filter((btn) => {
  166 |           const hasText = (btn.textContent || "").trim().length > 0;
  167 |           const hasAria = btn.getAttribute("aria-label") || btn.getAttribute("aria-labelledby");
  168 |           const isHidden = btn.getAttribute("aria-hidden") === "true";
  169 |           return !isHidden && !hasText && !hasAria;
  170 |         })
  171 |         .map((btn) => btn.className.slice(0, 40));
  172 |     });
  173 | 
  174 |     expect(
  175 |       emptyButtons,
  176 |       `أزرار بدون نص وصفي: ${emptyButtons.join(" | ")}`
  177 |     ).toHaveLength(0);
  178 |   });
  179 | 
  180 |   // ── 8. focus-visible لا يختفي ────────────────────────────────────────────
  181 | 
  182 |   test("لوحة التحكم المدمجة — لوحة مفاتيح تعمل على صفحة البحث", async ({ page }) => {
```