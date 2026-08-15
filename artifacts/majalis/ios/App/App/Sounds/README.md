# أصوات إشعار الأذان (iOS)

ملفات CAF قصيرة (≤30 ثانية).

- **المصدر في المستودع:** `ios/App/App/Sounds/`
- **روابط صلبة في جذر App** لنسخها إلى **جذر App Bundle** (مطلوب لـ `UNNotificationSound`)

يجب أن تظهر في Copy Bundle Resources (PBXResourcesBuildPhase).

## الأسماء المعتمدة (2026-08)

| ملف | المؤذن / الأسلوب |
|-----|------------------|
| `adhan-short-makkah.caf` | أذان مكة |
| `adhan-short-madinah.caf` | أذان المدينة |
| `adhan-short-egypt.caf` | أذان مصري |
| `adhan-short-aqsa.caf` | أذان الأقصى |
| `adhan-short-takbeerat.caf` | تكبيرات فقط |

أسماء التوافق القديمة (`prayer_makkah.caf` …) تبقى في الحزمة.

في كود Capacitor Local Notifications مرّر الاسم **بدون** مسار مجلد، مع امتداد `.caf`.

الأذان الكامل داخل التطبيق: `public/audio/adhan/adhan-*-full.mp3` (تشغيل عبر AudioService / AVAudioSession playback).
