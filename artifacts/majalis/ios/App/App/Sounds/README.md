# أصوات إشعار الأذان (iOS / Capacitor)

## مسار مشروع Xcode الصحيح

لا يوجد `ios/App/App.xcworkspace` مستقل.

| العنصر | المسار |
|--------|--------|
| Xcode project | `artifacts/majalis/ios/App/App.xcodeproj` |
| workspace الداخلي | `artifacts/majalis/ios/App/App.xcodeproj/project.xcworkspace` |
| مصادر التطبيق | `artifacts/majalis/ios/App/App/` |
| أصوات الإشعار (مصدر) | `artifacts/majalis/ios/App/App/Sounds/` |
| نسخ في جذر Bundle | `artifacts/majalis/ios/App/App/*.caf` (روابط صلبة) |

الفتح الصحيح:
```bash
cd artifacts/majalis && npx cap open ios
# أو: open ios/App/App.xcodeproj
```

## ملفات CAF المطلوبة (≤30ث)

- `adhan-short-makkah.caf`
- `adhan-short-madinah.caf`
- `adhan-short-egypt.caf`
- `adhan-short-aqsa.caf`
- `adhan-short-takbeerat.caf`

توليد من `public/audio/adhan/*.mp3` عبر `afconvert` (مقطع ≤10ث، IMA4).

في Local Notifications مرّر **اسم الملف فقط** مثل `adhan-short-makkah.caf` — بلا `/sounds/adhan/` وبلا مسار مجلد.

يجب أن تظهر في **Copy Bundle Resources** (PBXResourcesBuildPhase).

## حدود Apple

- أذان كامل: داخل التطبيق أو استمرار بعد بدء التشغيل + Background Mode Audio.
- التطبيق منتهٍ: صوت إشعار قصير فقط.
- الصامت / Focus: لا تجاوز بدون Critical Alerts entitlement.
