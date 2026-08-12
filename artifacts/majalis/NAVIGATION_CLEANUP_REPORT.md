# Navigation Cleanup Report

## Removed From Navigation

- المكتبة
- المكتبة العلمية
- آخر المستجدات
- الفتاوى (كمدخل مستقل / فلتر واجهة)
- استكشف المعرفة
- البحث العلمي / الأبحاث الشرعية (قائمة الاكتشاف)

## Removed From Sidebar Only

- من نحن (بقيت في `/about` وfooter)

## Merged Sections

### حسابي
- البطاقات المراجعة (`/my-learning#flashcards`)

### المناسبات والدروس (`/occasions-lessons`)
- المناسبات الإسلامية
- تقويم الدروس

### القرآن وعلومه (`/quran-knowledge`)
- علوم القرآن
- فهرس القرآن
- أسباب النزول
- قصص القرآن

### الحفظ والمراجعة (`/memorization`)
- اختبارات الحفظ القرآني
- خطط الحفظ والمراجعة

### الدليل الإسلامي (`/islamic-directory`)
- دليل المؤسسات الإسلامية
- المشاهد والمساجد

## Final Navigation

### Bottom bar
الرئيسية · القرآن · الصلاة · حسابي · المزيد

### More sheet
القرآن وعلومه · الحديث والسنة · الفقه والأحكام · الحفظ والمراجعة · المناسبات والدروس · الدليل الإسلامي · الإعدادات

### Side drawer
نفس الأقسام الأساسية + البحث + الإعدادات + حسابي (بلا من نحن)

### Top section bar
القرآن · القرآن وعلومه · الحديث والسنة · الفقه والأحكام · الحفظ والمراجعة · المناسبات والدروس · الدليل الإسلامي · الصلاة · حسابي

## Routes Updated

| Source | Destination |
|---|---|
| `/library` | `/` |
| `/updates` | `/` |
| `/knowledge-graph` | `/` |
| `/academic-research` | `/` |
| `/news` `/latest` `/explore` `/research` `/scientific-library` | `/` |
| `/fatwas` | `/fiqh` |
| `/quran-index` `/asbab-al-nuzul` `/quran-stories` `/quran-sciences` `/quran-studies` | `/quran-knowledge` |
| `/memorization-tests` `/memorization-plans` `/review-plans` | `/memorization` |
| `/islamic-institutions` `/mosques` `/masajid` | `/islamic-directory` |
| `/events` `/islamic-events` `/lesson-calendar` | `/occasions-lessons` |
| `/reviewed-cards` | `/my-learning` |

صفحات المحتوى الفرعية (`/ulum-quran`, `/calendar`, `/library/:id`…) تبقى للروابط العميقة من البوابات.

## Search Filters Updated

- عنوان الصفحة: البحث الشامل (بدل البحث العلمي)
- شارات/مجموعات: كتب ومراجع، إعلانات، الفقه والأحكام (بدل المكتبة/آخر المستجدات/الفتاوى كأقسام)
- GlobalSearch: فلتر «فتاوى» ← «أحكام»
- اختصارات سريعة محدّثة للأقسام المدمجة

## Files Changed (مرحلة التكملة)

- `BottomNavBar.tsx`, `MoreBottomSheet.tsx`
- `SearchPage.tsx`, `GlobalSearchModal.tsx`, `SiteMapPage.tsx`
- `HomeMindMapSection.tsx`, `UserStatsPage.tsx`, `AboutPage.tsx`
- `CalendarPage.tsx`, `OccasionsPage.tsx`, `QuranMemorizationPlansPage.tsx`, `SurahStoriesPage.tsx`, `UlumQuranPage.tsx`
- `nav-visibility.ts`, `navigation.ts`, `feature-registry.ts`, `explore-links.ts`, `ticker-content.ts`, `recent-pages.ts`, `mind-maps-data.ts`, `masarat-data.ts`
- `App.tsx`, `vercel.json`
- اختبارات التنقل

## Commands Run

- `pnpm --filter @workspace/majalis exec tsx src/lib/__tests__/section-nav-and-daily-consolidation.test.ts`
- `pnpm --filter @workspace/majalis exec tsx src/lib/__tests__/header-ticker.test.ts`
- `pnpm --filter @workspace/majalis run lint`
- `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build`

## Results

- اختبارات التنقل: 72 نجاح
- اختبار الشريط المتحرك: 28 نجاح
- lint: نجح (`--max-warnings 0`)
- build: نجح

## Remaining Manual Review

- روابط داخل صفحات تفسير قديمة ما زالت تفتح `/library/:id` (تفاصيل كتب حية)
- لوحة الأدمن تحتفظ بإدارة «المكتبة» داخلياً (ليست navigation عام)
- ملفّا `HomeFeaturedLibrary` / `HomeLatestUpdates` مفصولان عن التخصيص لكن الملفات موجودة
- مراجعة بصرية: الرئيسية، الجانبية، المزيد، البحث، الشريط السفلي
