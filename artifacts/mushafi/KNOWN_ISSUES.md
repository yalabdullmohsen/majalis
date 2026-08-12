# Known Issues

## v1.0.0+1

### Live WebSocket / PCM

ميزات WebSocket و Native PCM Streaming تجريبية وغير مفعلة افتراضيا.

الحل:

- استخدم تعرف الجهاز أو محرك الخادم العادي.
- فعّل WebSocket/PCM فقط للاختبار المتقدم.

### PDF Arabic Fonts

إذا لم تتم إضافة خطوط عربية صحيحة إلى assets، قد لا يظهر PDF العربي بشكل مثالي.

الحل:

- أضف:
  - assets/fonts/NotoNaskhArabic-Regular.ttf
  - assets/fonts/NotoNaskhArabic-Bold.ttf

### Speech Recognition Accuracy

الدقة تعتمد على جودة الصوت ومحرك التعرف المتاح.

الحل:

- استخدم نطاقا قصيرا.
- اقرأ في مكان هادئ.
- اقترب من الميكروفون.

### iOS PCM Streaming

قد يحتاج iOS إلى اختبار على جهاز حقيقي، وقد يستخدم fallback إذا PCM غير متاح.

الحل:

- عطّل Native PCM Streaming.
- استخدم fallback أو HTTP ASR.
