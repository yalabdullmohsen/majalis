# تدقيق قبول بصري — مصحف P0

- التاريخ: 2026-09-11
- المصدر: Production Vite preview لفرع المصحف بعد إصلاحات P0 (`/mushaf` الحقيقي)
- الأداة: Playwright Chromium + viewports iPhone SE / 14 / 14 Pro Max
- الاختبار: `tests/mushaf-p0-acceptance-audit.spec.ts` — **15/15 ناجح**

## النتيجة
**قبول مشروط (Web Release preview)** للصفحات 27 و29 و30:
- صفحة واحدة عند الاستقرار، بلا peek
- عرض اللوحة = viewport (±1.5px)
- رقم الصفحة يطابق المحتوى (data-page + aria-label)
- التقليب 27→30 بلا تغيّر مقياس الخط/ارتفاع المتن
- فتح المشغّل لا يحرّك النص؛ الرصيف غير مقصوص

## قيود
- ليس بناء Capacitor iOS Release على محاكي/جهاز حقيقي؛ Status Bar الأصلي لنظام iOS لم يُقاس هنا.
- يُنصح بجولة TestFlight قصيرة لتأكيد Status Bar وأمان اللمس.

## اللقطات
انظر ملفات `iphone-*-p{27,29,30}-*.png` في هذا المجلد.
