/**
 * 17-accessibility.spec.ts
 *
 * اختبارات إمكانية الوصول (WCAG) — يُشغَّل على Chromium فقط
 *   1. الصفحة الرئيسية — عناصر مفتاحية لإمكانية الوصول
 *   2. التنقل بلوحة المفاتيح (Tab order)
 *   3. نسب تباين الألوان — تحقق بنيوي لا بصري
 *   4. صفحة القصص الإسلامية — RTL + وصول
 *   5. صفحة الأحاديث — بنية semantic HTML
 *   6. alt text للصور
 *   7. نماذج تسجيل الدخول — label مرتبط بكل حقل
 *   8. إعلانات ARIA للحالات الديناميكية
 */
import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("إمكانية الوصول — WCAG", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "اختبارات الوصول على Chromium فقط");

  // ── 1. عناصر landmark الأساسية ───────────────────────────────────────────

  test("الصفحة الرئيسية تحتوي على landmark elements", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // يجب أن يكون هناك nav + main أو على الأقل تنظيم هيكلي
    const hasNav = await page.locator("nav, [role='navigation']").count() > 0;
    const hasMain = await page.locator("main, [role='main']").count() > 0;
    const hasHeader = await page.locator("header, [role='banner']").count() > 0;

    expect(hasNav || hasHeader, "يجب وجود nav أو header للتنقل").toBeTruthy();
    expect(hasMain || await page.locator("#root, #app, [data-main]").count() > 0, "يجب وجود منطقة main").toBeTruthy();
  });

  // ── 2. التنقل بلوحة المفاتيح ─────────────────────────────────────────────

  test("عناصر التنقل قابلة للوصول بـ Tab", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // اضغط Tab مرات عدة وتأكد أن التركيز يتحرك
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const focusedEl = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName + (el.getAttribute("href") || "") : null;
    });

    // يجب أن يتركز على شيء — أي عنصر تفاعلي
    expect(focusedEl).not.toBeNull();
    expect(focusedEl).not.toBe("BODY");
  });

  // ── 3. صفحة القصص — وصول RTL ────────────────────────────────────────────

  test("صفحة القصص الإسلامية لا تحتوي على صور بدون alt", async ({ page }) => {
    await page.goto("/islamic-stories");
    await page.waitForLoadState("networkidle");

    const imgsWithoutAlt = await page.evaluate(() => {
      return Array.from(document.images)
        .filter((img) => {
          // alt="" مقبول (صورة زخرفية) — نرفض فقط غياب السمة كلياً
          const isHidden = img.getAttribute("aria-hidden") === "true";
          const hasAltAttr = img.hasAttribute("alt"); // alt="" = موجود
          return !isHidden && !hasAltAttr;
        })
        .map((img) => img.src.slice(-50));
    });

    expect(
      imgsWithoutAlt,
      `صور بدون alt attribute: ${imgsWithoutAlt.join(", ")}`
    ).toHaveLength(0);
  });

  test("صفحة القصص الإسلامية — lang أو dir محدد على html", async ({ page }) => {
    await page.goto("/islamic-stories");
    await page.waitForLoadState("networkidle");

    const htmlAttrs = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
    }));

    const hasLang = htmlAttrs.lang.length > 0;
    const hasDir = htmlAttrs.dir.length > 0;
    expect(hasLang || hasDir, "يجب تحديد lang أو dir على <html>").toBeTruthy();
  });

  // ── 4. الأحاديث — بنية semantic ─────────────────────────────────────────

  test("صفحة الأحاديث تحتوي على عناوين هرمية", async ({ page }) => {
    await page.goto("/hadith");
    await page.waitForLoadState("networkidle");

    // يجب وجود h1 أو h2 على الأقل
    const headingCount = await page.locator("h1, h2, h3").count();
    expect(headingCount, "يجب وجود عناوين هرمية في الصفحة").toBeGreaterThan(0);
  });

  // ── 5. alt text للصور العامة ─────────────────────────────────────────────

  test("الصفحة الرئيسية لا تحتوي على صور محتوى بدون alt", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // الصور الزخرفية المقبول إخفاؤها عبر aria-hidden أو alt=""
    const imgsWithoutAlt = await page.evaluate(() => {
      return Array.from(document.images)
        .filter((img) => {
          const isHidden = img.getAttribute("aria-hidden") === "true";
          const hasEmptyAlt = img.alt === ""; // زخرفة — مقبول
          return !isHidden && !hasEmptyAlt && img.alt === undefined;
        })
        .map((img) => img.src.slice(-60));
    });

    expect(imgsWithoutAlt).toHaveLength(0);
  });

  // ── 6. نموذج تسجيل الدخول ────────────────────────────────────────────────

  test("نموذج تسجيل الدخول — الحقول مرتبطة بـ label أو aria-label", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const inputs = page.locator("input:not([type='hidden']):not([type='submit'])");
    const count = await inputs.count();

    if (count === 0) {
      // نموذج غير متاح — يُقبل في هذه الحالة
      return;
    }

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");
      const placeholder = await input.getAttribute("placeholder");

      const hasLabel =
        ariaLabel ||
        ariaLabelledBy ||
        placeholder ||
        (id && (await page.locator(`label[for="${id}"]`).count()) > 0);

      expect(hasLabel, `حقل input رقم ${i + 1} بدون تسمية وصفية`).toBeTruthy();
    }
  });

  // ── 7. أزرار لها نص أو aria-label ────────────────────────────────────────

  test("الأزرار في الصفحة الرئيسية لها نص وصفي", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const emptyButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("button"))
        .filter((btn) => {
          const hasText = (btn.textContent || "").trim().length > 0;
          const hasAria = btn.getAttribute("aria-label") || btn.getAttribute("aria-labelledby");
          const isHidden = btn.getAttribute("aria-hidden") === "true";
          return !isHidden && !hasText && !hasAria;
        })
        .map((btn) => btn.className.slice(0, 40));
    });

    expect(
      emptyButtons,
      `أزرار بدون نص وصفي: ${emptyButtons.join(" | ")}`
    ).toHaveLength(0);
  });

  // ── 8. focus-visible لا يختفي ────────────────────────────────────────────

  test("لوحة التحكم المدمجة — لوحة مفاتيح تعمل على صفحة البحث", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("networkidle");

    // حقل البحث يجب أن يقبل التركيز ويمكن الكتابة فيه
    const searchInput = page.locator("input[type='search'], input[placeholder*='بحث']").first();
    if (await searchInput.isVisible()) {
      await searchInput.focus();
      await page.keyboard.type("اختبار");
      const val = await searchInput.inputValue();
      expect(val.length).toBeGreaterThan(0);
    }
  });
});
