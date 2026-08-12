# قياسات الأداء المرجعية — majlisilm.com

**التاريخ:** 2026-07-11  
**الفرع:** `perf/core-web-vitals-pwa`  
**أداة البناء:** Vite 5 + Rollup  
**المنصة:** Vercel Serverless + React 18 SPA  

---

## 1. أحجام الـ Chunks (JS) — قبل التحسين

| الترتيب | اسم الـ Chunk | الحجم الخام (kB) | الحجم brotli/gzip (kB) |
|---------|--------------|-----------------|----------------------|
| 1 | admin | 514.45 | ~122.81 |
| 2 | platform-services | 499.26 | ~103.08 |
| 3 | home-sections | 326.85 | ~83.64 |
| 4 | vendor | 252.64 | ~78.34 |
| 5 | content-data | 335.95 | ~74.54 |
| 6 | index (entry) | 234.94 | ~64.28 |
| 7 | fatwa-rulings-seed | 227.91 | ~57.19 |
| 8 | html2canvas | 214.26 | ~52.64 |
| 9 | supabase | 209.56 | ~54.62 |
| 10 | adhkar-fawaid-seed | 277.26 | ~48.75 |
| 11 | islamic-stories-seed | 170.12 | ~35.00 |
| 12 | content-seed | 134.97 | ~33.00 |
| 13 | courses-updates-seed | 130.24 | ~26.00 |
| 14 | science-pages | 129.31 | ~24.00 |
| 15 | fiqh-council | 100.17 | ~23.00 |
| 16 | lessons-seed-data | 97.97 | ~22.00 |
| 17 | fiqh-council-data | 88.33 | ~21.00 |
| 18 | IslamicGlossaryPage | 78.90 | ~20.00 |
| 19 | QuizPage | 72.21 | ~20.00 |
| 20 | AkhlaqPage | 70.14 | ~18.00 |

**إجمالي JS (خام):** 6,245 kB ≈ 6.1 MB  
**إجمالي JS (gzip تقريبي):** 1,147 kB ≈ 1.12 MB  
**عدد الـ chunks:** 169 ملف  
**أكبر chunk واحد:** 514 kB (admin) — محمّل مع كل مستخدم  
**زمن البناء:** ~3.94 ثانية

---

## 2. أحجام CSS — قبل التحسين

| الملف | الحجم الخام (kB) |
|-------|----------------|
| index (Tailwind الرئيسي) | 1,341.96 |
| quran-pages | 66.96 |
| admin | 29.07 |
| MindMapPage | 6.38 |
| RulingsPage | 4.24 |
| **المجموع** | **1,448.62 kB** |

---

## 3. المشكلات المُحدَّدة

### أولوية عالية
1. **`admin` chunk (514 kB):** يُحمَّل لكل زائر رغم أنه يخدم المسؤولين فقط
2. **`platform-services` (499 kB):** خدمات المنصة المُدمجة، يمكن lazy-loading معظمها
3. **لا يوجد lazy loading للمسارات:** معظم الصفحات تُحمَّل فوراً في entry bundle

### أولوية متوسطة
4. **`home-sections` (327 kB):** محتوى الصفحة الرئيسية — يمكن تقسيم الأقسام
5. **`html2canvas` (214 kB):** مكتبة لتصدير الصور — تُحمَّل حتى لمن لا يستخدمها
6. **`supabase` (210 kB):** جميع مكتبات Supabase في chunk واحد

### بنية عامة
7. **CSS الرئيسي (1.34 MB خام):** Tailwind غير مُصفّى بالكامل — purging يحتاج مراجعة
8. **خطوط عربية:** لم يُتحقق من التحسين الكامل لـ font-display

---

## 4. أهداف ما بعد التحسين

| المقياس | الوضع الحالي | الهدف |
|---------|-------------|-------|
| أكبر JS chunk (gzip) | 122 kB | < 80 kB |
| إجمالي JS للصفحة الرئيسية | ~350 kB gzip | < 200 kB |
| CSS index (raw) | 1,342 kB | < 800 kB |
| LCP (mobile) | غير مقاس محلياً | < 2.5s |
| FID/INP | غير مقاس | < 200ms |
| CLS | غير مقاس | < 0.1 |
| Lighthouse Performance (mobile) | غير مقاس | > 85 |

---

## 5. ملاحظات

- Lighthouse لم يُشغَّل محلياً لغياب Chrome headless في البيئة
- تقديرات gzip محسوبة من نسب ضغط نموذجية لـ JavaScript
- `rollup-plugin-visualizer` سيولّد `reports/bundle-before.html` بعد البناء التالي مع `ANALYZE=1`
