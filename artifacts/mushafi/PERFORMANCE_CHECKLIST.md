# Performance Checklist

## Flutter

- [ ] شاشة Dashboard تفتح بدون تأخير ملحوظ.
- [ ] شاشة التسميع لا تعيد بناء Widgets الثقيلة بشكل زائد.
- [ ] لا يتم تحميل ملف القرآن كاملا أكثر من مرة.
- [ ] QuranRepository يستخدم cache.
- [ ] PDF report لا ينشأ إلا عند الطلب.
- [ ] Live Follow Along يعمل بسلاسة.
- [ ] لا يوجد memory leak في StreamSubscriptions.
- [ ] جميع subscriptions تلغى في dispose/reset.
- [ ] Audio recorder يتوقف عند مغادرة الشاشة.
- [ ] لا توجد عمليات blocking طويلة داخل build.

## ASR Server

- [ ] /health سريع.
- [ ] الملفات المؤقتة تحذف.
- [ ] لا يتم حفظ الصوت بشكل دائم.
- [ ] rate limiting مفعل.
- [ ] max audio duration مضبوط.
- [ ] max file size مضبوط.
- [ ] WebSocket لا يستهلك الذاكرة بلا حد.
