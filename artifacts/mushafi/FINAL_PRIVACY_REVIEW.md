# Final Privacy Review

## Audio

- [x] الميكروفون يستخدم فقط عند بدء جلسة التسميع. *(verified by design in Tasmee3 session flow)*
- [x] لا يوجد تسجيل في الخلفية. *(no background recording service)*
- [x] لا يتم إرسال الصوت للخادم افتراضيا. *(allowServerAudioUpload = false)*
- [x] المستخدم يستطيع تعطيل الخادم المتقدم.
- [x] المستخدم يرى تنبيه الخصوصية قبل التسجيل.

## Diagnostics

- [x] التشخيص محلي فقط.
- [x] التشخيص ينسخ للحافظة فقط.
- [x] لا يرسل التشخيص تلقائيا.
- [x] لا يحتوي التشخيص على API key. *(redacted + tests)*
- [x] لا يحتوي التشخيص على صوت.
- [x] لا يحتوي التشخيص على نص القرآن.

## Storage

- [x] سجل التسميع محلي.
- [x] الأهداف محلية.
- [x] التذكيرات محلية.
- [x] SRS محلي.
- [x] PDF ينشأ محليا.
- [x] API key يخزن في secure storage عند توفره.

## Server

- [x] الخادم اختياري.
- [x] HTTPS مطلوب في الإنتاج. *(documented for production ASR)*
- [x] API key مطلوب في الإنتاج عند تفعيل الخادم.
- [x] الخادم لا يحفظ الصوت بشكل دائم. *(server design / docs)*
- [x] الملفات المؤقتة تحذف. *(server design / docs)*
- [x] logs لا تحتوي API key أو audio. *(server design / docs)*

## Store Disclosure

- [x] Google Play Data Safety draft متوافق مع السلوك الفعلي.
- [x] App Store Privacy draft متوافق مع السلوك الفعلي.
- [ ] Privacy policy URL جاهز ومستضاف علناً. *(draft موجود؛ الاستضافة العامة مطلوبة قبل الرفع)*
