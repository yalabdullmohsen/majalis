# TOTAL TRUST — المرحلة 4: حديث / تفسير / SEO

**الفرع:** `cursor/sunnah-total-trust-p4`  
**أساس:** `origin/main` بعد #2144

## النطاق

تدقيق مصدري (قراءة فقط + إصلاحات عرض/SEO محدودة) لمسارات الحديث والتفسير العامة:

| مسار | نوع |
|---|---|
| `/hadith` · `/hadith/sahih` · `/hadith/daif` · `/hadith/mawdu` | صفحات |
| `/hadith/books` · `/hadith/books-and-rulings` · `/hadith/:id` | صفحات |
| `/hadith-science` · `/arbaeen-nawawi` · `/hadith/arbaeen-love-of-allah` | صفحات |
| `/tafsir` | صفحة |
| `/hadith/arbaeen` → `/arbaeen-nawawi` | تحويل مثبت |
| `/quran/tafsir` → `/tafsir` | تحويل مثبت |

## قواعد

| فحص | نتيجة مقبولة |
|---|---|
| empty / loading من المصدر | `PASS_SOURCE` (أو فهرس ثابت) |
| error | `STATUS.*` أو فهرس ثابت |
| OfflineBanner عام | مطلوب |
| SEO ثابت للمسارات غير البارامترية | وصف ≥ ٨٠ حرفًا في `seo-routes.json` |
| التحويلات | إثبات في `AppRoutes` و/أو `vercel.json` — بلا SEO إلزامي للمسار القديم |
| نص شرعي | لا توليد · لا حكم آلي |

## مخرجات

- `reports/total-trust/phase4-hadith-tafsir.json`
- تحديث `reports/total-trust/route-coverage-matrix.json` (`phase4Checked`)
- بوابة: `test:total-trust-phase4`

## App Store

لا تعديل Connect. لا سحب من المراجعة. Finding المتجر يبقى `OWNER_DECISION`.
