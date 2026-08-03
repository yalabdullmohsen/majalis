# Release Candidate

## Version

`1.0.0+1`

## Candidate Status

Release Candidate: RC1

## Scope

هذا الإصدار يحتوي على:

- التسميع الأساسي.
- اختيار السورة ونطاق الآيات.
- fallback عبر تعرف الجهاز عند توفره.
- محرك خادم اختياري غير مفعل افتراضيا.
- Forced Alignment عند تفعيل الخادم.
- Live Follow Along.
- SRS وخطة مراجعة.
- Dashboard.
- أهداف يومية وتذكيرات.
- PDF reports.
- فحص سلامة ملف القرآن.
- صفحات الخصوصية والحدود.
- حول التطبيق والدعم.
- مواد المتاجر.

## Defaults

- رفع الصوت للخادم: غير مفعل افتراضيا.
- WebSocket Live: غير مفعل افتراضيا.
- Native PCM Streaming: غير مفعل افتراضيا.
- السماح بالإرسال الخارجي: غير مفعل افتراضيا.
- fallback المحلي: متاح قدر الإمكان.
- النص القرآني: من ملف داخلي فقط.

## Non-goals

- لا يقدم التطبيق حكما شرعيا على التلاوة.
- لا يدعي دقة مطلقة.
- لا يولد نص القرآن بالذكاء الاصطناعي.
- لا يعتمد على خادم خارجي افتراضيا.

## Required Checks

- [x] Quran asset check passed.
- [x] flutter analyze passed.
- [x] flutter test passed.
- [x] backend pytest passed.
- [x] release_check passed.
- [ ] Android smoke test passed. *(release APK/AAB not built here: Android SDK missing on this machine)*
- [ ] iOS smoke test passed, if applicable. *(ios --release blocked: CocoaPods not installed)*
- [x] Store materials reviewed.
- [x] Privacy disclosures reviewed.
