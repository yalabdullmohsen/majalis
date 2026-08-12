# Design Redesign Report

## Scope

إعادة تصميم بصرية جذرية لواجهة `artifacts/majalis` (React) مع الحفاظ على الوظائف والمسارات الحالية. لم يُعدَّل `artifacts/mushafi` — لا Drawer/Header مشترك بنفس مشاكل الواجهة، ولا حاجة لتغيير Flutter في هذه الجولة.

قيود محترمة: لا نص قرآن مولَّد، لا تغيير أحكام/تخريج، لا deploy، لا دمج PR، لا كسر routes، لا حذف وظائف.

## Design Identity

هوية هادئة إسلامية حديثة عبر `brand-v4.css`:

- أخضر رئيسي `#12362A` / أعمق `#0B2B1D`
- سطح ناعم `#E8F0EC` / خلفية كريمية `#FBF8F1`
- نص `#1D1D1B` / ثانوي `#66736D`
- تحذير `#FFF0F0` / `#A94444`
- ظلال بطاقات خفيفة و`border` شفاف زمردي
- خط الواجهة: IBM Plex Sans Arabic أولاً مع Noto fallback

ملف الطبقة الرفيعة: `src/styles/components/design-redesign.css` (هيدر متعدد الصفوف، تيكّر، هيرو، شاشة دخول).

## Sidebar Redesign

أُبقي على إعادة تصميم القائمة الجانبية السابقة (`SideNavDrawer` + `sidebar-nav.ts` + `sidebar-redesign.css`):

- تفتح من اليمين، عرض `min(86vw, 360px)`
- مجموعات: وصول سريع · علم ومحتوى · خدمات · حساب
- بلا «من نحن» / مكتبة / فتاوى / مستجدات كعناصر قائمة

## Header Redesign

`NavBar.tsx` على الجوال أصبح ثلاث طبقات مستقلة:

1. صف علوي: قائمة · شعار · حساب/بحث/سمة
2. صف بحث بعرض كامل («ابحث في المحتوى…»)
3. تبويبات أفقية قابلة للتمرير (القرآن، علومه، الحديث، الفقه، الحفظ، الصلاة، حسابي)
4. صف التيكر («مقتطفات») منفصل أسفلها

لا `position: absolute` للعناصر الأساسية، ولا تداخل بحث فوق تبويبات.

## Home Page Redesign

هيرو الرئيسية:

- عنوان العلامة: «المجلس العلمي»
- وصف قصير عن المنصة المنظمة
- CTA: «ابدأ التصفح» + «ابحث في المحتوى»
- بطاقات الأقسام عبر `FEATURED` في `home-feature-catalog.ts` (أيقونات Lucide بلا emoji)

## Legacy UI Updates

- بطاقات الاستكشاف: `surface-polish.css`
- تيكّر المقتطفات: شارة عنوان + تنبيه حديث داخل البطاقة + لفّ نص في الوضع الثابت
- بحث عام/صفحة بحث: نصوص فارغ/خطأ موحّدة
- دخول: خلفية تدرج زمردي كاملة مع شعار غير مقصوص
- تنبيه الأذان: أيقونات Lucide بدل emoji

## Removed Old UI Patterns

- عنوان هيرو قديم («ريادة المعرفة…») استُبدل بهوية أوضح
- إيموجي خام في شريط الأذان وإشعار ورد القرآن
- رمز ✦ فوق حدث اليوم في الهيرو

ملاحظة: صفحات محتوى كثيرة ما زالت تمرّر مفاتيح emoji إلى `SectionIcon` الذي يحوّلها إلى Lucide — ليست إيموجي ظاهرة في الواجهة.

## RTL and Mobile Fixes

- `overflow-x: hidden` على html/body/#root
- `box-sizing: border-box` عام
- صفوف الهيدر منفصلة لتفادي التداخل على الجوال
- التيكر الثابت يلف النص ولا يخرج من الشاشة

## Accessibility Fixes

- `aria-label`: فتح/إغلاق القائمة، فتح البحث، حسابي، إغلاق
- `aria-current="page"` على التبويبات النشطة
- `focus-visible` على زر البحث الكامل العرض
- `role`/`aria-label` للتنقل والتيكر

## Files Changed

- `src/styles/brand-v4.css`
- `src/styles/components/design-redesign.css` (جديد)
- `src/index.css` (خطوط)
- `src/components/NavBar.tsx`
- `src/components/HeaderTicker.tsx`
- `src/views/HomePage.tsx`
- `src/components/home/HomeExplorePlatform.tsx`
- `src/components/GlobalSearchModal.tsx`
- `src/views/SearchPage.tsx`
- `src/components/adhan/AdhanNotificationBar.tsx`
- `src/lib/quran-daily-reminder.ts`
- `DESIGN_REDESIGN_REPORT.md` (هذا الملف)

## Commands Run

```bash
pnpm --filter @workspace/majalis run lint
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
```

## Results

- lint: نجح (`eslint … --max-warnings 0`)
- build: نجح بالكامل بما فيها content-guard وCSS الحرج وprerender
- CSS الحرج: **504218** بايت (≤ 505000)
- `artifacts/mushafi`: لم يُعدَّل
- لا deploy ولا دمج PR في هذه الجولة

## Manual QA Checklist

- [ ] القائمة الجانبية من اليمين وبدون أقسام محذوفة
- [ ] الصفحة الرئيسية: عنوان + وصف + زرّان
- [ ] الهيدر: بحث مستقل + تبويبات قابلة للتمرير
- [ ] التيكر/مقتطفات لا تخرج من الشاشة
- [ ] البحث: placeholder ونصوص فارغ/خطأ
- [ ] Bottom nav: الرئيسية · القرآن · الصلاة · حسابي · المزيد
- [ ] لا إيموجي ظاهرة في الشريط/الأذان/الهيرو
- [ ] RTL بلا horizontal overflow على الجوال
- [ ] شاشة الدخول: شعار كامل على خلفية زمردية