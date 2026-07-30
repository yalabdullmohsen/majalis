# حالة بوابات البناء على macOS — المرحلة P1 iOS Release Readiness

## البيئة الحالية للوكيل

- نظام التشغيل: Linux (Cloud Agent)
- `xcodebuild` / `xcrun simctl` / Xcode: **غير متوفرة**
- لا يوجد self-hosted Mac worker مسجّل لهذا المستودع في هذه الجلسة

لذلك نتائج الأوامر التالية في هذه الجلسة: **لم تُنفَّذ (محظورة بيئيًا)**.

## أوامر يجب تشغيلها على macOS فعلي (بنفس Signing الحالي — بلا تغيير)

```bash
cd artifacts/majalis
corepack enable
pnpm install --frozen-lockfile
pnpm run build
pnpm exec cap sync ios

cd ios/App
xcodebuild -version
xcodebuild -list -project App.xcodeproj
xcrun simctl list devices available

# اختر UDID لجهاز Simulator متاح ثم:
xcodebuild \
  -project App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,id=<UDID>" \
  clean build

# XCTest: لا يوجد Test Target حاليًا في project.pbxproj
# (Native targets: App + PrayerLiveActivityExtension فقط)
# إن أُضيف لاحقًا:
xcodebuild \
  -project App.xcodeproj \
  -scheme App \
  -destination "platform=iOS Simulator,id=<UDID>" \
  test \
  -resultBundlePath build/TestResults.xcresult

xcodebuild \
  -project App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination "generic/platform=iOS" \
  CODE_SIGNING_ALLOWED=NO \
  clean build

# Archive بإعدادات Signing الحالية فقط — لا تغيّر Team/Bundle/Profiles
xcodebuild \
  -project App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath build/App.xcarchive \
  archive
```

## ما يُغطّى على Linux CI بدلًا من Xcode

- `pnpm --filter @workspace/majalis run test` يتضمن:
  - `scripts/test-ios-capacitor-gates.mjs` (بوابات ثابتة لـ Info.plist / Privacy / Speech / Audio / Deep Links / Bundle ID)
  - `src/lib/__tests__/ios-stability-audit.test.ts`
