# Sidebar Redesign Report

## Scope

إعادة تصميم القائمة الجانبية في `artifacts/majalis` فقط. لا Drawer جانبي مطابق في `artifacts/mushafi`.

## Old Sidebar Issues

- CSS قديم متعدد الطبقات (`.side-nav-drawer--v2`) مع مجموعات قابلة للطي.
- رأس بلا هوية مطلوبة ووصف «منصة علمية منظمة».
- مصدر عناصر منفصل عن قائمة المزيد.
- احتمال تداخل/overflow على الجوال.

## New Sidebar Structure

1. الوصول السريع: الرئيسية · القرآن · الصلاة
2. العلم والمحتوى: القرآن وعلومه · الحديث والسنة · الفقه والأحكام · الحفظ والمراجعة
3. خدمات: المناسبات والدروس · الدليل الإسلامي
4. الحساب: حسابي · الإعدادات (+ دخول/خروج/أدمن حسب الجلسة)

## Final Sidebar Items

الرئيسية · القرآن · القرآن وعلومه · الحديث والسنة · الفقه والأحكام · الحفظ والمراجعة · المناسبات والدروس · الدليل الإسلامي · الصلاة · حسابي · الإعدادات

## Removed Items

من نحن · المكتبة · المكتبة العلمية · آخر المستجدات · الفتاوى · استكشف المعرفة · البحث العلمي

## Updated Components

- `src/lib/sidebar-nav.ts` (مصدر موحّد)
- `src/components/SideNavDrawer.tsx`
- `src/styles/components/sidebar-redesign.css`
- `src/components/MoreBottomSheet.tsx`
- `src/components/NavBar.tsx` (aria-label فتح/إغلاق القائمة)
- `src/components/BottomNavBar.tsx` (مسبقًا مختصر؛ المزيد يفتح الورقة الموحّدة)
- `src/styles/components/more-bottom-sheet.css`
- `src/styles/components/surface-polish.css` + ربطه بالرئيسية والبحث

## Legacy Designs Updated

- بطاقات استكشاف الرئيسية وبطاقات البحث السريعة بهوية `#12362a` / `#fbfbf8`.
- ورقة المزيد بنفس نصف القطر والحدود الهادئة.

## RTL and Mobile Fixes

- اللوحة `right: 0`، `direction: rtl`، `width: min(86vw, 360px)`، Safe Area، `overflow-x: hidden`.
- الإبقاء على طبقة `mobile-nav-body-lock` عبر `mobile-nav-layer`.

## Accessibility Fixes

- زر الهيدر: `aria-label` «فتح القائمة» / «إغلاق القائمة».
- زر الإغلاق والخلفية: «إغلاق القائمة».
- العناصر النشطة: `aria-current="page"`.
- dialog: `aria-modal` + `aria-label="القائمة الجانبية"`.

## Files Changed

انظر commit؛ أبرزها أعلاه + `SIDEBAR_REDESIGN_PLAN.md` + هذا التقرير + تحديث اختبارات التنقل.

## Commands Run

- `pnpm --filter @workspace/majalis exec tsx src/lib/__tests__/section-nav-and-daily-consolidation.test.ts`
- `pnpm --filter @workspace/majalis exec tsx src/lib/__tests__/header-ticker.test.ts`
- `pnpm --filter @workspace/majalis exec tsx src/lib/__tests__/prayer-time-12h.test.ts`
- `pnpm --filter @workspace/majalis run lint`
- `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build`

## Results

- اختبارات التنقل والشريط وprayer-time-12h: نجاح
- lint: نجح
- build: نجح (CSS الحرج 502953 ≤ 505000)

## Manual QA

- فتح/إغلاق القائمة من اليمين على الجوال.
- عدم ظهور من نحن/المكتبة/المستجدات/الفتاوى.
- عدم إيموجيات وقصّ نصوص.
- المزيد من الشريط السفلي يفتح الورقة الجديدة.
