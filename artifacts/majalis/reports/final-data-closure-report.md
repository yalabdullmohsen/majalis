# تقرير إغلاق بيانات الموقع — 2026-08-15

## الخلاصة

أُغلقت مشاكل **مصادر المكتبة** و**SSR/SEO للأمم** و**الذين ذكروا في القرآن** و**آزر** و**تخفيف ادعاءات التوثيق** دون إعادة تصميم.  
**هل بقي P0؟ لا.**  
**هل الموقع صالح للنشر؟ نعم** — مع إثراء تدريجي لاحق للصفحات الجزئية (أحكام، موضوعات، بعض كتب المكتبة بلا مرجع مكتمل).

## الأخطاء التي أُصلحت

| المشكلة | الإصلاح |
|---|---|
| «المصدر: رابط القراءة» كقيمة مصدر | لا يظهر؛ المراجع الحقيقية عبر `sourceReference`؛ وإلا `source_pending` + «المصدر قيد الإضافة» |
| `/nations` و`/nations/:slug` homepage fallback | SEO shell/prerender بعنوان وh1 ووصف وcanonical وJSON-LD ومحتوى مختصر بلا JS |
| `/quran/people` و`/quran/people/:slug` homepage fallback | نفس الآلية؛ عنوان الشخصية: «[الاسم] في القرآن \| المجلس العلمي» |
| غياب آزر | أُضيف `azar` في `people.json` (41 سجلًا) مع prerender وبحث/قائمة |
| ذو الكفل بلا تنبيه | `cautionNote` يوضح الخلاف في النبوة |
| `/fiqh` «موثّقة بالأدلة» | «مواد فقهية يجري ربطها بالأدلة والمصادر تدريجيًا.» |
| `/methodology` «قيد المراجعة الشرعية» كحكم عام | مقصورة على مواد معيّنة؛ غير موجودة في meta/JSON-LD |
| ادعاءات اكتمال في `/rulings` و`/topics` | صياغات إثراء تدريجي |

## الصفحات التي لم تعد homepage fallback

- `/nations`
- `/nations/aad` · `/nations/thamud` · `/nations/qawm-firaun` · وكل `/nations/:slug`
- `/quran/people`
- `/quran/people/maryam` · `/quran/people/dhul-kifl` · `/quran/people/azar` · وكل `/quran/people/:slug`

## عدد quran people بعد آزر

**41** (كان 40).

## صفحات المكتبة التي أُصلحت مصادرها

المراجع الببليوغرافية ظاهرة (ليست «رابط القراءة») مع روابط نص خارجية منفصلة:

- `/library/book-bukhari`
- `/library/book-muslim`
- `/library/book-muwatta`
- `/library/book-abudawud`
- `/library/book-tirmidhi`
- `/library/book-nasai`
- `/library/book-ibnmajah`
- `/library/book-ahmad`
- `/library/book-riyadh`
- `/library/book-nawawi40`

باقي الكتب بلا `sourceReference` تظهر «المصدر قيد الإضافة» و`sourceStatus=source_pending` ولا تُعرض كمصدر موثوق.

## نتيجة الاختبارات

| الأمر | النتيجة |
|---|---|
| `pnpm run test:remaining-site-fixes` | نجح |
| `pnpm run audit:full-site-data` | نجح (sitemap ≈ **896** URL بعد التوليد) |
| `pnpm run audit:data-completeness` | نجح |
| `pnpm run typecheck` | نجح |
| `pnpm run lint` | نجح |
| `pnpm run build` | نجح (`version.json` → `27de1b83`) |

## ما بقي partial (ليس P0)

- موسوعة الأحكام `/rulings`: إثراء وربط أدلة تدريجي
- الموضوعات `/topics`: فهرس ثابت + بيانات API عند التوفر
- كتب مكتبية عديدة `source_pending`
- محتوى الهيئات `/fiqh-council`: إثراء حسب المصادر المتاحة
- `/fatwa` يحوّل إلى `/fiqh` (سياسة متعمدة)

## هل بقي P0؟

**لا.**
