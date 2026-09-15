# جرد نظام إشعارات الأذان (قبل إعادة البناء)

تاريخ الجرد: 2026-09-15 · المنتج: `artifacts/majalis` فقط.

## مكوّنات الجدولة الأصلية (LocalNotifications)

| ملف | الدور |
|---|---|
| `src/lib/prayer-alert-scheduler.ts` | منسّق حي: جدولة أصلية + مؤقّتات الشريط/Live Activity |
| `src/lib/prayer-local-notifications.ts` | محوّل Capacitor LocalNotifications |
| `src/lib/prayer-notification-scheduler.ts` | مصالحة Desired↔Pending + قفل single-flight |
| `src/lib/prayer-notification-ids.ts` | معرفات hash / ودّية / منطقية |
| `src/lib/prayer-notification-service.ts` | واجهة رقيقة (كانت مسارًا مزدوجًا؛ أصبحت فوق المنسّق فقط) |
| `src/lib/adhan-scheduler.ts` | مؤقّتات JS + صوت داخل التطبيق + Notification ويب — **لا يملك** LocalNotifications على الأصل |
| `src/lib/adhan-ios-segments.ts` | مقاطع أذان iOS متتابعة |
| `src/lib/adhan-android-alarm.ts` | AlarmManager أندرويد للأذان الكامل |

## الطبقة الجديدة (`src/lib/prayer-notifications/`)

1. `provider.ts` — PrayerTimesProvider
2. `preferences.ts` — PrayerNotificationPreferences (+ ترحيل محافظ)
3. `scheduler.ts` — PrayerNotificationScheduler (بناء الجدول / منع الماضي)
4. `coordinator.ts` — PrayerNotificationCoordinator (متى ولماذا)
5. `fingerprint.ts` / `legacy-cleanup.ts` — منع التكرار وتنظيف آمن

## مصدر المواقيت

- مكتبة **adhan** محليًا عبر `src/lib/prayer-times.ts`.
- الافتراضي الموثّق: طريقة **Kuwait**، مذهب **Shafi** (`prayer-calc-prefs.ts`).
- لا API شبكة لمسار الجدولة؛ المواقيت التقديرية تُرفض ولا تُجدول.

## المعرفات

- رقمي مستقر: `hashPrayerNotificationId` → `200_000 + …`
- ودّي: `adhan-{prayer}-{date}`
- منطقي: `prayer.{pk}.{date}.entry|pre|post|iqamah`
- **لا تُلغى** معرفات ورد القرآن `9301` ولا الذكر `9401+` (أُزيل إلغاء `9400+idx` الأعمى)

## إشعارات أخرى (خارج النطاق)

- ورد قرآن يومي، تذكير الذكر، قنوات عامة، push للدروس/المحتوى عبر API.
