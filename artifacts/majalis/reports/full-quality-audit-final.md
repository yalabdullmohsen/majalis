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

## ما أُصلح (ملخص تنفيذي)

1. SSOT للأرقام + حراس التسرّب/الادّعاءات/الأمان/الهوية
2. SEO/prerender + تحويل `/fatwa` → `/rulings` + تنقل 12+6
3. **أداء JS:** إخراج quiz-seed؛ إزالة حزمة icons (~570KB) ومنع `import *` من lucide
4. **أداء CSS (هذه الجولة):** تخفيف المسار الحرج من **~768KB → ~722KB**
   - نقل CSS صفحات (qibla / surah-index / revelation-order / mushaf-reader) من `elite-2026` إلى `styles/pages/*` مع الاستيراد الكسول
   - نقل `highlighted-content.css` خارج `main.tsx` إلى مكوّنات القراءة
   - حذف قوالب التعزية الميتة من `index.css` (~70KB خام)
   - تقليم `geo-*` غير المستخدمة من `patterns.css`
   - نقل وضع تركيز الأذكار من `modern-2026` إلى `pages/adhkar.css`
5. HTTP 404 Edge عبر `middleware.js`
6. حراس: `test:known-routes`، `test:lucide-star`، `test:critical-css`

## أحجام المسار الحرج

| | قبل التدقيق | بعد JS/icons | بعد CSS |
|---|---|---|---|
| JS أولي تقريبي | ~1.77MB | ~1.17MB | ~1.17MB |
| CSS `index-*.css` | ~768KB | ~768KB | **~722KB** (gzip ~126KB) |

## Lighthouse (mobile، محلي)

| الصفحة | Perf | A11y | BP | SEO |
|---|---:|---:|---:|---:|
| `/` | 55 | 100 | 100 | 100 |
| `/quran-hub/` | 69 | 96 | 96 | 100 |
| `/library/book-bukhari/` | 65 | 98 | 96 | 100 |
| `/qa/` | 61 | 100 | 96 | 100 |
| `/adhkar/` | 67 | 97 | 96 | 100 |

Perf دون هدف 90. العوائق المتبقية: JS الرئيسي ~978KB + طبقات CSS المتبقية (`elite`/`index`/`design-system`).

## التقييم

| المحور | الدرجة |
|---|---|
| بيانات/هوية | 9/10 |
| SEO/prerender | 8.5/10 |
| تنقل | 8.5/10 |
| أمان + 404 | 8.5/10 |
| أداء | 6.7/10 |
| تدقيق شرعي بشري | 4/10 |
| a11y | 9/10 |
| **الإجمالي** | **~7.9/10** |

**ليس 10/10.** الدمج عبر workflow النشر اليدوي فقط بعد قبول المالك.

## متبقٍ لاحقًا

- مزيد من استخراج جزر `design-system` / بقايا `elite` عالية الحجم
- مراجعة شرعية بشرية للكتب والعبارات المطلقة
- التحقق من 404 على Vercel preview
