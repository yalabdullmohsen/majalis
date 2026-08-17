# إصلاح فشل بوابة التباين — PR #1227

المصدر: GitHub Actions run `32018216228` / job `95353169749`  
الفرع: `cursor/section-lobby-unify`  
الفحص: `CI / Color contrast (Playwright)` → خطوة `Color contrast gate`  
الخطوة التالية `On-brand contrast gate` تُتخطّى لأن ما قبلها فشل (`if: success()`).

**القاعدة:** البوابة تبلّغ عن العطل. لا خفض عتبة، لا استثناء مسار، لا `continue-on-error`، لا `--skip`.

## جدول الانتهاكات كما ظهرت في CI

| # | المسار | الوضع | المحدّد | لون النص | لون الخلفية | المقاس | المطلوب | السبب |
|---|---|---|---|---|---|---|---|---|
| 1 | `/quran-knowledge` | light | `.hub-card__title` | — | — | — | 3:1 | `NOT_FOUND` |
| 2 | `/quran-knowledge` | light | `.hub-card__desc` | — | — | — | 4.5:1 | `NOT_FOUND` |
| 3 | `/quran-knowledge` | dark | `.hub-card__title` | — | — | — | 3 ثم 4.5 | `NOT_FOUND` (تأكيدان) |
| 4 | `/lessons` | light | `.page-hero-mj__title` | — | — | — | 3:1 | `NOT_FOUND` |
| 5 | `/lessons` | dark | `.page-hero-mj__title` | — | — | — | 3:1 | `NOT_FOUND` |
| 6 | `/quran-knowledge` | light | `.page-hero-mj__title` | — | — | — | 3:1 | `NOT_FOUND` |
| 7 | `/prayer-times` | light | `.pts-dates` | `#D5E0DA` `rgb(213,224,218)` | `#F2F4F3` `rgb(242,244,243)` | **1.23:1** | 4.5:1 | لون حقيقي |
| 8 | `/prayer-times` | light | `.pts-hero__name` | — | — | — | 4.5:1 | `NOT_FOUND` |
| 9 | `/prayer-times` | dark | `.pts-hero__name` | — | — | — | 4.5:1 | `NOT_FOUND` |

المجموع في السجل: **10 تأكيدات فاشلة من 478**.

## التشخيص (قبل أي تعديل لون)

التوحيد نقل الصفحات إلى `SectionLobby` فاختفت أصناف اللوبي القديم، وبقي لون صلاة مصمَّم لخلفية زمردية فوق سطح فاتح:

1. **NOT_FOUND — دروس / قرآن:** العنوان صار `.section-lobby__title` (وللقرآن أيضاً `.quran-hub-page__title`). البطاقات `.card__label` / `.card__subtitle` عبر `SectionCard`، ليست `.hub-card__*`. بوابة `section-lobby-gates.test.ts` تمنع إعادة `page-hero-mj` داخل `SectionLobby.tsx`.
2. **لون حقيقي — `.pts-dates`:** `PrayerTimesView` يضع التاريخ في `.pts-lobby-body` خارج `.pts-screen`. القاعدة `.pts-dates { color: #D5E0DA }` كانت للنص على زمرد `#1F7A5A`. الخلفية الفعلية `#F2F4F3` (`--mj-bg`) → 1.23:1.
3. **`.pts-hero__name` NOT_FOUND:** اسم الصلاة انتقل إلى `primary` في `FeaturedSectionCard` (`.card__label`).

تحديث المحدّدات إلى عناصر اللوبي الجديدة **مسموح** ما دامت العتبة كما هي على المحتوى نفسه (عنوان/وصف). حذف التأكيد أو خفض العتبة ممنوع.

## الإصلاح المعتمد (رموز لا عناصر)

أزواج في `@theme` (`src/app/styles/theme.css`) — النسب مقابل السطح المذكور، محسوبة بنفس معادلة WCAG 2.x للبوابة:

| الرمز | القيمة | الخلفية | النسبة | العتبة |
|---|---|---|---|---|
| `--on-surface` | `#16241E` | `#FFFFFF` | 16.09:1 | 4.5 |
| `--on-surface` | `#16241E` | `#F2F4F3` | 14.56:1 | 4.5 |
| `--on-surface-muted` | `#4A5A53` | `#FFFFFF` | 7.30:1 | 4.5 |
| `--on-surface-muted` | `#4A5A53` | `#F2F4F3` | 6.60:1 | 4.5 |
| `--brand-on-white` | `#146C4E` | `#FFFFFF` | 6.39:1 | 4.5 |
| `--chip-fg` / `--chip-bg` | `#0F4A36` / `#E4F0EA` | الزوج | 8.74:1 | 4.5 |
| `--on-brand` | `#FFFFFF` | `#1F7A5A` | 5.26:1 | 4.5 |
| `--on-brand-muted` | `#E8F3EE` | `#1F7A5A` | 4.63:1 | 4.5 |

هوية العلامة: نفس عائلة الأخضر؛ النص على الفاتح أغمق ليُقرأ، لا لون جديد.

## قبل / بعد لكل انتهاك

| # | قبل | بعد |
|---|---|---|
| 1–3، 4–6 | محدّد لوبي قديم غائب | تأكيد على `.section-lobby__title` / `.card__label` / `.card__subtitle` بنفس العتبات |
| 7 | `#D5E0DA` على `#F2F4F3` = 1.23:1 | `--on-surface-muted` على سطح اللوبي ≥6.6:1؛ على الزمرد يبقى `--on-brand-muted` |
| 8–9 | `.pts-hero__name` غائب | تأكيد على `.section-lobby .card--featured .card__label` بنفس 4.5:1 |

## التحقق

- `pnpm --filter @workspace/majalis run test:on-dark-text-tokens` (يشمل `theme-contrast-pairs.test.ts`)
- `pnpm --filter @workspace/majalis run test:color-contrast-gate`
- `pnpm --filter @workspace/majalis run test:on-brand-contrast`
