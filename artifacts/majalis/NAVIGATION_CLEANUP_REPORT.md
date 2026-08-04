# Navigation Cleanup Report

## الأقسام المحذوفة من الواجهة

- المكتبة / المكتبة العلمية (`/library` → `/`؛ تفاصيل الكتب `/library/:id` تبقى)
- آخر المستجدات (`/updates` → `/`)
- استكشف المعرفة (`/knowledge-graph` → `/`)
- البحث العلمي / الأبحاث الشرعية (قائمة `/academic-research` → `/`)
- قسم الفتاوى كمدخل مستقل (`/fatwas` → `/fiqh`؛ `/fiqh-council/fatwas` مخفي من القوائم)

## الأقسام المدمجة

| بوابة جديدة | يضم |
|---|---|
| `/quran-knowledge` القرآن وعلومه | فهرس السور، علوم القرآن، أسباب النزول، قصص القرآن |
| `/memorization` الحفظ والمراجعة | اختبارات الحفظ، خطط الحفظ |
| `/occasions-lessons` المناسبات والدروس | المناسبات الإسلامية، تقويم الدروس |
| `/islamic-directory` الدليل الإسلامي | المؤسسات، المشاهد والمساجد |
| حسابي `/my-learning#flashcards` | البطاقات المراجعة |

## Routes / Redirects

انظر `vercel.json` و`App.tsx` و`MERGED_PATH_REDIRECTS` في `nav-visibility.ts`.

## من نحن

- أُزيل من SideNav و More فقط.
- بقي `/about` وfooter.

## ملفات رئيسية معدّلة

- `src/lib/nav-visibility.ts`
- `src/components/TopSectionBar.tsx`, `SideNavDrawer.tsx`, `MoreBottomSheet.tsx`
- `src/lib/home-feature-catalog.ts`, `homepage-layout.ts`, `navigation.ts`
- `src/views/*HubPage.tsx`, `MergedSectionHubPage.tsx`, `MyLearningPage.tsx`, `HomePage.tsx`, `SearchPage.tsx`, `SiteMapPage.tsx`
- `src/App.tsx`, `vercel.json`
- اختبارات `section-nav-and-daily-consolidation.test.ts`, `header-ticker.test.ts`

## متبقٍ للمراجعة اليدوية

- روابط داخل صفحات المحتوى القديمة التي ما زالت تشير إلى `/library` أو `/quran-hub` (صفحات حية أو redirect).
- ودجتا `HomeFeaturedLibrary` / `HomeLatestUpdates` لم تُحذف الملفات لكن فُصلا من التخصيص.
- لفظ «المشاهد» في الدليل الإسلامي كما هو — للمراجعة اللغوية إن لزم.
