# تقرير الوحدة ٣١ — خطة الخطوط وحجم التطبيق

**الفرع:** `cursor/font-loading-strategy`  
**الوسم:** `safe:ui`  
**التاريخ:** 2026-08-11

## ١) الوضع الحالي (مقيس)

| البند | القيمة |
|---|---|
| عدد ملفات QPC V2 | **٦٠٤** (`p1.woff2`…`p604.woff2`) |
| الصيغة | **WOFF2 حصراً** (magic `wOF2`) — لا TTF/OTF |
| الحجم الكلي | **٩٧٬٧٤٨٬٦٣٦ بايت ≈ ٩٣٫٢٢ MiB** (du ≈ ٩٤M) |
| متوسط الملف | ≈ ١٥٨ KB (أدنى ≈٤٠ KB لص١ · أعلى ≈٢٢١ KB) |
| التخزين (ويب/CI) | `public/fonts/qpc-v2/` داخل المستودع للمعاينة وبوابات اللقطة |
| التخزين (أصلي) | تُستبعد بعد `cap sync` عبر `native:strip-qpc-fonts` → تنزيل إلى Cache API |
| التحميل السابق | FontFace API · الصفحة + **±١** · LRU ≤١٢ |
| التحميل الحالي | الصفحة + **±٢** · نافذة ≤٥ · `unloadFontFace` + `revokeObjectURL` |

تقدير نافذة ٥ صفحات مضغوطة ≈ **٠٫٧٧ MiB** ≪ حد ٨MB.

## ٢) ما نُفّذ

1. **نافذة ذاكرة ٥ صفحات** (`QPC_FONT_MEMORY_WINDOW`) مع تحميل مسبق **±٢**.
2. **`unloadFontFace`**: حذف من `document.fonts` + `faceRegistry` لما خارج النافذة.
3. **Cache API** (`majalis-qpc-fonts-v1`) + تنزيل تفاضلي بأولوية الجوار ثم الباقي، وشريط تقدّم في المصحف عند غياب الحزمة.
4. **`native:strip-qpc-fonts`** بعد `cap sync` لإخراج ~٩٤MB من IPA/APK؛ التنزيل عند أول تشغيل أصلي.
5. المصدر: كاش (Blob URL) → محلي `/fonts/qpc-v2/` → احتياطي `quran.com` WOFF2 عند غياب الحزمة.

## ٣) قرارات

- الإبقاء على ملفات `public/` للويب/CI وبوابات اللقطة؛ الاستبعاد يخص **الحزمة الأصلية** فقط.
- لم يُضف `@capacitor/filesystem` — Cache API يعمل في WKWebView ويغذّي `FontFace` عبر Blob URL مع إلغاء الـ URL عند الخروج من النافذة.
- WOFF2 كان متحققاً مسبقاً؛ لا تحويل مطلوب.

## ٤) البوابات

| بوابة | العتبة | النتيجة |
|---|---|---|
| WOFF2 فقط | ١٠٠٪ | متحققة (`wOF2`) |
| نافذة ≤٥ في الذاكرة | ≤٥ وجوه | متحققة في الكود + اختبار |
| ذاكرة خطوط مقيمة | ≤٨MB | ≈٠٫٧٧ MiB مضغوط للنافذة |
| حزمة أصلية | ≤٥٠MB | مسار strip يحذف ~٩٤MB خطوط من iOS/Android |
| صفر وميض | لا FOUT | `font-display:block` + تحميل مسبق للجوار |
| فتح أول صفحة | ≤١٫٢s | قيد قياس جهاز بعد strip (الويب يخدم محلياً) |

## ٥) الفحوص المنفَّذة

- `pnpm run test:qpc-font-pack` — ok (604 · 93.22 MiB · window 0.77 MiB)
- `pnpm run lint` + `tsc --noEmit` + `PORT=24216 BASE_PATH=/ pnpm run build` — نجحت
- `pnpm run test:mushaf-gates:core`:
  - multi-viewport: **٤ مقاسات × ١٠ صفحات خضراء** (375×667 · 390×844 · 430×932 · 744×1133)
  - flip-perf: avgFps **٦٠** · maxFrameMs ١٨ · forcedLayouts ٠

## ٦) متبقٍّ للجهاز الحقيقي

- قياس زمن فتح أول صفحة ≤١٫٢s بعد strip + تنزيل أول تشغيل.
- التحقق من حجم IPA/APK بعد `mobile:sync` + strip على جهاز بناء.
