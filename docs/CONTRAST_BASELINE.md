# خط أساس تباين الألوان

تاريخ التشغيل: 2026-08-17. الفرع: `main` عند `cc8dad8d5` (بعد دمج #1253).

## أين المخالفة؟ — تشغيل فعلي لا تخمين

الأمر على `main` نفسه (نفس بوابة CI، ليست `tests/color-contrast` لأنها غير موجودة):

```bash
git checkout main && git pull
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run test:color-contrast-gate
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run test:on-brand-contrast
```

| البوابة | على `main` | السجل |
|---|---|---|
| Color contrast (Playwright) | **نجحت** | 92 تأكيد انحدار + 193 مسارًا · 386 قياس عنوان · أدنى عنوان ليلي `/prophets` = 9.63:1 · الملف `/tmp/contrast-main.log` |
| On-brand contrast | **نجحت** | صفر نص غير مقروء فوق الأخضر · إرشادي 60 / خط أساس 62 |

**النتيجة:** المخالفة **ليست** في `main`. أزواج `@theme` في `theme.css` ضمن العتبة (`theme-contrast-pairs.test.ts`).

## #1252 — الدليل من CI

تشغيل GitHub `32063994689` / وظيفة `95492799540` على فرع `revert/prayer-page-legacy`:

| المسار | المحدّد | لون النص | لون الخلفية | المقاس | المطلوب | السبب |
|---|---|---|---|---|---|---|
| `/prayer-times` [light] | `.section-lobby .card--featured .card__label` | — | — | — | 4.5:1 | **NOT_FOUND** |
| `/prayer-times` [dark] | `.section-lobby .card--featured .card__label` | — | — | — | 4.5:1 | **NOT_FOUND** |

هذان ليسا زوج لون. التأكيد كُتب لصفحة اللوبي (#1238). #1252 يعيد الشاشة الزمردية (`pts-hero__name`) فيسقط المحدّد. `On-brand` تُتخطّى لأن الخطوة السابقة فشلت (`if: success()` الافتراضي). `visual-snapshot` تُتخطّى لأن `need_mushaf != true`.

`Verify build` نجح رغم فشل التباين لأن الوظيفة كانت `continue-on-error` وغير مربوطة بالمجمّع.

## مراجعة فرق #1252 (المهمة ٥)

+276 / −190 في ٨ ملفات — أكبر من ملفّي الصفحة لأن البوابات والسجل احتاجا استثناء `layout: "legacy"`:

| ملف | ماذا | #1230 | #1231 | رموز السطح |
|---|---|---|---|---|
| `PrayerTimesView.tsx` | إرجاع من `39330d1fa` | لا يمس الشريط | لا | لا |
| `prayer-times.css` | إرجاع #1230 (طلاء `#root` و`.bottom-nav` بـ `--em-950`) | **بقي** | لا | `.pts-lobby-body` أُزيل مع اللوبي — الألوان الزمردية داخل `.pts-screen` |
| `App.tsx` | إعادة `classList.toggle("pts-immersive", onPrayer)` | مطلوب للصفحة السابقة حتى لا يظهر شريط فاتح | لا | لا يُرجع `on-dark` |
| `sections.registry.ts` | `layout: "legacy"` | لا | لا | لا |
| 4 ملفات اختبار | توقعات اللوبي → الصفحة السابقة | يبقى `--em-950` على الشريط | لا | لا |

`SideNavDrawer` / `sidebar-redesign.css` **لم يُمسا** (#1231 درج من اليمين سليم). لا إرجاع لرموز `on-dark`.

## أزواج `@theme` (قبل = بعد على main — لا تغيير هوية)

| الزوج | النسبة | العتبة |
|---|---|---|
| `--on-surface` `#16241E` على `#FFFFFF` | 16.09:1 | 4.5 |
| `--on-surface` `#16241E` على `#F2F4F3` | 14.56:1 | 4.5 |
| `--on-surface-muted` `#4A5A53` على `#FFFFFF` | 7.30:1 | 4.5 |
| `--on-surface-muted` `#4A5A53` على `#F2F4F3` | 6.60:1 | 4.5 |
| `--brand-on-white` `#146C4E` على `#FFFFFF` | 6.39:1 | 4.5 |
| `--on-brand` `#FFFFFF` على `#1F7A5A` | 5.26:1 | 4.5 |
| `--on-brand-muted` `#E8F3EE` على `#1F7A5A` | 4.63:1 | 4.5 |

لا خفض عتبة. لا قائمة استثناء دائمة. `artifacts/majalis/docs/contrast-baseline.json` **فارغ**.

## ما تغيّر بعد هذا التشخيص

1. محدّد اسم الصلاة يقبل اللوبي **أو** `.pts-hero__name` — نفس العتبة 4.5:1. هذا ما يجعل #1252 يمر بعد دمج هذا الفرع إلى `main` دون تعديل محتوى الصلاة.
2. البوابة تفشل على مخالفة جديدة أو زيادة العدد مقابل خط الأساس (حاليًا صفر).
3. CI: `Color contrast` و`visual-snapshot` يعملان مع كل بناء ناجح · `On-brand` بـ `if: always()` وخطوة ترفض `Skipped` · المجمّع `ci-required` يعامل `Skipped` في بوابة إلزامية كفشل · بلا `continue-on-error` على هاتين الوظيفتين.

## أزواج قبل / بعد (رموز `@theme`)

لا تغيير في الهوية. القياس على `main` (`cc8dad8d5`) هو نفسه بعد هذا الفرع:

| الزوج | قبل | بعد | العتبة |
|---|---:|---:|---:|
| `--on-surface` على `#FFFFFF` | 16.09:1 | 16.09:1 | 4.5 |
| `--on-surface` على `#F2F4F3` | 14.56:1 | 14.56:1 | 4.5 |
| `--on-surface-muted` على `#FFFFFF` | 7.30:1 | 7.30:1 | 4.5 |
| `--brand-on-white` على `#FFFFFF` | 6.39:1 | 6.39:1 | 4.5 |
| `--on-brand` على `#1F7A5A` | 5.26:1 | 5.26:1 | 4.5 |
| `--on-brand-muted` على `#1F7A5A` | 4.63:1 | 4.63:1 | 4.5 |

لقطات الشكل: لا فرق بصري لأن الرموز لم تُمس. الإصلاح في المحدّد المزدوج + تشغيل البوابات لا في الألوان.

خط الأساس `artifacts/majalis/docs/contrast-baseline.json` **فارغ**. أي بند لاحق يحتاج `expires` خلال ٧ أيام وقرارًا في هذا الملف.
