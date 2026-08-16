# إلغاء مسارات التعلم نهائيًا

تاريخ: 2026-08-16  
الفرع: `fix/remove-learning-paths`

## الخلاصة

أُزيل ظهور «مسارات التعلم / المسارات العلمية» من الواجهة العامة، وSEO/sitemap، والبحث السطحي، ولوحة الإدارة. المسارات القديمة تُحوَّل **301/Redirect دائم** إلى `/lessons` — بلا fallback للرئيسية. صفحة `/lessons` بقيت قائمة دروس/دورات مع بحث وفلاتر.

## الملفات المعطّلة أو المنظّفة (واجهة عامة)

- إزالة روابط/نصوص المسارات من: الرئيسية (`HomeStartHereSection`)، ابدأ من هنا، مركز الخدمات، الدروس، حسابي التعليمي، العلماء، التفسير، البطاقات، الإشعارات، خريطة الموقع، التيكر، كتالوج الرئيسية، تذييل/تنقل مرتبط.
- إزالة قسم «المسارات العلمية» من لوحة الإدارة (`AdminShell` / `AdminPage` / `DashboardSection`).
- إزالة تسجيل المسارات من `seo-routes.json` و`generate-seo.mjs`؛ حذف prerender تحت `seo-prerender/learning/**` و`learning-plan`.
- تنظيف `public/sitemap.xml` من كل `/learning/paths*`.

## Routes: redirect → `/lessons`

| المصدر | السلوك |
|---|---|
| `/learning/paths`, `/learning/paths/:slug` | redirect → `/lessons` (App + vercel 301) |
| `/learning`, `/learning-paths`, `/learning-paths/:path*` | → `/lessons` |
| `/learning-path`, `/learning-plan`, `/masarat` | → `/lessons` (vercel؛ App حيث ينطبق) |
| `/tracks`, `/study-paths`, `/pathways` | → `/lessons` |
| `/lessons/paths`, `/lessons/paths/*` | → `/lessons` |
| `/courses/paths`, `/courses/paths/*` | → `/lessons` |
| `/learning/quiz`, `/learning/quiz/:slug` | → `/quiz` |
| `/learning/calendar` | → `/calendar` |
| `/learning/certificates*` | → `/lessons` |

لا يوجد تحويل لهذه المسارات إلى `/`.

## ما بقي (متعمد)

- ملفات المحرك/الخدمة غير الموصولة بالراوتر العام (`src/lib/learning-paths*`, `src/views/learning/*`, `LearningPathsSection`) لم تُحذف من القرص بعد؛ الراوتر والإدارة والـSEO لا تعرضها للعامة. يمكن حذفها لاحقًا كتنظيف دينّي منفصل.
- `/lessons`, `/learn`, الدورات السنوية، المشايخ، المساجد — لم تُمس وظيفيًا.

## تأكيد `/lessons`

- الراوتر يعرض صفحة الدروس (`LessonsView`) بلا Redirect للرئيسية.
- أزيل رابط «مسارات التعلم» من `ExploreAlsoNav` فقط.
- الاختبار `remove-learning-paths.test.ts` يفرض بقاء `/lessons` في App وsitemap.

## الاختبارات

- جديد: `src/lib/__tests__/remove-learning-paths.test.ts` (مضمّن في `test:ci-unit`).
- يفشل عند ظهور «مسارات التعلم» / «المسارات العلمية» في الأسطح العامة، أو `/learning/paths` في sitemap/seo-routes، أو redirect للرئيسية.

## نتائج التحقق

```
pnpm run verify:ci  → نجحت (typecheck + lint + test:ci-unit + build + repo-gates + mushaf)
```

- typecheck: نجح  
- lint: نجح  
- build: نجح  
- `test:remove-learning-paths`: ok  
- بوابة اليُتم: MUST_DISCOVER يستخدم `/lessons` بدل `/learning/paths`
