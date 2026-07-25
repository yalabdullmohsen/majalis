/**
 * 00-public-routes.spec.ts
 *
 * يتحقق من أن جميع المسارات في PUBLIC_NAV_ITEMS:
 *   1. تفتح بدون تسجيل دخول (لا إعادة توجيه إلى /login أو /admin)
 *   2. تعرض محتوى حقيقياً (ليست صفحة فارغة أو "غير مصرح")
 *   3. لا تستخدم AdminLazyRoute (فحص ثابت في الكود)
 *
 * إذا فشل أي اختبار → صفحة عامة مخفية → يجب الإصلاح قبل الـ Commit.
 */
import { test, expect } from "@playwright/test";

// نسخة من PUBLIC_NAV_ITEMS بدون استيراد وقت التشغيل
// يجب أن تتطابق مع src/lib/navigation.ts > PUBLIC_NAV_ITEMS
const PUBLIC_ROUTES: Array<{ href: string; label: string }> = [
  { href: "/",               label: "الرئيسية" },
  { href: "/lessons",        label: "الدروس" },
  { href: "/annual-courses", label: "الدورات العلمية" },
  { href: "/library",        label: "المكتبة" },
  { href: "/hadith",         label: "الأحاديث" },
  { href: "/fawaid",         label: "الفوائد" },
  { href: "/stories",        label: "القصص الإسلامية" },
  { href: "/miracles",       label: "المعجزات" },
  { href: "/qa",             label: "الأسئلة" },
  { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
  { href: "/updates",        label: "المستجدات" },
  { href: "/fiqh",                 label: "الفقه الإسلامي" },
  { href: "/fiqh-council",        label: "المجمع الفقهي" },
  { href: "/rulings",             label: "الأحكام الشرعية" },
  { href: "/seerah",              label: "السيرة النبوية" },
  { href: "/scholarly-research",  label: "الباحث الشرعي" },
  { href: "/universities",        label: "دليل الجامعات" },
  { href: "/learning-path",       label: "خارطة طالب العلم" },
  { href: "/quran-hub",      label: "القرآن" },
  { href: "/mushaf",         label: "المصحف" },
  { href: "/quran/memorization-plans", label: "خطط حفظ القرآن" },
  { href: "/adhkar",         label: "الأذكار" },
  { href: "/tasbih",         label: "التسبيح" },
  { href: "/prayer-times",   label: "مواقيت الصلاة" },
  { href: "/qibla",          label: "القبلة" },
  { href: "/occasions",      label: "المناسبات" },
  { href: "/calendar",       label: "التقويم" },
  { href: "/quiz",           label: "المسابقات" },
  { href: "/prophets",       label: "قصص الأنبياء" },
  { href: "/search",         label: "البحث" },
  { href: "/settings",       label: "الإعدادات" },
  { href: "/about",          label: "عن المنصة" },
];

// مسارات الاختصار التي يجب أن تُعيد التوجيه بدلاً من الفشل
const REDIRECT_ROUTES: Array<{ href: string; redirectsTo: string }> = [
  { href: "/quran",    redirectsTo: "/quran-hub" }, // قارئ المصحف صفحة-بصفحة حُذف (2026-07-14)
  { href: "/research", redirectsTo: "/fiqh-council/research" },
];

// نصوص تدل على حظر الوصول
const ACCESS_DENIED_TEXTS = [
  "غير مصرح",
  "تسجيل الدخول",
  "يرجى تسجيل الدخول",
  "Unauthorized",
  "Access denied",
];

test.describe("Public Routes — المسارات العامة", () => {
  test.describe.configure({ mode: "serial" });

  // ── 1. فحص كل صفحة عامة بدون تسجيل دخول ─────────────────────────────
  for (const route of PUBLIC_ROUTES) {
    test(`[عام] ${route.href} — ${route.label}`, async ({ page }) => {
      await page.goto(route.href, { waitUntil: "load" });
      await page.waitForTimeout(800);

      // يجب ألا تُحوَّل إلى /login
      const finalUrl = page.url();
      expect(
        finalUrl,
        `${route.href} أعاد التوجيه إلى صفحة تسجيل الدخول`,
      ).not.toContain("/login");

      // يجب ألا يظهر نص "غير مصرح" أو ما شابهه
      const body = await page.locator("body").innerText();
      for (const denied of ACCESS_DENIED_TEXTS) {
        // نستثني الرابط العادي للدخول في navbar (يظهر للجميع)
        const occurrences = (body.match(new RegExp(denied, "g")) ?? []).length;
        const isOnlyNavLink = denied === "تسجيل الدخول" && occurrences <= 2;
        if (!isOnlyNavLink) {
          expect(
            body,
            `${route.href} يُظهر "${denied}" — قد يكون محجوباً`,
          ).not.toContain(denied);
        }
      }

      // يجب أن يحتوي على محتوى حقيقي
      expect(
        body.length,
        `${route.href} يبدو فارغاً — تحقق من مشكلة في التحميل`,
      ).toBeGreaterThan(30);
    });
  }

  // ── 2. فحص مسارات الاختصار (redirects) ──────────────────────────────
  for (const route of REDIRECT_ROUTES) {
    test(`[اختصار] ${route.href} → ${route.redirectsTo}`, async ({ page }) => {
      await page.goto(route.href, { waitUntil: "load" });
      await page.waitForTimeout(500);

      const finalUrl = page.url();
      expect(
        finalUrl,
        `${route.href} يجب أن يُعيد التوجيه إلى ${route.redirectsTo}`,
      ).toContain(route.redirectsTo);

      // يجب ألا تُحوَّل إلى /login
      expect(finalUrl).not.toContain("/login");
    });
  }

  // ── 3. فحص ثابت: أي مسار عام لا يستخدم AdminLazyRoute ──────────────
  test("فحص ثابت: المسارات العامة لا تستخدم AdminLazyRoute في App.tsx", async () => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");

    const testDir = dirname(new URL(import.meta.url).pathname);
    const appPath = resolve(testDir, "../src/App.tsx");
    const appContent = readFileSync(appPath, "utf-8");

    // استخرج جميع مسارات AdminLazyRoute
    const adminRoutePattern = /<Route path="([^"]+)">\s*<AdminLazyRoute/g;
    const adminPaths: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = adminRoutePattern.exec(appContent)) !== null) {
      adminPaths.push(match[1]);
    }

    // تحقق أن لا أياً من PUBLIC_ROUTES في قائمة AdminLazyRoute
    for (const route of PUBLIC_ROUTES) {
      const isAdminLocked = adminPaths.some(
        (adminPath) =>
          adminPath === route.href ||
          route.href.startsWith(adminPath.replace("*", "")),
      );
      expect(
        isAdminLocked,
        `المسار العام "${route.href}" مقيّد بـ AdminLazyRoute — يجب نقله إلى SafeLazyRoute`,
      ).toBe(false);
    }
  });

  // ── 4. تحقق من وجود PUBLIC_NAV_ITEMS في navigation.ts ────────────────
  test("فحص ثابت: PUBLIC_NAV_ITEMS مُعرَّفة في navigation.ts", async () => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");

    const testDir = dirname(new URL(import.meta.url).pathname);
    const navPath = resolve(testDir, "../src/lib/navigation.ts");
    const navContent = readFileSync(navPath, "utf-8");

    expect(
      navContent,
      "PUBLIC_NAV_ITEMS غير موجودة في src/lib/navigation.ts",
    ).toContain("export const PUBLIC_NAV_ITEMS");

    expect(
      navContent,
      "PRIMARY_NAV_ITEMS غير موجودة في src/lib/navigation.ts",
    ).toContain("export const PRIMARY_NAV_ITEMS");
  });
});
