# التقرير النهائي — تدقيق جودة المجلس العلمي

- **الفرع:** `cursor/full-quality-audit-4f26`
- **نقطة الاستعادة:** `restore/full-quality-audit-baseline` @ `2c5d6a81`
- **آخر commit:** `bd766bee` (`bd766bee` — توثيق؛ العمل الرئيسي `de95cc15`)
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

1. **SSOT للأرقام** + noscript متزامن + حارس `test:fake-counts` (يشمل About)
2. **تسربات مطوّر** + حارس `test:content-leaks`
3. **ادّعاءات توثيق تسويقية** مخفَّفة في صفحات التسويق + حارس `test:scholarly-ui-claims`
4. **SEO/prerender:** لا عنوان «كتاب شرعي»؛ لا استبدال عنوان prerender بـslug إنجليزي بعد الـJS؛ عناوين كتب/علماء صحيحة في View Source وبعد التحميل
5. **تحويلات:** `/fatwa/:id` → `/rulings/:id`
6. **تنقل:** 12 قسم أولوية + 6 تبويبات سفلية + فصل اللعبة عن الأسئلة العلمية
7. **أمان:** `upgrade-insecure-requests` في CSP + حارس رؤوس
8. **أداء:** تأجيل منسّقي الأذان؛ 404 كسول؛ إخراج `quiz-seed` من حزمة JS إلى `public/data/quiz-questions.json` — لا يوجد `quiz-seed-*.js` في dist؛ `islamicQuizData` ~152KB كسول؛ الحزمة الرئيسية ~952KB
9. **HTTP 404 حقيقي:** `middleware.js` + `known-routes.json` (Edge على Vercel) — المعاينة المحلية SPA لا تحاكي Edge بالكامل
10. **زحف dist:** 0 روابط HTML مكسورة
11. **iPhone smoke:** 320–430px بلا overflow أفقي؛ عناوين صحيحة بعد networkidle
12. **Lighthouse حقيقي** على 5 صفحات حرجة — انظر الجدول أدناه

## نتائج الاختبارات

| اختبار | النتيجة |
|---|---|
| build (سلسلة كاملة) | نجاح |
| test:seo P0 | 0 على 809 |
| test:identity / fake-counts / content-leaks / scholarly-ui-claims / security-headers / iphone-shell / known-routes | نجاح |
| homepage-leak + dynamic-404-safety | نجاح |
| crawl-internal-links | 0 مكسور |
| test-dist-unique-titles | نجاح |
| Playwright iPhone viewport smoke | نجاح |
| lighthouse:critical | نُفِّذ — الأداء دون الهدف |

## Lighthouse (محلي، mobile، معاينة dist)

المصدر: `reports/lighthouse-critical.json`

| الصفحة | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| `/` | 55 | 100 | 100 | 100 |
| `/quran-hub/` | 64 | 96 | 96 | 100 |
| `/library/book-bukhari/` | 62 | 98 | 96 | 100 |
| `/qa/` | 60 | 100 | 96 | 100 |
| `/adhkar/` | 64 | 97 | 96 | 100 |
| **الهدف** | **90** | **95** | **95** | **95** |

الأداء لم يصل 90 — السبب الأبرز المتبقي: حجم الحزمة الرئيسية (~952KB) وحزمة `icons` (~570KB). a11y/BP/SEO عند الهدف أو فوقه في العيّنة.

## يحتاج مراجعًا شرعيًا بشريًا

- 174 كتابًا كلها `pending_review`
- 817 تطابقًا لعبارات مطلقة في البذور (`reports/absolute-claims-scan.*`) — ليست كلها أخطاء
- موسوعة المسائل والـQA والمعجزات — انظر `scholarly-review-queue.md`

## مخاطر متبقية (صريحة)

1. أداء Lighthouse Performance 55–64 على الصفحات الحرجة — دون هدف 90
2. حزمة `icons` ما زالت كبيرة (~570KB)
3. طبقات CSS متعددة (index/elite/brand) — توحيد جزئي فقط عبر final-release
4. 404 الحقيقي يعتمد على Vercel Edge Middleware؛ preview المحلي لا يحاكيه
5. تدقيق لغوي حرفًا حرفًا لكل السجلات لم يكتمل بشريًا

## التقييم القابل للقياس

| المحور | الدرجة |
|---|---|
| بيانات/أرقام/هوية | 9/10 |
| SEO/prerender/عناوين | 8.5/10 |
| تنقل/فصل سؤال وجواب | 8.5/10 |
| أمان أساسي (headers) + 404 Edge | 8.5/10 |
| أداء الحزمة / Lighthouse Perf | 6/10 |
| تدقيق شرعي بشري | 4/10 (قوائم جاهزة) |
| a11y (Lighthouse عيّنة) | 9/10 |
| **الإجمالي المرحلي** | **~7.7/10** |

**ليس 10/10.** جاهز لمراجعة بشرية ودمج عبر workflow النشر اليدوي فقط بعد قبول المالك.
