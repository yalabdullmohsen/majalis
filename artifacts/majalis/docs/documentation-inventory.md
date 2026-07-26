# جرد التوثيق — مقياس التقدّم
> آخر تحديث: 2026-07-25 (بعد تطبيق `trust_level` على الفقه/الأسماء/المنهج)
الأرقام محسوبة آلياً من الملفات (سكربت `scripts/_inventory-trust.mjs` + قراءة الحقول بعد الرقع)، لا تقديرات.
## نقطة مقارنة (تقرير سابق)
- 254 سؤالاً بلا evidence → الآن: evidence null = **155** / 360
- 161 بلا reference → الآن: reference null = **142**
- 100 مرجع قالبي دائري في الاختبار → الآن: circular = **0**
- 526 فائدة بلا author_name → الآن: noAuthor=60 emptyAuthor=527 (من 616)
- 64 مسألة فقهية 61 بأدلة عامة → الآن: general_reasoning=49, unsourced=3, institutional=8, scholarly=4

## ملاحظة منهجية حرجة
حقل `documentation_level: "official_verified"` في المسائل الفقهية **بوابة عرض** في الواجهة (`isPublicIssue`). لم يُخفَّض. الدرجة الصادقة في `trust_level`.

## الجدول الرئيسي
| الملف | العدد | primary | scholarly | institutional | general | unsourced | نسبة غير unsourced |
|---|---:|---:|---:|---:|---:|---:|---:|
| qa-seed.ts | 360 | 15 | 72 | 0 | 124 | 149 | 58.6% |
| quiz-seed.ts | 1024 | 31 | 16 | 0 | 39 | 938 | 8.4% |
| fiqh-issues-seed.ts | 64 | 0 | 4 | 8 | 49 | 3 | 95.3% |
| fawaid-seed.ts | 616 | 51 | 14 | 0 | 341 | 210 | 65.9% |
| fawaid-curated-seed.ts | 210 | 59 | 91 | 0 | 60 | 0 | 100.0% |
| asma-husna-data.ts | 99 | 86 | 0 | 0 | 0 | 13 | 86.9% |
| islamic-stories-seed.ts | 85 | 0 | 0 | 0 | 0 | 85 | 0.0% |
| miracles-seed.ts | 60 | 15 | 0 | 0 | 3 | 42 | 30.0% |
| rulings-encyclopedia-seed.generated.ts | 200 | 15 | 12 | 0 | 50 | 123 | 38.5% |
| curriculum-topics.json | 36 | 19 | 0 | 0 | 17 | 0 | 100.0% |

## تفاصيل إضافية
- QA: evidence=null **155**، reference=null **142**، كلاهما null **142**
- Quiz: مراجع دائرية متبقية **0**، شروح قالب **0**، بلا reference **927**
- Asma: مرجع «الحديث: تسعة وتسعون اسماً» فقط → trust_level=unsourced: **13**
- Curriculum watched (1/4/5/10): كلها `publication_gate=open` بعد التحقق أن المتن العربي بلا لاتيني؛ العزل السابق مؤكَّد

## تحديث 2026-07-26 — تطبيق trust_level على بقية البذور

| الملف | العدد | primary | scholarly | institutional | general | unsourced |
|---|---:|---:|---:|---:|---:|---:|
| qa-seed.ts | 360 | 18 | 93 | 0 | 107 | 142 |
| quiz-seed.ts | 1024 | 36 | 22 | 0 | 92 | 874 |
| fawaid-seed.ts | 616 | 65 | 60 | 0 | 466 | 25 |
| islamic-stories-seed.ts | 85 | 0 | 0 | 0 | 85 | 0 |
| miracles-seed.ts | 60 | 15 | 0 | 0 | 15 | 30 |
| asma-husna-data.ts | 99 | 86 | 0 | 0 | 0 | 13 |
| fiqh-issues-seed.ts | 64 | 0 | 4 | 8 | 49 | 3 |

ملاحظة: القصص لها مصادر مسمّاة بلا جزء/صفحة → `general_reasoning` لا `scholarly_source`.
