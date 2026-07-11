# تقرير الأداء الشامل — majlisilm.com

**الفرع:** `perf/core-web-vitals-pwa`  
**التاريخ:** 2026-07-11  
**المرحلة:** 0–5 مُكتملة  

---

## نتائج قبل / بعد (JS — gzip)

| الـ Chunk | قبل التحسين | بعد التحسين | التغيير |
|----------|------------|------------|---------|
| `platform-services` | 103 kB | **20 kB** | ↓ 80% 🎉 |
| `index` (entry) | 64 kB | **50 kB** | ↓ 22% 🎉 |
| `home-sections` | 83 kB | **69 kB** | ↓ 17% 🎉 |
| `qa-data` (جديد) | — | 37 kB | chunk منفصل |
| `fiqh-council-data` | 21 kB | 61 kB | أُضيف: fiqh-issues + fiqh-council-service |
| `adhkar-fawaid-seed` | 48 kB | 59 kB | أُضيف: fawaid-curated + content-quality |
| `content-seed` | 33 kB | 82 kB | أُضيف: islamic-stories-seed |
| `lessons-seed-data` | 22 kB | 34 kB | أُضيف: sheikhs-seed + scientific-announcements |
| `scholarly` | — | 28 kB | scholars-data منفصل |
| `admin` | 122 kB | 122 kB | لم يتغير |

---

## المراحل المُنجزة

### المرحلة 0: القياسات المرجعية ✅
- قياس 169 chunk
- الحجم الكلي JS: 6245 kB خام / ~1147 kB gzip
- CSS: 1342 kB خام / 212 kB gzip
- سُجِّل في `reports/baseline.md`

### المرحلة 1: تقسيم الحزم (Code Splitting) ✅
**التغييرات في `vite.config.ts`:**
- أُضيف chunk جديد `qa-data` لـ `qa-seed.ts` (203 kB كان ملتصقاً بـ platform-services)
- أُضيف chunk `rulings-encyclopedia` لـ `rulings-encyclopedia-seed.generated.ts` (286 kB)
- أُضيف `fiqh-issues-seed`, `fiqh-council-service`, `fiqh-global-search`, `fiqh-research-assistant` إلى `fiqh-council-data`
- أُضيف `fawaid-curated-seed`, `content-quality` إلى `adhkar-fawaid-seed`
- أُضيف `prophetic-medicine-seed` إلى `science-pages`
- أُضيف `islamic-stories-seed` إلى `content-seed`
- أُضيف `sheikhs-seed`, `scientific-announcements` إلى `lessons-seed-data`
- أُضيف `scholars-data` إلى `scholarly`
- أُضيف `auto-content-service`, `platform-search` إلى `platform-services`

**النتيجة الرئيسية:**  
`platform-services`: **103 kB → 20 kB gzip (انخفاض 80%)**  
`index` entry: **64 kB → 50 kB gzip (انخفاض 22%)**

### المرحلة 2: تحسين الخطوط العربية ✅
**التغييرات في `index.html`:**
- Cairo: من blocking (`<link rel="stylesheet">`) إلى non-blocking (`media="print" onload`)
- Amiri Quran: أُجِّل بـ `display=optional` (يُحمَّل عند الحاجة فقط)
- Aref Ruqaa, Scheherazade, Amiri, Noto Naskh: كانت non-blocking وبقيت كذلك
- أُضيف `crossorigin` لتاج `preconnect` لـ `fonts.googleapis.com`

**النتيجة:** لا يوجد خط blocking في critical path للصفحة الرئيسية.

### المرحلة 3: الصور ✅
- الصور الأساسية موجودة بصيغة `.webp` بالفعل (sheikhs/*.webp)
- صور الشيوخ لديها نسخ `.jpg` و `.webp` للتوافق
- الأيقونات: `favicon.svg`, `favicon.png`, `icon-192.png`, `apple-touch-icon.png`
- صور OG: `/opengraph.jpg` محدود بـ `max-age=86400`

### المرحلة 4: طبقة البيانات ✅
**`vercel.json` (موجود بالفعل ومُحسَّن):**
- الأصول المُبعثرة (`/assets/*`): `public, max-age=31536000, immutable` ✓
- الصفحات (`/`, `/index.html`): `no-cache` ✓
- Sitemap: كاش في API handler (3600 ثانية) ✓
- Feed: كاش (1800 ثانية) ✓

### المرحلة 5: PWA (العمل دون اتصال) ✅
**SW مُطوَّر من v16 إلى v17:**
- أُضيف `ASSETS_CACHE` لتخزين الأصول المُبعثرة (hashed JS/CSS) بـ cache-first
- قبل التعديل: أصول `/assets/*` تُحمَّل من الشبكة دوماً ثم تُهدر
- بعد التعديل: أصول `/assets/*` تُخزَّن عند أول طلب وتُستخدم offline
- الـ manifest موجود (`site.webmanifest`, `manifest.webmanifest`)
- `offline.html` جاهز وموجود
- SW مُسجَّل في `main.tsx`

---

## ملخص ما لم يتغيَّر

| المقياس | الحالة |
|---------|--------|
| Admin chunk (122 kB) | لم يتقلَّص — يتطلب تقسيم داخلي في صفحات الإدارة |
| CSS (212 kB gzip) | لم يُحسَّن — Tailwind v4 يُنظِّف تلقائياً، التقليص الإضافي محدود |
| Lighthouse scores | غير مقاس محلياً (يحتاج Chrome headless) |
| vendor chunk (78 kB) | React/Wouter/scheduler — لا يمكن تقليصه دون مكتبة أخرى |

---

## التوصيات للمستقبل

1. **Admin chunk (122 kB)**: تقسيمه إلى sub-chunks حسب الوظيفة (automation, fiqh-review, dashboard)
2. **CSS**: تحليل الـ custom CSS وإزالة القواعد المكررة في `index.css` (1342 kB خام)
3. **Lighthouse CI**: إضافة Lighthouse في pipeline CI لرصد الأداء مع كل commit
4. **React Query**: إضافة `staleTime` مناسب للاستعلامات المتكررة لتقليل API calls
