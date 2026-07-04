# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 00-public-routes.spec.ts >> Public Routes — المسارات العامة >> [عام] / — الرئيسية
- Location: tests/00-public-routes.spec.ts:71:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * 00-public-routes.spec.ts
  3   |  *
  4   |  * يتحقق من أن جميع المسارات في PUBLIC_NAV_ITEMS:
  5   |  *   1. تفتح بدون تسجيل دخول (لا إعادة توجيه إلى /login أو /admin)
  6   |  *   2. تعرض محتوى حقيقياً (ليست صفحة فارغة أو "غير مصرح")
  7   |  *   3. لا تستخدم AdminLazyRoute (فحص ثابت في الكود)
  8   |  *
  9   |  * إذا فشل أي اختبار → صفحة عامة مخفية → يجب الإصلاح قبل الـ Commit.
  10  |  */
  11  | import { test, expect } from "@playwright/test";
  12  | 
  13  | // نسخة من PUBLIC_NAV_ITEMS بدون استيراد وقت التشغيل
  14  | // يجب أن تتطابق مع src/lib/navigation.ts > PUBLIC_NAV_ITEMS
  15  | const PUBLIC_ROUTES: Array<{ href: string; label: string }> = [
  16  |   { href: "/",               label: "الرئيسية" },
  17  |   { href: "/lessons",        label: "الدروس" },
  18  |   { href: "/annual-courses", label: "الدورات العلمية" },
  19  |   { href: "/library",        label: "المكتبة" },
  20  |   { href: "/hadith",         label: "الأحاديث" },
  21  |   { href: "/fawaid",         label: "الفوائد" },
  22  |   { href: "/stories",        label: "القصص الإسلامية" },
  23  |   { href: "/miracles",       label: "المعجزات" },
  24  |   { href: "/qa",             label: "الأسئلة" },
  25  |   { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
  26  |   { href: "/updates",        label: "المستجدات" },
  27  |   { href: "/fiqh",                 label: "الفقه الإسلامي" },
  28  |   { href: "/fiqh-council",        label: "المجمع الفقهي" },
  29  |   { href: "/fatwa",               label: "الفتاوى" },
  30  |   { href: "/rulings",             label: "الأحكام الشرعية" },
  31  |   { href: "/seerah",              label: "السيرة النبوية" },
  32  |   { href: "/scholarly-research",  label: "الباحث الشرعي" },
  33  |   { href: "/universities",        label: "دليل الجامعات" },
  34  |   { href: "/learning-path",       label: "خارطة طالب العلم" },
  35  |   { href: "/quran",          label: "القرآن" },
  36  |   { href: "/quran-radio",    label: "إذاعة القرآن" },
  37  |   { href: "/adhkar",         label: "الأذكار" },
  38  |   { href: "/tasbih",         label: "التسبيح" },
  39  |   { href: "/prayer-times",   label: "مواقيت الصلاة" },
  40  |   { href: "/muezzins",       label: "مكتبة المؤذنين" },
  41  |   { href: "/qibla",          label: "القبلة" },
  42  |   { href: "/occasions",      label: "المناسبات" },
  43  |   { href: "/calendar",       label: "التقويم" },
  44  |   { href: "/quiz",           label: "المسابقات" },
  45  |   { href: "/prophets",       label: "قصص الأنبياء" },
  46  |   { href: "/search",         label: "البحث" },
  47  |   { href: "/settings",       label: "الإعدادات" },
  48  |   { href: "/about",          label: "عن المنصة" },
  49  | ];
  50  | 
  51  | // مسارات الاختصار التي يجب أن تُعيد التوجيه بدلاً من الفشل
  52  | const REDIRECT_ROUTES: Array<{ href: string; redirectsTo: string }> = [
  53  |   { href: "/mushaf",   redirectsTo: "/quran" },
  54  |   { href: "/research", redirectsTo: "/fiqh-council/research" },
  55  | ];
  56  | 
  57  | // نصوص تدل على حظر الوصول
  58  | const ACCESS_DENIED_TEXTS = [
  59  |   "غير مصرح",
  60  |   "تسجيل الدخول",
  61  |   "يرجى تسجيل الدخول",
  62  |   "Unauthorized",
  63  |   "Access denied",
  64  | ];
  65  | 
  66  | test.describe("Public Routes — المسارات العامة", () => {
  67  |   test.describe.configure({ mode: "serial" });
  68  | 
  69  |   // ── 1. فحص كل صفحة عامة بدون تسجيل دخول ─────────────────────────────
  70  |   for (const route of PUBLIC_ROUTES) {
  71  |     test(`[عام] ${route.href} — ${route.label}`, async ({ page }) => {
> 72  |       await page.goto(route.href, { waitUntil: "load" });
      |                  ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  73  |       await page.waitForTimeout(800);
  74  | 
  75  |       // يجب ألا تُحوَّل إلى /login
  76  |       const finalUrl = page.url();
  77  |       expect(
  78  |         finalUrl,
  79  |         `${route.href} أعاد التوجيه إلى صفحة تسجيل الدخول`,
  80  |       ).not.toContain("/login");
  81  | 
  82  |       // يجب ألا يظهر نص "غير مصرح" أو ما شابهه
  83  |       const body = await page.locator("body").innerText();
  84  |       for (const denied of ACCESS_DENIED_TEXTS) {
  85  |         // نستثني الرابط العادي للدخول في navbar (يظهر للجميع)
  86  |         const occurrences = (body.match(new RegExp(denied, "g")) ?? []).length;
  87  |         const isOnlyNavLink = denied === "تسجيل الدخول" && occurrences <= 2;
  88  |         if (!isOnlyNavLink) {
  89  |           expect(
  90  |             body,
  91  |             `${route.href} يُظهر "${denied}" — قد يكون محجوباً`,
  92  |           ).not.toContain(denied);
  93  |         }
  94  |       }
  95  | 
  96  |       // يجب أن يحتوي على محتوى حقيقي
  97  |       expect(
  98  |         body.length,
  99  |         `${route.href} يبدو فارغاً — تحقق من مشكلة في التحميل`,
  100 |       ).toBeGreaterThan(30);
  101 |     });
  102 |   }
  103 | 
  104 |   // ── 2. فحص مسارات الاختصار (redirects) ──────────────────────────────
  105 |   for (const route of REDIRECT_ROUTES) {
  106 |     test(`[اختصار] ${route.href} → ${route.redirectsTo}`, async ({ page }) => {
  107 |       await page.goto(route.href, { waitUntil: "load" });
  108 |       await page.waitForTimeout(500);
  109 | 
  110 |       const finalUrl = page.url();
  111 |       expect(
  112 |         finalUrl,
  113 |         `${route.href} يجب أن يُعيد التوجيه إلى ${route.redirectsTo}`,
  114 |       ).toContain(route.redirectsTo);
  115 | 
  116 |       // يجب ألا تُحوَّل إلى /login
  117 |       expect(finalUrl).not.toContain("/login");
  118 |     });
  119 |   }
  120 | 
  121 |   // ── 3. فحص ثابت: أي مسار عام لا يستخدم AdminLazyRoute ──────────────
  122 |   test("فحص ثابت: المسارات العامة لا تستخدم AdminLazyRoute في App.tsx", async () => {
  123 |     const { readFileSync } = await import("fs");
  124 |     const { resolve, dirname } = await import("path");
  125 | 
  126 |     const testDir = dirname(new URL(import.meta.url).pathname);
  127 |     const appPath = resolve(testDir, "../src/App.tsx");
  128 |     const appContent = readFileSync(appPath, "utf-8");
  129 | 
  130 |     // استخرج جميع مسارات AdminLazyRoute
  131 |     const adminRoutePattern = /<Route path="([^"]+)">\s*<AdminLazyRoute/g;
  132 |     const adminPaths: string[] = [];
  133 |     let match: RegExpExecArray | null;
  134 |     while ((match = adminRoutePattern.exec(appContent)) !== null) {
  135 |       adminPaths.push(match[1]);
  136 |     }
  137 | 
  138 |     // تحقق أن لا أياً من PUBLIC_ROUTES في قائمة AdminLazyRoute
  139 |     for (const route of PUBLIC_ROUTES) {
  140 |       const isAdminLocked = adminPaths.some(
  141 |         (adminPath) =>
  142 |           adminPath === route.href ||
  143 |           route.href.startsWith(adminPath.replace("*", "")),
  144 |       );
  145 |       expect(
  146 |         isAdminLocked,
  147 |         `المسار العام "${route.href}" مقيّد بـ AdminLazyRoute — يجب نقله إلى SafeLazyRoute`,
  148 |       ).toBe(false);
  149 |     }
  150 |   });
  151 | 
  152 |   // ── 4. تحقق من وجود PUBLIC_NAV_ITEMS في navigation.ts ────────────────
  153 |   test("فحص ثابت: PUBLIC_NAV_ITEMS مُعرَّفة في navigation.ts", async () => {
  154 |     const { readFileSync } = await import("fs");
  155 |     const { resolve, dirname } = await import("path");
  156 | 
  157 |     const testDir = dirname(new URL(import.meta.url).pathname);
  158 |     const navPath = resolve(testDir, "../src/lib/navigation.ts");
  159 |     const navContent = readFileSync(navPath, "utf-8");
  160 | 
  161 |     expect(
  162 |       navContent,
  163 |       "PUBLIC_NAV_ITEMS غير موجودة في src/lib/navigation.ts",
  164 |     ).toContain("export const PUBLIC_NAV_ITEMS");
  165 | 
  166 |     expect(
  167 |       navContent,
  168 |       "PRIMARY_NAV_ITEMS غير موجودة في src/lib/navigation.ts",
  169 |     ).toContain("export const PRIMARY_NAV_ITEMS");
  170 |   });
  171 | });
  172 | 
```