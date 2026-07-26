# التقرير النهائي — تدقيق جودة المجلس العلمي

- **الفرع:** `cursor/full-quality-audit-4f26`
- **نقطة الاستعادة:** `restore/full-quality-audit-baseline` @ `2c5d6a81`
- **PR:** https://github.com/yalabdullmohsen/majalis/pull/277
- **لا دمج إلى main / لا نشر production من هذه الجلسة**

## نطاق الفحص

| البند | العدد |
|---|---:|
| مسارات App | 252 |
| صفحات prerender / SEO | 809 |
| روابط داخلية فريدة (زحف dist) | 811 |
| كتب | 174 |
| علماء | 135 |
| مسائل فقهية | 642 |
| أسئلة علمية | 459 |
| أسئلة اللعبة | 1227 |
| تطابقات عبارات مطلقة (مسح آلي للبذور) | 817 |

## ما أُصلح (ملخص تنفيذي)

1. **SSOT للأرقام** + noscript متزامن + حارس `test:fake-counts`
2. **تسربات مطوّر** + حارس `test:content-leaks`
3. **ادّعاءات توثيق تسويقية** مخفَّفة + حارس `test:scholarly-ui-claims`
4. **SEO/prerender:** عناوين صحيحة؛ لا استبدال prerender بـslug إنجليزي؛ `/fatwa/:id` → `/rulings/:id`
5. **تنقل:** 12 قسم أولوية + 6 تبويبات سفلية + فصل اللعبة عن الأسئلة العلمية
6. **أمان:** `upgrade-insecure-requests` في CSP + حارس رؤوس
7. **أداء — quiz:** إخراج `quiz-seed` إلى `public/data/quiz-questions.json` (لا `quiz-seed-*.js`)
8. **أداء — icons:** إزالة `import *` من lucide في DiscoverIslam؛ إلغاء حزمة `icons` العملاقة (~570KB)؛ استثناء lucide من قاعدة vendor الخاطئة؛ تحميل كسول لـ AchievementToast
9. **HTTP 404 حقيقي:** `middleware.js` + `known-routes.json` (Vercel Edge)
10. **زحف dist:** 0 روابط HTML مكسورة
11. **حراس جديدة:** `test:known-routes`، `test:lucide-star`
12. **Lighthouse حقيقي** على 5 صفحات — انظر الجدول

## أحجام الحزم (مسار التحميل الأولي تقريبًا)

| قبل إصلاح icons | بعد |
|---|---|
| index ~952KB + icons ~570KB + vendor ~252KB ≈ **1.77MB** | index ~977KB + vendor ~191KB ≈ **1.17MB** |

وفّرنا نحو **600KB** من JS على المسار الحرج (إزالة أيقونات غير مستخدمة + منع دمج lucide في vendor/icons).

## نتائج الاختبارات

| اختبار | النتيجة |
|---|---|
| build كامل | نجاح |
| fake-counts / scholarly-ui-claims / security-headers / known-routes / lucide-star | نجاح |
| homepage-leak + dynamic-404-safety | نجاح |
| crawl-internal-links | 0 مكسور |
| test-dist-unique-titles | نجاح |
| lighthouse:critical | نُفِّذ — Perf دون 90 |

## Lighthouse (محلي، mobile، معاينة dist)

المصدر: `reports/lighthouse-critical.json`

| الصفحة | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| `/` | 55 | 100 | 100 | 100 |
| `/quran-hub/` | 65 | 96 | 96 | 100 |
| `/library/book-bukhari/` | 64 | 98 | 96 | 100 |
| `/qa/` | 62 | 100 | 96 | 100 |
| `/adhkar/` | 68 | 97 | 96 | 100 |
| **الهدف** | **90** | **95** | **95** | **95** |

الأداء ما زال دون 90؛ العائق الأبرز المتبقي: CSS الرئيسي ~768KB وحجم JS المتبقي في index. a11y/BP/SEO عند الهدف أو فوقه.

## يحتاج مراجعًا شرعيًا بشريًا

- 174 كتابًا كلها `pending_review`
- 817 تطابقًا لعبارات مطلقة في البذور — ليست كلها أخطاء
- موسوعة المسائل والـQA — انظر `scholarly-review-queue.md`

## مخاطر متبقية (صريحة)

1. Lighthouse Performance 55–68 — دون هدف 90
2. CSS المجمّع ~768KB — لم يُقسَّم بعد
3. 404 الحقيقي يعتمد على Vercel Edge Middleware
4. تدقيق لغوي/شرعي بشري لكل السجلات لم يكتمل

## التقييم القابل للقياس

| المحور | الدرجة |
|---|---|
| بيانات/أرقام/هوية | 9/10 |
| SEO/prerender/عناوين | 8.5/10 |
| تنقل/فصل سؤال وجواب | 8.5/10 |
| أمان + 404 Edge | 8.5/10 |
| أداء الحزمة / Lighthouse Perf | 6.5/10 |
| تدقيق شرعي بشري | 4/10 |
| a11y (عيّنة LH) | 9/10 |
| **الإجمالي المرحلي** | **~7.8/10** |

**ليس 10/10.** جاهز لمراجعة بشرية ودمج عبر workflow النشر اليدوي فقط بعد قبول المالك.
