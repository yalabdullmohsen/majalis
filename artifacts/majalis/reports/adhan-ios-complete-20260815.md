# تقرير إكمال نظام الأذان iOS — 2026-08-15 (تحديث)

## الخلاصة

أذان كامل داخل التطبيق، إشعار قصير عند الإغلاق، أذان متتابع تجريبي بفاصل ٢٩ث، بلا وعود Critical Alerts.

## ما تم

| بند | الحالة |
|---|---|
| `adhan-audio-service.ts` | تشغيل/إيقاف/اختبار/probe |
| `public/audio/adhan/*-full.mp3` | جودة حقيقية (~128kbps) |
| `adhan-short-*.caf` + `adhan-seq-makkah-0N.caf` | في Bundle Resources |
| Android `adhan_seq_makkah_0N.mp3` | مضافة |
| جدولة المتتابع | ٠ / ٢٩ / ٥٨ / ٨٧ ثانية |
| تجاوز الصامت | Disabled + «يتطلب موافقة Critical Alerts من Apple» |
| أزرار الاختبار | كامل / إشعار ١٥ث / متتابع |
| سجلات `[adhan-schedule]` | prayerName, prayerTime, mode, soundName, notificationId, segmentIndex |

## مسار Xcode

افتح `artifacts/majalis/ios/App/App.xcodeproj` (لا يوجد `App.xcworkspace` منفصل).  
Background Modes → Audio مفعّل في Info.plist.

## التحقق المحلي

typecheck / lint / build / اختبارات adhan / `npx cap sync ios`

## يدوي على الجهاز

Archive → TestFlight: كامل، ١٥ث، متتابع، مفتوح/خلفية/مغلق، صامت ON/OFF، Focus ON/OFF.
