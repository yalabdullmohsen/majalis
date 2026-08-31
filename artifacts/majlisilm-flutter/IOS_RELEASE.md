# نقل آخر تحديث إلى Xcode — Majlisilm Flutter

## الإصدار الحالي
- **Marketing:** `1.0.0`
- **Build:** `5` (`pubspec.yaml` → `1.0.0+5`)
- **Bundle ID:** `com.majlisilm.majlisilmFlutter`
- **Display name:** سُنّة
- **Min iOS:** 13.0

## ما يشمله هذا التحديث
- صفحة مصحف أصلية بعرض الشاشة الكامل (`UserQuranPageView` + `InteractiveViewer` / `BoxFit.contain`، هامش أمان 3px)
- `NestedScrollView` + `SliverAppBar` floating/snap — إخفاء الهيدر والبحث عند التمرير للأسفل وإظهارهما عند التمرير للأعلى
- `Info.plist`: صلاحيات الميكروفون/التعرف على الكلام + `UIBackgroundModes: audio`
- مشروع `ios/` جاهز لفتحه في Xcode عبر `Runner.xcworkspace`

## الإصدار بنقرة واحدة (مفضّل)

```bash
cd artifacts/majlisilm-flutter
chmod +x release.sh   # مرة واحدة
./release.sh
```

السكربت ينفّذ بالترتيب: `git pull` → `flutter clean` → `pub get` → `pod install` → فتح `Runner.xcworkspace` → زيادة Build Number → Archive/IPA → رفع App Store Connect.

بيانات الرفع (اختر واحدة):
```bash
export ASC_KEY_ID=...
export ASC_ISSUER_ID=...
export ASC_KEY_PATH=/path/to/AuthKey_XXX.p8
# أو:
export APPLE_ID=...
export APP_SPECIFIC_PASSWORD=...
```

تخطي اختياري: `SKIP_UPLOAD=1` / `SKIP_OPEN_XCODE=1` / `DRY_RUN=1`

## على Mac يدوياً (Xcode / CocoaPods)

```bash
cd /path/to/majalis
git pull origin main
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
