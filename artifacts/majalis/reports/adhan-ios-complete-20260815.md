# تقرير إكمال نظام الأذان iOS — 2026-08-15

## الخلاصة

أُغلق مسار الأذان/الإشعارات بقيود iOS الحقيقية: أذان كامل داخل التطبيق، أصوات CAF قصيرة في Bundle، اختبار ١٥ ثانية، وإزالة وعود Critical Alerts.

## ما تم

| بند | الحالة |
|---|---|
| `adhan-audio-service.ts` | تشغيل/إيقاف/اختبار/probe/جلسة صوت |
| `public/audio/adhan/*-full.mp3` | جودة أعلى (~128kbps حيث توفر) |
| `ios/App/App/Sounds/adhan-short-*.caf` | ٨ث تقريبًا + مسجّلة في pbxproj |
| `adhan-seq-makkah-0N.caf` | ٤ مقاطع × ٢٨ث — تجريبي غير افتراضي |
| تجاوز الصامت | معطّل + بطاقة معلومات (لا Critical Alerts) |
| Live Activity | مخفي إن لم يُدعم الجهاز |
| إعدادات مرتبة | موقع، أذان عام، صوت إشعار، تخصيص صلوات، اختبار، قيود iOS |
| قرّاء التلاوة | موجودون في `quran-audio.ts` (ليس قسم الأذان) |

## التحقق

- typecheck ✓
- lint ✓
- build ✓
- اختبارات adhan (segments/offline/catalog/bundle/settings) ✓
- `npx cap sync ios` نُفّذ

## ما لا يُنجز من الوكيل

- Signing / Archive / رفع TestFlight يحتاج حساب Apple على الجهاز المحلي.
- التحقق السمعي النهائي على iPhone حقيقي.

## P0؟

لا — لا خيارات كاذبة لتجاوز الصامت.
