# SEO — حالة أولية

## مشاكل مقيسة
- `/library` و`/updates` و`/knowledge-graph` كانت تُحوَّل للرئيسية رغم وجودها في `sitemap.xml` — قيد الإصلاح في PR #1073.
- `/search` غير مدرج في sitemap (مقبول إن بقي `noindex`).
- `/quran/mushaf` لم يكن له تحويل إلى `/mushaf`.

## مطلوب لاحقاً
- توليد sitemap آلي بـ lastmod بلا صفحات مكسورة
- JSON-LD الموحّد (WebSite/Organization/BreadcrumbList/…)
- وصف `/mushaf` يطابق منتج QPC
- أرقام الرئيسية محسوبة من البيانات وقت البناء
