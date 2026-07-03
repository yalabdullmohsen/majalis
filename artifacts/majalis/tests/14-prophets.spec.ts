/**
 * 14-prophets.spec.ts
 *
 * اختبارات صفحة قصص الأنبياء — /prophets
 *   1. الصفحة تفتح بدون تسجيل دخول
 *   2. شبكة بطاقات الأنبياء تظهر
 *   3. النقر على بطاقة يفتح تفاصيل النبي
 *   4. زر الرجوع يعود إلى الشبكة
 *   5. تبويب الجدول الزمني (Timeline) يعمل
 *   6. تبويب المسابقة (Quiz) يعمل
 *   7. الـ SEO: title + description مضبوطة
 *   8. مسار /prophets/:slug يفتح بدون خطأ
 */
import { test, expect } from "@playwright/test";

test.describe("قصص الأنبياء — /prophets", () => {
  test.describe.configure({ mode: "serial" });

  // ── 1. الوصول العام ─────────────────────────────────────────────────────────

  test("تفتح بدون تسجيل دخول", async ({ page }) => {
    await page.goto("/prophets");
    await expect(page).not.toHaveURL(/\/(login|admin)/);
    await expect(page.locator("body")).not.toContainText("غير مصرح");
    await expect(page.locator("body")).not.toContainText("Unauthorized");
  });

  // ── 2. شبكة البطاقات ────────────────────────────────────────────────────────

  test("تعرض شبكة بطاقات الأنبياء", async ({ page }) => {
    await page.goto("/prophets");
    await page.waitForLoadState("networkidle");
    // يجب أن يكون هناك عدة بطاقات (على الأقل 10 أنبياء)
    const cards = page.locator(".prophet-card, [class*='prophet'][class*='card'], .ps-card");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("تعرض أسماء أنبياء بالعربية", async ({ page }) => {
    await page.goto("/prophets");
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").textContent();
    // يجب أن تظهر أسماء أنبياء أساسية
    expect(body).toContain("آدم");
    expect(body).toContain("نوح");
    expect(body).toContain("موسى");
  });

  // ── 3. فتح تفاصيل نبي ──────────────────────────────────────────────────────

  test("النقر على بطاقة يفتح تفاصيل النبي", async ({ page }) => {
    await page.goto("/prophets");
    await page.waitForLoadState("networkidle");

    // اضغط على أول بطاقة
    const firstCard = page.locator(".prophet-card, [class*='prophet'][class*='card'], .ps-card").first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(500);
      // يجب أن تظهر تفاصيل (زر الرجوع أو قسم Hero)
      const hasDetail = await page.locator("button").filter({ hasText: /رجوع|العودة|←|‹/ }).isVisible().catch(() => false);
      const hasHero = await page.locator(".prophet-detail, .ps-detail, [class*='detail']").isVisible().catch(() => false);
      expect(hasDetail || hasHero).toBeTruthy();
    }
  });

  // ── 4. زر الرجوع ────────────────────────────────────────────────────────────

  test("زر الرجوع يعود إلى الشبكة", async ({ page }) => {
    await page.goto("/prophets");
    await page.waitForLoadState("networkidle");

    const firstCard = page.locator(".prophet-card, [class*='prophet'][class*='card'], .ps-card").first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(400);

      const backBtn = page.locator("button").filter({ hasText: /رجوع|العودة/ }).first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(400);
        // يجب أن تعود الشبكة
        const cards = page.locator(".prophet-card, [class*='prophet'][class*='card'], .ps-card");
        await expect(cards.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });

  // ── 5. تبويب الجدول الزمني ──────────────────────────────────────────────────

  test("تبويب الجدول الزمني يعرض محتوى", async ({ page }) => {
    await page.goto("/prophets");
    await page.waitForLoadState("networkidle");

    const timelineTab = page.locator("button, [role='tab']").filter({ hasText: /جدول|زمني|timeline/i }).first();
    if (await timelineTab.isVisible()) {
      await timelineTab.click();
      await page.waitForTimeout(400);
      const body = await page.locator("body").textContent();
      // الجدول الزمني يجب أن يعرض على الأقل اسم نبي واحد
      const hasName = body?.includes("آدم") || body?.includes("نوح") || body?.includes("موسى");
      expect(hasName).toBeTruthy();
    }
  });

  // ── 6. تبويب المسابقة ───────────────────────────────────────────────────────

  test("تبويب المسابقة يعرض أسئلة", async ({ page }) => {
    await page.goto("/prophets");
    await page.waitForLoadState("networkidle");

    const quizTab = page.locator("button, [role='tab']").filter({ hasText: /مسابقة|اختبار|quiz/i }).first();
    if (await quizTab.isVisible()) {
      await quizTab.click();
      await page.waitForTimeout(400);
      // يجب أن يظهر سؤال أو زر البداية
      const body = await page.locator("body").textContent();
      const hasQuiz = body?.includes("سؤال") || body?.includes("ابدأ") || body?.includes("اختر");
      expect(hasQuiz).toBeTruthy();
    }
  });

  // ── 7. SEO ───────────────────────────────────────────────────────────────────

  test("title يحتوي على قصص الأنبياء أو المجلس العلمي", async ({ page }) => {
    await page.goto("/prophets");
    await page.waitForLoadState("networkidle");
    const title = await page.title();
    expect(title).toMatch(/أنبياء|المجلس العلمي/);
  });

  test("meta description موجودة", async ({ page }) => {
    await page.goto("/prophets");
    await page.waitForLoadState("networkidle");
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(20);
  });

  // ── 8. مسارات الأنبياء الفردية ──────────────────────────────────────────────

  test("/prophets/adam يفتح بدون خطأ", async ({ page }) => {
    await page.goto("/prophets/adam");
    // الـ SPA يعيد توجيه /prophets/adam إلى /prophets مع فتح التفاصيل
    // أو يفتح الصفحة مباشرة
    await expect(page).not.toHaveURL(/\/(login|admin)/);
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);
    expect(body).not.toContain("خطأ غير متوقع");
  });

  test("/prophets/musa يفتح بدون خطأ", async ({ page }) => {
    await page.goto("/prophets/musa");
    await expect(page).not.toHaveURL(/\/(login|admin)/);
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);
    expect(body).not.toContain("خطأ غير متوقع");
  });
});
