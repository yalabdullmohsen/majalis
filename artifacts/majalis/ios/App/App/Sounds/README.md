# أصوات إشعارات الصلاة (iOS)

الملفات التالية مضمّنة في الحزمة ومُضافة إلى Xcode → Copy Bundle Resources:

| الملف | الاستخدام |
|---|---|
| `prayer_quiet.caf` | تنبيه قبل الصلاة (هادئ / قصير) |
| `prayer_clear.caf` | دخول وقت الصلاة (أوضح) |
| `prayer_soft.caf` | تذكير خفيف بعد الصلاة |
| `prayer_makkah.caf` / `prayer_madinah.caf` / … | أنماط أذان قصيرة حسب التسجيل |
| `prayer_default.caf` / `prayer_takbeerat.caf` | تنبيه تكبيرات |

العلم في المصدر:

`PRAYER_CUSTOM_SOUNDS_ENABLED = true`

في `src/lib/prayer-notification-sounds.ts`.

## حدود iOS

- صوت الإشعار ≤ ≈٣٠ ثانية؛ الملفات هنا ~٧–٨ث.
- **لا يوجد أذان كامل موثوق عند إغلاق التطبيق** بدون مقاطع مرخّصة متعددة في الحزمة.
- البديل الرسمي الحالي: إشعار قصير مخصّص + فتح التطبيق لتشغيل الأذان الكامل (HTMLAudio).
- `ADHAN_IOS_MULTI_SEGMENT_BUNDLED = false` حتى تُضاف مقاطع `adhan_*_gen_sN.caf`.

## مقاطع الأذان الكامل (مستقبلاً)

| الملف | المعنى |
|---|---|
| `adhan_<id>_gen_s1.caf` … `_s4.caf` | أذان عام، حتى ٤ مقاطع ≤٢٨ث |
| `adhan_<id>_fajr_s1.caf` … `_s4.caf` | أذان فجر بالتثويب فقط |

بعد إضافتها: فعّل `ADHAN_IOS_MULTI_SEGMENT_BUNDLED = true`.
