# UI Fix Report

## المشاكل التي تم إصلاحها

- شاشة الشعار (دخول/تسجيل): تكبير الشعار بـ `object-fit: contain`، خلفية متدرجة زمردية، وعبارة «علم نافع، ومحتوى موثوق».
- تداخل الشريط العلوي: إخراج التيكر من شبكة الأزرار إلى صف مستقل، ووضع شعار مضغوط في الوسط على الجوال.
- ترتيب عناصر المزيد: إضافة تبويب «البحث» في الشريط السفلي (الرئيسية · القرآن · الصلاة · البحث · المزيد).
- إزالة الإيموجيات القديمة في واجهات بارزة (إحصاءات الرئيسية للمسؤول، بطل صفحة الطهارة).
- تحسين RTL للدرج: عرض ≤85vw من اليمين، شعار الدرج بـ contain.
- قائمة المزيد: على الشاشات الضيقة تتحول إلى قائمة صفوف بدل شبكة مقصوصة.
- منع overflow: شارات درجة الحديث تلف النص بدل `nowrap`، وألوان هادئة للضعيف/الموضوع.
- Splash Capacitor: خلفية `#143F35` و`CENTER_INSIDE` بدل القص.

## الملفات المعدلة

- `artifacts/majalis/src/components/NavBar.tsx`
- `artifacts/majalis/src/components/BottomNavBar.tsx`
- `artifacts/majalis/src/components/SideNavDrawer.tsx`
- `artifacts/majalis/src/views/LoginPage.tsx`
- `artifacts/majalis/src/views/RegisterPage.tsx`
- `artifacts/majalis/src/views/HomePage.tsx`
- `artifacts/majalis/src/views/TaharaPage.tsx`
- `artifacts/majalis/src/styles/final-release.css`
- `artifacts/majalis/src/styles/pages/auth.css`
- `artifacts/majalis/src/styles/pages/hadith.css`
- `artifacts/majalis/src/styles/design-system.css`
- `artifacts/majalis/src/index.css`
- `artifacts/majalis/capacitor.config.ts`
- `UI_FIX_REPORT.md`

## ما بقي

- بعض صفحات المحتوى ما زالت تمرّر إيموجي كـمفتاح لـ `SectionIcon` (يُحوَّل لأيقونة Lucide عند العرض) — لا يظهر كإيموجي نصي في أغلب البطاقات.
- أصول splash الأصلية على iOS/Android قد تحتاج تحديث بصري يدوي في Xcode/Android Studio لاحقًا؛ الإعدادات هنا تضبط اللون والـ scale فقط.
- `artifacts/mushafi` لم يُمسّ: لقطات الشاشة تطابق واجهة majalis (المجلس العلمي) لا مصحفي.

## أوامر الفحص

```bash
cd artifacts/majalis
pnpm exec eslint src/components/NavBar.tsx src/components/BottomNavBar.tsx src/components/SideNavDrawer.tsx src/views/LoginPage.tsx src/views/HomePage.tsx src/views/TaharaPage.tsx --max-warnings=0
pnpm exec node --import tsx src/lib/__tests__/header-ticker.test.ts
pnpm exec node --import tsx src/lib/__tests__/immersive-chrome.test.ts
pnpm exec node --import tsx src/lib/__tests__/section-nav-and-daily-consolidation.test.ts
PORT=24216 BASE_PATH=/ pnpm run build
```

## النتيجة

- ESLint للمكوّنات المعدّلة: نجح.
- اختبارات header-ticker / immersive-chrome / section-nav: نجحت.
- `PORT=24216 BASE_PATH=/ pnpm run build`: نجح (ميزانية CSS الحرج ≤ 505000).
- الإصلاح في `artifacts/majalis` فقط (واجهة المجلس العلمي / Capacitor).
- لم يُمس `artifacts/mushafi` لأن لقطات الشاشة تطابق الموقع لا تطبيق مصحفي.
