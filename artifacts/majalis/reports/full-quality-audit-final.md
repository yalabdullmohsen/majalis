# التقرير النهائي — تدقيق جودة المجلس العلمي

- **الفرع:** `cursor/full-quality-audit-4f26`
- **نقطة الاستعادة:** `restore/full-quality-audit-baseline` @ `2c5d6a81`
- **آخر commit:** `c3d8b190` (`c3d8b19011d17ae3e9a2d9a79e36c5051c6b1122`)
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
3. **ادّعاءات توثيق تسويقية** مخفَّفة + حارس `test:scholarly-ui-claims`
4. **SEO/prerender:** لا عنوان «كتاب شرعي»؛ لا استبدال عنوان prerender بـslug إنجليزي بعد الـJS؛ عناوين كتب/علماء صحيحة في View Source وبعد التحميل
5. **تحويلات:** `/fatwa/:id` → `/rulings/:id`
6. **تنقل:** 12 قسم أولوية + 6 تبويبات سفلية + فصل اللعبة عن الأسئلة العلمية
7. **أمان:** `upgrade-insecure-requests` في CSP + حارس رؤوس
8. **أداء:** تأجيل منسّقي الأذان؛ 404 كسول؛ الحزمة الرئيسية ~951KB (كانت ~1108KB)
9. **زحف dist:** 0 روابط HTML مكسورة
10. **iPhone smoke:** 320–430px بلا overflow أفقي؛ عناوين صحيحة بعد networkidle

## نتائج الاختبارات (فحص ثانٍ)

| اختبار | النتيجة |
|---|---|
| build (سلسلة كاملة سابقة) + إعادة vite/prerender | نجاح |
| test:seo P0 | 0 على 809 |
| test:identity / fake-counts / content-leaks / scholarly-ui-claims / security-headers / iphone-shell | نجاح |
| homepage-leak + dynamic-404-safety | نجاح |
| crawl-internal-links | 0 مكسور |
| test-dist-unique-titles | نجاح |
| Playwright iPhone viewport smoke | نجاح (reports/iphone-viewport-smoke.json) |

## يحتاج مراجعًا شرعيًا بشريًا

- 174 كتابًا كلها `pending_review`
- 817 تطابقًا لعبارات مطلقة في البذور (`reports/absolute-claims-scan.*`) — ليست كلها أخطاء
- موسوعة المسائل والـQA والمعجزات — انظر `scholarly-review-queue.md`

## مخاطر متبقية (صريحة)

1. مسارات SPA غير المُصيَّرة قد تُرجع HTTP 200 عبر rewrite (سلوك Vercel SPA) — الصفحات المفهرسة الحرجة لها prerender
2. `quiz-seed` ما زال ~1.1MB؛ `icons` ~570KB — لم يُكتمل التقسيم الكامل
3. طبقات CSS متعددة (index/elite/brand) — توحيد جزئي فقط عبر final-release
4. Lighthouse العددي الكامل لم يُشغَّل (السكربت الموجود smoke وليس LH)
5. تدقيق لغوي حرفًا حرفًا لكل السجلات لم يكتمل بشريًا

## التقييم القابل للقياس

| المحور | الدرجة |
|---|---|
| بيانات/أرقام/هوية | 9/10 |
| SEO/prerender/عناوين | 8.5/10 |
| تنقل/فصل سؤال وجواب | 8.5/10 |
| أمان أساسي (headers) | 8/10 |
| أداء الحزمة | 6.5/10 |
| تدقيق شرعي بشري | 4/10 (قوائم جاهزة) |
| a11y/Lighthouse كامل | 6/10 |
| **الإجمالي المرحلي** | **~7.5/10** |

**ليس 10/10.** جاهز لمراجعة بشرية ودمج عبر workflow النشر اليدوي فقط بعد قبول المالك.
