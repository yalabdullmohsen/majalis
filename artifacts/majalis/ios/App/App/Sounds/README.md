# أصوات إشعارات الصلاة (iOS)

ضع الملفات التالية هنا ثم أضِفها إلى Xcode target → Build Phases → Copy Bundle Resources:

| الملف | الاستخدام |
|---|---|
| `prayer_quiet.caf` | تنبيه قبل الصلاة (هادئ) |
| `prayer_clear.caf` | دخول وقت الصلاة (أوضح) |
| `prayer_soft.caf` | تذكير خفيف بعد الصلاة |

بعد إضافة الملفات فعّل العلم في المصدر:

`PRAYER_CUSTOM_SOUNDS_ENABLED = true`

في `src/lib/prayer-notification-sounds.ts`.

بدون الملفات يبقى التطبيق على صوت النظام (`default`) ولا ينكسر البناء.
