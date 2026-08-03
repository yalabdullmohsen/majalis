# Final Technical Review

## Startup

- [x] التطبيق مصمم ليفتح بدون إنترنت للميزات المحلية. *(local repositories / assets)*
- [x] التطبيق يعمل بدون خادم افتراضياً. *(ASR defaults + fallback)*
- [x] reset local data لا يمنع إعادة التشغيل. *(reset service scoped to Tasmee3)*
- [x] Onboarding موجود ومختبر widget.
- [x] Dashboard موجود ومختبر widget.

## Tasmee3

- [x] اختيار النطاق موجود في التدفق.
- [x] عرض النص المتوقع موجود.
- [ ] بدء التسميع مختبر على جهاز حقيقي.
- [ ] رفض الميكروفون مختبر على جهاز حقيقي.
- [x] مسار التحليل/النتيجة موجود في الكود والاختبارات المنطقية.
- [x] إعادة التسميع مدعومة في التدفق.

## Local Features

- [x] SRS موجود ومختبر.
- [x] السجل محلي.
- [x] الأهداف محلية.
- [x] التذكيرات محلية.
- [x] PDF يُنشأ محلياً ومختبر.
- [x] الدعم موجود.
- [x] الإبلاغ عن مشكلة موجود (نسخ محلي فقط).

## ASR

- [x] fallback `speech_to_text` موجود.
- [x] HTTP ASR اختياري ويتطلب موافقة رفع.
- [x] WebSocket اختياري وغير مفعل افتراضياً.
- [x] PCM اختياري وغير مفعل افتراضياً.
- [x] كل الميزات التجريبية غير مفعلة افتراضياً.

## Reset

- [x] Reset local data موجود مع تأكيد.
- [x] Reset لا يحذف ملف القرآن (asset).
- [x] Invalidate providers بعد reset لتجنب حالة stale.

## Non-blocking note

- يوجد TODO في `live_asr_websocket_recognizer.dart` عن PCM للإنتاج؛ الميزة تجريبية ومعطّلة افتراضياً وليست شرطاً للإطلاق.
