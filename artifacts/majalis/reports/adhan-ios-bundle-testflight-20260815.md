# iOS Adhan sounds — مسار المشروع وTestFlight

تاريخ: 2026-08-15  
فرع: `fix/adhan-audio-testflight` (PR #1152)

## 1) مسار iOS الصحيح (Capacitor / Majlisilm)

| نوع | المسار |
|-----|--------|
| **لا يوجد** | `ios/App/App.xcworkspace` في جذر التطبيق |
| **Xcode project** | `artifacts/majalis/ios/App/App.xcodeproj` |
| workspace مضمّن | `artifacts/majalis/ios/App/App.xcodeproj/project.xcworkspace` |
| `project.pbxproj` | `artifacts/majalis/ios/App/App.xcodeproj/project.pbxproj` |
| مصادر App | `artifacts/majalis/ios/App/App/` |

مشاريع أخرى في الريبو (ليست مسار الأذان/Capacitor الرئيسي):
- `artifacts/mushafi/ios/Runner.xcworkspace` (Flutter)
- `artifacts/majlisilm-flutter/ios/Runner.xcworkspace` (Flutter)

الفتح:
```bash
cd artifacts/majalis
npx cap open ios
# أو: open ios/App/App.xcodeproj
```

## 2) أصوات الأذان القصيرة

أُنشئت عبر `afconvert` من `public/audio/adhan/*.mp3` (مقطع 10ث، IMA4 CAF):

- `adhan-short-makkah.caf`
- `adhan-short-madinah.caf`
- `adhan-short-egypt.caf`
- `adhan-short-aqsa.caf`
- `adhan-short-takbeerat.caf`

موجودة في:
- `ios/App/App/Sounds/` (مصدر)
- `ios/App/App/*.caf` (جذر Bundle لنسخ Xcode)
- Copy Bundle Resources في `project.pbxproj` ✓

كود الإشعار يستخدم **اسم الملف فقط** (`adhan-short-makkah.caf`) — بلا `/sounds/adhan/`.

بوابة: `node scripts/test-adhan-ios-bundle-sounds.mjs`

`UIBackgroundModes` يتضمن `audio` في `Info.plist`.

## 3) ما نُفّذ من الوكيل

- [x] تحديد المسارات
- [x] توليد CAF + تسجيل Resources
- [x] `pnpm build`
- [x] `npx cap sync ios`
- [x] `npx cap open ios` (يفتح Xcode)

## 4) ما يجب تنفيذه على جهازك (توقيع Apple)

لا يمكن للوكيل تشغيل iPhone حقيقي أو رفع TestFlight بدون حساب المطوّر.

1. في Xcode على `App.xcodeproj`: Signing & Capabilities → Background Modes → **Audio** مفعّل
2. Product → Clean Build Folder
3. شغّل على iPhone حقيقي
4. إعدادات الأذان → **اختبار الصوت** (أذان كامل داخل التطبيق)
5. **اختبار إشعار بعد 15 ثانية** (اقفل الشاشة / أنهِ التطبيق)
6. Product → Archive → Distribute App → TestFlight

### Checklist جهاز

| سيناريو | المتوقع |
|---------|---------|
| app open | أذان كامل |
| background بعد بدء التشغيل | استمرار (Audio session) |
| screen locked بعد البدء | استمرار |
| app killed | صوت إشعار ≤30ث فقط |
| silent / Focus on | قد يُكتم — **لا تجاوز بدون Critical Alerts** |

## Critical Alerts

**غير مطلوب** للوظيفة الأساسية. مطلوب فقط لتجاوز الصامت/Focus بعد موافقة Apple.
