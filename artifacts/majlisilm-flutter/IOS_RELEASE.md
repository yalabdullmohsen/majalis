# نقل آخر تحديث إلى Xcode — Majlisilm Flutter

## الإصدار الحالي
- **Marketing:** `1.0.0`
- **Build:** `4` (`pubspec.yaml` → `1.0.0+4`)
- **Bundle ID:** `com.majlisilm.majlisilmFlutter`
- **Display name:** المجلس العلمي
- **Min iOS:** 13.0

## ما يشمله هذا التحديث
- إصلاح علامات تعارض git التي تسربت إلى `main` في ملفات Flutter
- الإبقاء على hide-on-scroll (`SliverAppBar` floating + snap)
- `Info.plist`: صلاحيات الميكروفون/التعرف على الكلام + `UIBackgroundModes: audio`
- مشروع `ios/` جاهز لفتحه في Xcode عبر `Runner.xcworkspace`

## على Mac فقط (Xcode / CocoaPods)

```bash
cd /path/to/majalis
git pull origin main   # بعد دمج PR المزامنة
cd artifacts/majlisilm-flutter

flutter clean
flutter pub get
cd ios && pod install && cd ..

# افتح Xcode (مهم: .xcworkspace وليس .xcodeproj)
open ios/Runner.xcworkspace
```

### أو بناء IPA مباشرة
```bash
cd artifacts/majlisilm-flutter
flutter build ipa
# ثم: open build/ios/archive/Runner.xcarchive
```

## داخل Xcode — 3 خطوات
1. أعلى النافذة: **Any iOS Device (arm64)** (ليس محاكيًا إن أردت Archive)
2. **Product → Archive**
3. Organizer → **Distribute App** → App Store Connect → Upload

## توقيع
- اختر Team في Signing & Capabilities لهدف Runner
- تأكد أن Bundle Identifier يطابق App Store Connect

## ما لا يعمل على Linux CI
| الأمر | السبب |
|---|---|
| `pod install` | يحتاج macOS + CocoaPods |
| `flutter build ipa` | يحتاج Xcode على macOS |

## تحقق سريع قبل الأرشفة
```bash
flutter test
grep -E 'NSMicrophone|UIBackgroundModes|المجلس' ios/Runner/Info.plist
grep 'version:' pubspec.yaml   # يجب 1.0.0+4
```
