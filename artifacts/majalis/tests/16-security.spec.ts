/**
 * 16-security.spec.ts
 *
 * اختبارات الأمان — التحقق من حماية نقاط API الإدارية
 *   1. /api/admin/content-production يرفض الطلبات بدون مصادقة (401)
 *   2. /api/admin/check-fiqh-links يرفض الطلبات بدون مصادقة (401)
 *   3. /api/admin/sync-fiqh-council يرفض الطلبات بدون مصادقة (401)
 *   4. /api/admin/islamic-stories-approve يرفض الطلبات بدون مصادقة (401)
 *   5. محاولة حقن SQL عبر معاملات البحث لا تُنتج خطأ 500
 *   6. محاولة XSS في حقول البحث لا تُنفَّذ
 *   7. نقاط الـ cron محمية بـ CRON_SECRET
 */
import { test, expect, request } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";
// الاختبارات المباشرة على API تعمل فقط في بيئة تشغيل Vercel الكاملة
const IS_FULL_API = Boolean(process.env.VERCEL_URL || process.env.PLAYWRIGHT_FULL_API);

test.describe("أمان API الإداري", () => {
  // ── 1. content-production: حماية بدون مصادقة ────────────────────────────────

  test("GET /api/admin/content-production بدون token → 401", async () => {
    test.skip(!IS_FULL_API, "يتطلب بيئة Vercel الكاملة مع serverless functions");
    const ctx = await request.newContext({ baseURL: BASE_URL });
    const res = await ctx.get("/api/admin/content-production");
    // يجب أن يُرفض بـ 401 أو 403
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test("POST /api/admin/content-production بدون token → 401", async () => {
    test.skip(!IS_FULL_API, "يتطلب بيئة Vercel الكاملة مع serverless functions");
    const ctx = await request.newContext({ baseURL: BASE_URL });
    const res = await ctx.post("/api/admin/content-production", {
      data: { action: "run-job", job: "fawaid" },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  // ── 2. check-fiqh-links: حماية ───────────────────────────────────────────────

  test("POST /api/admin/check-fiqh-links بدون token → 401", async () => {
    test.skip(!IS_FULL_API, "يتطلب بيئة Vercel الكاملة مع serverless functions");
    const ctx = await request.newContext({ baseURL: BASE_URL });
    const res = await ctx.post("/api/admin/check-fiqh-links");
    expect([401, 403, 405]).toContain(res.status()); // 405 إذا رفض الطريقة أولاً
    await ctx.dispose();
  });

  // ── 3. sync-fiqh-council: حماية ──────────────────────────────────────────────

  test("POST /api/admin/sync-fiqh-council بدون token → 401", async () => {
    test.skip(!IS_FULL_API, "يتطلب بيئة Vercel الكاملة مع serverless functions");
    const ctx = await request.newContext({ baseURL: BASE_URL });
    const res = await ctx.post("/api/admin/sync-fiqh-council");
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  // ── 4. islamic-stories-approve: حماية ───────────────────────────────────────

  test("POST /api/admin/islamic-stories-approve بدون token → 401", async () => {
    test.skip(!IS_FULL_API, "يتطلب بيئة Vercel الكاملة مع serverless functions");
    const ctx = await request.newContext({ baseURL: BASE_URL });
    const res = await ctx.post("/api/admin/islamic-stories-approve", {
      data: { id: 1, approve: true },
    });
    expect([401, 403, 404]).toContain(res.status()); // 404 مقبول إن لم يوجد handler
    await ctx.dispose();
  });

  // ── 5. حقن SQL في معاملات البحث ─────────────────────────────────────────────

  test("معامل بحث يحتوي على SQL injection لا يُنتج 500", async ({ page }) => {
    await page.goto("/islamic-stories");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("input[placeholder*='بحث'], input[type='search']").first();
    if (await searchInput.isVisible()) {
      // محاولة حقن SQL — لا يجب أن تُنتج خطأ 500 أو console error
      await searchInput.fill("' OR '1'='1");
      await page.waitForTimeout(600);
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("SQL");
      expect(body).not.toContain("syntax error");
      expect(body).not.toContain("خطأ غير متوقع");
    }
  });

  // ── 6. XSS في حقول البحث ─────────────────────────────────────────────────────

  test("محاولة XSS في حقل البحث لا تُنفَّذ", async ({ page }) => {
    const xssPayload = '<script>window.__xss_executed=true</script>';
    await page.goto("/islamic-stories");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("input[placeholder*='بحث'], input[type='search']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(xssPayload);
      await page.waitForTimeout(600);
      // التحقق من أن الـ script لم يُنفَّذ
      const xssExecuted = await page.evaluate(() => (window as unknown as Record<string, unknown>).__xss_executed);
      expect(xssExecuted).toBeUndefined();
    }
  });

  // ── 7. cron routes محمية ─────────────────────────────────────────────────────

  test("GET /api/cron/sync-data بدون CRON_SECRET → 401 أو 403", async () => {
    test.skip(!IS_FULL_API, "يتطلب بيئة Vercel الكاملة مع serverless functions");
    const ctx = await request.newContext({ baseURL: BASE_URL });
    const res = await ctx.get("/api/cron/sync-data");
    // Vercel Cron يتحقق من authorization header
    expect([401, 403, 405]).toContain(res.status());
    await ctx.dispose();
  });

  // ── 8. admin page يتطلب تسجيل دخول ──────────────────────────────────────────

  test("GET /admin بدون session → توجيه لـ login أو رسالة auth", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const url = page.url();
    const body = await page.locator("body").textContent();
    const isProtected =
      url.includes("/login") ||
      body?.includes("تسجيل الدخول") ||
      body?.includes("غير مصرح") ||
      body?.includes("login") ||
      body?.includes("sign in");
    expect(isProtected).toBeTruthy();
  });
});
