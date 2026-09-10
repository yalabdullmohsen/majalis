# بنية Typography وتصميم سُنّة — أساس بدون تعديل شاشات

**الفرع/المرحلة:** foundation فقط — لا هجرة شاشات في هذا المستند التنفيذي.  
**تاريخ:** 2026-09-10

## 1) المركزية (مصدر واحد)

| المجال | المصدر الحرفي (قيم) | واجهة الاستهلاك (--ss-*) | ملاحظات |
|---|---|---|---|
| Typography | `src/app/styles/theme.css` → `--text-mj-*` | `src/styles/ssunnah-theme-api.css` → `--ss-type-*` | 6 أحجام أساسية في theme |
| Colors / text | نفس الملف → `--color-*` / `--mj-*` | `--ss-color-*` | لا هكس جديد في طبقة --ss- |
| Spacing | `--spacing-mj-*` | `--ss-space-*` | سلّم 4/8/12/16/24/32/48 |
| Radius / borders | `--radius-mj-*` + `--radius-card` | `--ss-radius-*` | |

**TypeScript (أسماء فقط):** `src/lib/ssunnah-theme.ts`  
**مكوّنات النص:** `src/components/design-system/text/*`  
**التحميل:** `main.tsx` يستورد `ssunnah-theme-api.css` مباشرة بعد `theme.css`.

### قاعدة عدم التكرار
- أي قيمة لونية/مسافية/حافة جديدة تُضاف في `theme.css` فقط.
- `ssunnah-theme-api.css` و`ssunnah-theme.ts` جسر `var(...)` بلا قيم حرفية.
- الطبقات القديمة (`brand-v4`, `design-tokens`, `theme-aliases`, …) تبقى للتوافق؛ الهجرة التدريجية تلغي استهلاكها المباشر من الشاشات.

## 2) مكوّنات نص موحدة

| المكوّن | الدور | وسم افتراضي | صنف CSS |
|---|---|---|---|
| `ScreenTitle` | عنوان شاشة | `h1` | `.ss-text--screen-title` |
| `SectionTitle` | عنوان قسم | `h2` | `.ss-text--section-title` |
| `CardTitle` | عنوان بطاقة | `h3` | `.ss-text--card-title` |
| `BodyText` | متن | `p` | `.ss-text--body` |
| `ScriptureText` | نص شرعي معروض (عرض فقط) | `p` | `.ss-text--scripture` |
| `ExplanationText` | شرح | `p` | `.ss-text--explanation` |
| `SupportingText` | داعم | `p` | `.ss-text--supporting` |
| `LabelText` / `SsLabel` | تسمية | `span` | `.ss-text--label` |
| `Caption` | تعليق صغير | `span` | `.ss-text--caption` |
| `SsText` | عام مع `role` | حسب الدور | `.ss-text` |

الاستيراد:

```ts
import { ScreenTitle, BodyText, Caption } from "@/components/design-system";
// أو
import { SS_COLOR, SS_SPACE } from "@/lib/ssunnah-theme";
```

`tone`: `default` | `muted` | `brand` | `onBrand`  
لا يُعدَّل نص القرآن/التشكيل عبر هذه المكوّنات — العرض فقط بنفس المحتوى.

## 3) حصر الشاشات (inventory)

Heuristic: **نظام** = يعتمد أصناف/توكنات مشتركة؛ **مباشر** = `text-[…]` / `fontSize` / هكس نصي واضح؛ **مختلط** = الاثنان.

### P0 — أول موجة هجرة

| الأولوية | المجموعة | المسار | المسار/الملف | استخدام النظام؟ |
|---|---|---|---|---|
| P0 | الرئيسية | `/` | `pages/account/HomePage.tsx` + `ui/HomeView.tsx` | نظام (جزئي) |
| P0 | الرئيسية | `/` | `components/home/HomeHeroLcp.tsx` | نظام |
| P0 | الرئيسية | `/` | `components/home/HomeStartHereSection.tsx` | نظام |
| P0 | الرئيسية | `/` | `components/home/HomeUniversalSearch.tsx` | نظام |
| P0 | الأقسام | `/sections` | `pages/account/SectionsPage.tsx` | نظام |
| P0 | الأقسام | مشترك | `components/topic/TopicPage.tsx` | نظام |
| P0 | الأقسام | عدة | `views/MergedSectionHubPage.tsx` | نظام |
| P0 | الأقسام | عدة | `components/SectionAccordionLayout.tsx` | مختلط |
| P0 | الأقسام | `/quran-hub` | `pages/quran/QuranHubPage.tsx` | نظام |
| P0 | الأقسام | `/fiqh` | `pages/fiqh/FiqhPage.tsx` | نظام |
| P0 | الأقسام | `/hadith` | `pages/hadith/ui/HadithView.tsx` | نظام |
| P0 | الأقسام | `/lessons` | `pages/lessons/ui/LessonsView.tsx` | نظام |
| P0 | دروس | `/lessons/:id` | `pages/lessons/ui/LessonDetailView.tsx` | نظام |
| P0 | حديث/آية | `/hadith/:id` | `pages/hadith/ui/HadithByIdView.tsx` | نظام |
| P0 | حديث/آية | `/mushaf` | `pages/quran/MushafReaderPage.tsx` | نظام (عرض مصحف منفصل) |
| P0 | حديث/آية | `/tafsir` | `pages/quran/ui/TafsirView.tsx` | نظام |
| P0 | تعريف | `/islamic-glossary` | `pages/account/IslamicGlossaryPage.tsx` | نظام |
| P0 | تعريف | `/tawhid` | `views/TawhidPage.tsx` | مباشر |
| P0 | بحث | `/search` | `pages/account/ui/SearchView.tsx` | نظام |
| P0 | بحث | overlay | `components/GlobalSearchModal.tsx` | مباشر |
| P0 | قرآن | `/quran/surahs` | `pages/quran/ui/SurahIndexView.tsx` | نظام |
| P0 | صلاة | `/prayer-times` | `pages/worship/ui/PrayerTimesView.tsx` | نظام |
| P0 | صلاة | `/adhkar` | `pages/worship/ui/AdhkarView.tsx` | نظام |
| P0 | إعدادات | `/settings` | `pages/account/ui/SettingsView.tsx` | نظام |

### P1 — موجة ثانية

| الأولوية | المجموعة | المسار | الملف | النظام؟ |
|---|---|---|---|---|
| P1 | الرئيسية | `/` | `components/home/HomeAboutSection.tsx` | مباشر |
| P1 | الرئيسية | `/` | `components/home/HomeInterestingTopics.tsx` | مباشر |
| P1 | دروس | `/lessons/archive`, `/teachers`, `/kuwait-lessons`, `/my-learning` | `pages/lessons/*` | نظام |
| P1 | حديث | `/hadith/sahih|daif|mawdu|books`, `/hadith-science`, `/arbaeen-nawawi` | `pages/hadith/*` | نظام |
| P1 | تعريف | `/fiqh/topics/:id`, `/salah-guide`, `/discover-islam`, `/asma-husna` | صفحات فقه/تعريف | مختلط |
| P1 | تعريف | `/sujood-sahw`, `/sins-and-rights/:slug` | `views/*` | مباشر |
| P1 | قرآن | تاجويد/قراءات/حفظ/قصص | `pages/quran/*` | مختلط |
| P1 | صلاة | `/qibla`, `/duas`, `/tasbih`, `/adhan-settings` | `pages/worship/*` | نظام |
| P1 | قوائم | `/login`, `/register`, `/fawaid`, `/notification-settings` | `pages/account/*` | نظام |
| P1 | فارغ/خطأ | `*` | `views/not-found.tsx`, `components/ErrorBoundary.tsx`, `components/ui/empty.tsx` | نظام |

### P2 — لاحقًا

| الأولوية | المجموعة | ملاحظة |
|---|---|---|
| P2 | مصادر / قانونية / خرائط / مسابقات | استهلاك أخف للنص |
| P2 | Admin (`views/admin/*`, ~69 ملفًا) | دفعة مستقلة بعد المنتج |
| P2 | صفحات تاريخ/أمم/فرق متفرقة | بعد قوالب TopicPage |

**مضاعفات القوة (هاجرها أولاً داخل كل دفعة):**  
`TopicPage` · `MergedSectionHubPage` · `SectionAccordionLayout` · `PageHero`/`PageHeader` · `HubCard`/`SectionEntryCard`

## 4) خطة التطبيق على دفعات (بدون تنفيذ الآن)

| دفعة | النطاق | الهدف | معيار اكتمال |
|---|---|---|---|
| **0 — هذا PR** | بنية فقط | `--ss-*` + مكوّنات نص + حصر + بوابة | لا تغيير شاشات؛ بوابة foundation خضراء |
| **1** | قوالب مشتركة | استبدال عناوين `TopicPage` / `PageHero` / `HubCard` بمكوّنات SsText حيث لا يتغير المحتوى | لقطات قبل/بعد؛ تباين AA |
| **2** | الرئيسية + بحث | Home* + SearchView + GlobalSearchModal | إزالة `text-[`/`fontSize` المباشر |
| **3** | حديث + تفسير + تفاصيل | Hadith* + Tafsir + LessonDetail | ScriptureText للمتن المعروض فقط |
| **4** | تعريف/شرح outliers | TawhidPage, SujoodSahw, … | لا هكس نصي |
| **5** | صلاة + إعدادات + فارغ/خطأ | worship + settings + empty | موحّد Caption/Label |
| **6** | قرآن غير المصحف | فهارس/تاجويد (المصحف يبقى مسار عرض خاص) | بدون لمس نص المصحف |
| **7** | Admin + بقايا | تنظيف | اختياري |

### ضوابط كل دفعة
1. لا تعديل محتوى شرعي — عرض/غلاف فقط.  
2. لا قيم حرفية جديدة خارج `theme.css`.  
3. PR واحد لكل دفعة.  
4. `verify:ci` قبل الدفع.  
5. بعد الدفعة 1: منع تدريجي في البوابة لاستيراد شاشات P0 بـ `style={{ fontSize` جديد.

## 5) ملفات هذا الأساس

- `src/app/styles/theme.css` — تعليق يشير لواجهة --ss-*
- `src/styles/ssunnah-theme-api.css` — جديد
- `src/lib/ssunnah-theme.ts` — جديد
- `src/components/design-system/text/*` — جديد
- `src/components/design-system/index.ts` — تصدير
- `src/main.tsx` — استيراد الطبقة
- `src/lib/__tests__/ssunnah-typography-foundation-gate.test.ts` — بوابة
- هذا المستند
