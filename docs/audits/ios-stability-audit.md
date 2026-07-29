# تدقيق استقرار iOS — المجلس العلمي (Capacitor)

**الفرع:** `cursor/fix-ios-comprehensive-stability-audit-1f54`  
**PR:** [#617](https://github.com/yalabdullmohsen/majalis/pull/617) (Draft — NO-AUTO-MERGE)  
**آخر تحديث:** 2026-07-29  
**بيئة الوكيل:** Linux (بدون Xcode / Simulator)

## 1. اكتشاف البنية

| العنصر | النتيجة |
|---|---|
| نوع التطبيق | **Hybrid Capacitor 8.4.1** — Vite `webDir: dist` داخل WKWebView |
| مشروع Xcode | `artifacts/majalis/ios/App/App.xcodeproj` |
| Workspace الفعلي | `App.xcodeproj/project.xcworkspace` (داخلي لـ SPM؛ أوامر `xcodebuild` تستخدم **`-project App.xcodeproj`**) |
| Scheme | **`App`** (target `App` + extension `PrayerLiveActivityExtension`) |
| CocoaPods | لا — Swift Package `CapApp-SPM` |
| Bundle ID | `com.yousef.majlisilm` (لم يُغيَّر) |
| Team | `5D8TX37HTS` (لم يُغيَّر) |
| Deployment Target | **16.2** (App + Extension + Project متسقة) |
| نقطة الدخول | `AppDelegate` → Storyboard → Capacitor → `src/main.tsx` |

## 2. ما تم التحقق منه على Linux (نتائج فعلية)

| الفحص | الأمر | النتيجة |
|---|---|---|
| تثبيت | `pnpm install --frozen-lockfile` | نجح |
| Typecheck | `pnpm --filter @workspace/majalis run typecheck` | نجح |
| Lint | `pnpm --filter @workspace/majalis run lint` | نجح (0 errors) |
| iOS static gates | `pnpm --filter @workspace/majalis run test:ios-gates` | نجح |
| iOS unit tests | `pnpm --filter @workspace/majalis run test:ios-stability` | **35/35** نجح |
| Build + CSS budget | `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build` | نجح |
| حجم CSS الحرج | `index-*.css` | **503965 بايت** (حد 505000، هامش **1035** بايت ≥ 1KB) |
| تحذير SectionAccordion sourcemap | بعد إزالة `"use client"` غير المستخدم في Vite | **اختفى** من سجل البناء |

## 3. ما لم يُشغَّل (macOS مطلوب)

| الفحص | الحالة |
|---|---|
| `xcodebuild` Debug Simulator | **لم يُنفَّذ** — لا Xcode على Linux |
| `xcodebuild` Release generic iOS | **لم يُنفَّذ** |
| `xcodebuild archive` | **لم يُنفَّذ** |
| UI Tests / Instruments | **لم يُنفَّذ** |
| TestFlight | **لم يُنشر** (مقصود) |

> لا يُدّعى نجاح Debug/Release/Archive دون تشغيل `xcodebuild` فعلي على macOS.

## 4. إصلاحات هذه الجولة (بعد #617 الأولي)

1. **CSS:** تقليص تكرار more-sheet / final-release / section-quiz دون رفع الميزانية؛ الحفاظ على تباين نهاري/ليلي.
2. **الصوت:** لا تفعيل `AVAudioSession` عند الإقلاع؛ تفعيل `.playback` فقط قبل `play()`؛ `enableRecording` قبل التعرف الصوتي؛ `deactivate` عند التوقف؛ observers للانقطاع وتغيّر المسار؛ بلا `try?`.
3. **الروابط:** رفض hosts غير `majlisilm.com` / `www.majlisilm.com`.
4. **بوابات/اختبارات:** تغطية scheme، universal link، رفض خارجي، PrivacyInfo، plugin، deployment، حالات شريط الصلاة (قبل 15 / آخر 15 / بعد أذان 35 / بعد 35 / منتصف الليل).
5. **pbxproj:** مراجعة يدوية — UUID 24-hex، PrivacyInfo مرة واحدة في Resources، Plugin مرة واحدة في Sources لهدف App، Capacitor `CAPBridgedPlugin` اكتشاف تلقائي (لا تسجيل يدوي في AppDelegate).

## 5. Required macOS verification before merge

من مجلد المشروع:

```bash
cd artifacts/majalis
pnpm exec cap sync ios
cd ios/App

# Debug — Simulator
xcodebuild \
  -project App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  clean build

# Release — generic device
xcodebuild \
  -project App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  clean build

# Archive
xcodebuild \
  -project App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/Majalis.xcarchive \
  archive
```

ملاحظة: لا يوجد `.xcworkspace` منفصل خارج `App.xcodeproj`؛ الأوامر تستخدم `-project App.xcodeproj` و`-scheme App` كما في المشروع الفعلي.

## 6. السياسة

- Draft PR — **لا Auto-merge** / **لا دمج إلى main** من هذه الجلسة  
- عنوان PR يتضمن `NO-AUTO-MERGE`  
- الدمج لاحقًا عبر مراجعة يدوية فقط
