# PR-1 — سبب جذري: صوت الأذان المختار لا يعمل وقت الصلاة

تاريخ: 2026-09-19 · فرع: `cursor/p0-prayer-notif-pr1-sound-manifest`

## confirmedRootCause

1. **فصل مصادر الحقيقة:** كتالوج الإعدادات يعلن `iosNotificationSound` لكل خيار، لكن `schedulePrayerNativeNotifications` / `safeSound` كان يحل الصوت عبر `muezzinId → pack.notificationSound` أو `soundProfile → quiet|clear|soft` فقط، **دون قراءة اختيار المستخدم المحفوظ** (`majalis_settings_adhan_sound_id` / tone id).

2. **المعاينة ≠ Native:** المعاينة تشغّل ملفات ويب تحت `/audio/adhan/*` بينما إشعار iOS يحتاج اسم CAF داخل Bundle. نجاح المعاينة لا يثبت وصول صوت الإشعار.

3. **تسمية مضللة:** خيار «تنبيه أذان قصير متوافق مع iOS» كان في مجموعة `adhan` (داخل التطبيق) مع `iosNotificationSound: prayer-alert.caf` بينما يوجد `adhan-short-makkah.caf` في الحزمة غير مستخدم لمكة.

4. **حزمة مكة:** `notificationSound` لـ makkah كان `prayer-alert.caf` بدل `adhan-short-makkah.caf`.
5. **حزمة الكويت:** كانت `prayer-alert.caf` بينما الكتالوج يعلن `short-ring.caf` — صُحّحت في نفس PR-1.

## rejectedHypotheses

| # | الفرضية | الحكم |
|---|---------|--------|
| 3 | اسم الملف بحالة أحرف خاطئة | مرفوض للملفات الحالية — الأسماء تطابق Bundle |
| 4 | الملف غير في Copy Bundle Resources | مرفوض — بوابة `adhan-ios-bundle-resources` تمر |
| 5 | الصوت أطول من حد iOS للـ CAF القصيرة المعتمدة | مرفوض للملفات القصيرة المعتمدة |
| 7 | المجدول يستخدم System Sound دائمًا | مرفوض جزئيًا — يمرّر CAF لكن من مسار خاطئ/قديم |
| 9 | تعارض Request IDs (سبب الصوت) | مرفوض كسبب للصوت — IDs مبنية على prayer+date+kind |
| 14 | Simulator كسبب وحيد | مرفوض كسبب الجذر — الخلل منطقي في الحلّ قبل الجهاز |

## inconclusive (PR-2+)

Reschedule يعيد الافتراضي · Pending قديم · Timezone · Focus/Silent mode · أذان كامل كإشعار.

## requiredFix (هذا الـPR)

- `prayer-sound-manifest.ts` عقد الفئات + Manifest.
- `safeSound` يقرأ كتالوج الإعدادات ثم Manifest ثم fallback `default`.
- محاذاة makkah/egypt/aqsa/takbeerat إلى CAF القصيرة الصحيحة.
- بوابة تحقق Bundle + مدة + لا تكرار IDs.

## physicalDeviceValidation (PR-5)

جدولة → قفل الجهاز → سماع CAF المختار · اختبار إشعار تجريبي · Focus/Silent · رفض الإذن.
