# جولة سلامة الأحكام / المكتبة / التواصل — 2026-08-16

فرع: `audit/rulings-gate-and-integrity`  
أساس: Production الحي عند `7e0218c0` (مع الحفاظ على إصلاحات P0 السابقة).

## P0 — فهرس الأحكام بعد Publication Gate

### تشخيص البيانات (manifest encyclopedia)

| المقياس | القيمة |
|---|---|
| total | 147 |
| draft | 0 |
| needs_review | 147 |
| pending_review | 147 |
| approved | 0 |
| published | 0 |
| archived | 0 |
| incomplete | 0 |
| orphaned | 0 |
| publicEligible | 0 |

لا يوجد أي سجل `approved`/`published` صالح للعرض العام.  
**لم يُعتمد أي سجل آليًا**، و**لم تُعاد `pending_review` للعامة**.

### الإصلاح المنفَّذ

- واجهة `/rulings`: Empty State صريحة عند غياب المنشور:
  «يجري حاليًا استكمال المراجعة العلمية لمواد الموسوعة، وستظهر الأحكام المعتمدة تباعًا.»
- SEO shell لنفس المسار: الرسالة نفسها بدل قسم «من الأحكام المتاحة» الفارغ.
- الأقسام ذات الصلة بقيت مفيدة.
- لا عدّادات وهمية لغير الإدارة.

## P1 — مصادر المكتبة

تدقيق 173 كتابًا (`reports/library-source-completeness-audit.json`):

| | |
|---|---|
| total | 173 |
| source_verified | 11 |
| source_missing | 162 |
| source_broken | 0 |
| needs_review (contentStatus) | 0 |

- أُزيل عرض «المصدر قيد الإضافة» من مولّد SEO.
- عند غياب `external_url` يُخفى حقل الرابط (بطاقة تعريف بلا رابط قراءة).
- **لا اختلاق مصادر**.

## P1 — التواصل

- الصفحة التفاعلية كانت تحتوي `mailto:` عبر `CONTACT_EMAIL` من `site.config.json`.
- أُضيف البريد الرسمي إلى HTML/SSR لـ`/contact` حتى يظهر بلا اعتماد كامل على JS.

## P2 — انحدار

- دروس: توسيع كاشف تكرار الألقاب (`القارئ:`) + بقاء اختبار الأجراح/مطلق.
- SEO دروس: لا يسبق `الشيخ:` إن كان الاسم ملقّبًا أصلًا.
- جامعات: اختبار SSR يعتمد `UNIVERSITY_ROWS.length` من الكتالوج.
- `/qa→/quiz` و`/library` عبر `production-p0-regressions`.

## ما لم يُثبت في هذه الجولة (يتطلّب أجهزة/وقت/شبكة)

- Lighthouse Mobile كامل على كل المسارات المطلوبة.
- Playwright Mobile على أجهزة حقيقية / TestFlight.
- axe-core يدوي شامل.
- Full Route Crawl HTTP لكل المسارات الديناميكية.
- التحقق الشبكي لحذف الحساب والخصوصية (يحتاج حساب اختبار + Supabase).
- مطابقة نصوص قرارات المجمع مع المصدر الرسمي صفحةً بصفحة (validation فقط؛ لم تُغيَّر بيانات).

## أوامر التحقق المحلية

```bash
pnpm --filter @workspace/majalis run test:round-integrity-p0
pnpm run verify:ci
```

## READY_FOR_MERGE

بعد نجاح `verify:ci` وPreview HTTP لـ`/rulings` و`/contact` وعيّنة مكتبة بلا «المصدر قيد الإضافة».
