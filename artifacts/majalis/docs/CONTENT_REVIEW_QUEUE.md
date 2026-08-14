# طابور مراجعة المحتوى — CONTENT_REVIEW_QUEUE

آخر تحديث: 2026-08-14 (مولَّد آليًا عبر `generate-content-audit-report.mjs`)

القاعدة: كل عنصر `review_status: needs_review` في `public/data/knowledge/**` يُدرج هنا ولا يُعرض في الواجهة كحقيقة قطعية.

## جرد حي

| القسم | الكل | verified | needs_review |
|---|---:|---:|---:|
| discover-islam | 190 | 91 | 99 |
| history | 17 | 0 | 17 |
| intro-islam | 14 | 14 | 0 |
| nations | 16 | 16 | 0 |
| prophets | 25 | 25 | 0 |
| quiz | 2100 | 2100 | 0 |
| quran-people | 101 | 99 | 2 |
| tafsir | 1171 | 92 | 1079 |
| **المجموع** | **3634** | **2437** | **1197** |

## دفعات needs_review

| القسم | العدد | سبب الوسم |
|---|---:|---|
| tafsir | 1079 | مقدمات/معاني بانتظار نسبة صريحة للميسّر أو السعدي آيةً آية |
| discover-islam | 99 | تنويع الأجوبة وتدقيق الشبهات المعاصرة / ترجمات |
| history | 17 | مقالات إطار تحتاج مصادر فقرة-فقرة |
| quran-people | 2 | تسمية تفسيرية غير مصرّح بها في النص |

## عيّنة معرّفات للمراجعة البشرية

### tafsir (1079)

- `tafsir-ayah-78-1`
- `tafsir-ayah-78-2`
- `tafsir-ayah-78-3`
- `tafsir-ayah-78-4`
- `tafsir-ayah-78-5`
- `tafsir-ayah-78-6`
- `tafsir-ayah-78-7`
- `tafsir-ayah-78-8`
- `tafsir-ayah-78-9`
- `tafsir-ayah-78-10`
- `tafsir-ayah-78-11`
- `tafsir-ayah-78-12`
- … و1067 أخرى

### discover-islam (99)

- `discover-faq-061`
- `discover-faq-062`
- `discover-faq-063`
- `discover-faq-064`
- `discover-faq-065`
- `discover-faq-066`
- `discover-faq-067`
- `discover-faq-068`
- `discover-faq-069`
- `discover-faq-070`
- `discover-faq-071`
- `discover-faq-072`
- … و87 أخرى

### history (17)

- `history-jahiliyyah`
- `history-biatha`
- `history-hijra`
- `history-madinah`
- `history-abu-bakr`
- `history-umar`
- `history-uthman`
- `history-ali`
- `history-fitnah`
- `history-umayyad`
- `history-abbasid`
- `history-andalus`
- … و5 أخرى

### quran-people (2)

- `person-tubba-king`
- `person-ahl-kahf-names`

## بنوك قديمة خارج knowledge

| المسار | حالة المسح 2026-08-14 | إجراء |
|---|---|---|
| `public/data/quiz/**` | 112 ملفًا · 8491 سؤالًا · demo≈4946 · بلا شرح كافٍ≈4297 | تنقية تدريجية أو إخفاء من الفهرس الموحّد |
| `src/lib/nations/data/*` | حشو نقاط تاريخي | استبدال العرض بـ knowledge/nations |
| `public/data/stories/*` | خارج بوابات knowledge | إصلاح اقتباسات الآيات أو حذفها |

## إشارات تدقيق ناعمة (لا تفشل البوابة وحدها)

- كتل مكررة ≥8 مرات في جسم verified: **35** عنصرًا (أبرزها: `nation-tubba`×32، `nation-ashab-rass`×31، `nation-ashab-ukhdud`×30، `nation-ashab-janna`×29، `nation-qawm-yunus`×29)
- المذكورون في القرآن verified دون 400 كلمة: **99** (يُعالَج بتوسيع المحتوى المنفصل)
- ذكر إسرائيليات/أهل الكتاب بلا حقل وبلا ضابط منهجي في النص: **21** (`person-maryam`, `person-asiyah`, `person-luqman`, `person-dhul-qarnayn`, `person-khidr`, `person-talut`, `person-firawn`, `person-haman`)
- لا يُعرض قطعاً حتى المراجعة: حديث بلا `ref`+`grade`+`graded_by` · آية غير مطابقة للمصحف · إسرائيلية بلا `israiliyat`
