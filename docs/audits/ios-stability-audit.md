# تدقيق استقرار iOS — المجلس العلمي (Capacitor)

**الفرع:** `cursor/fix-ios-comprehensive-stability-audit-1f54`  
**التاريخ:** 2026-07-29  
**بيئة الوكيل:** Linux (بدون Xcode / Simulator) — بناء Archive/Debug/Release على الجهاز يتطلب macOS.

## 1. اكتشاف البنية

| العنصر | النتيجة |
|---|---|
| نوع التطبيق | **Hybrid Capacitor 8** يغلّف مخرجات Vite (`webDir: dist`) داخل `WKWebView` عبر `CAPBridgeViewController` |
| ليس | تطبيق SwiftUI أصلي منفصل للإنتاج |
| مسار Xcode | `artifacts/majalis/ios/App/App.xcodeproj` |
| Workspace / Pods | لا CocoaPods — Swift Package محلي `CapApp-SPM` |
| Bundle ID | `com.yousef.majlisilm` (لم يُغيَّر) |
| Extension | `PrayerLiveActivity` — Live Activities |
| Plugins مخصصة | Speech، RecitationAudioCapture، PrayerLiveActivity، **MajlisPlaybackAudio** (جديد) |
| نقطة الدخول | `AppDelegate` → Storyboard → Capacitor bridge → `src/main.tsx` |
| بدائل موجودة (غير مسار TestFlight الحالي) | Expo `majalis-mobile`، Flutter تراثي |

## 2. مشاكل حرجة / مرتفعة أُصلحت

| # | الدرجة | المشكلة | الجذر | الإصلاح | دليل |
|---|---|---|---|---|---|
| 1 | حرج | روابط Live Activity `majlisilm://` لا تُفتح داخل التطبيق | لا `CFBundleURLTypes` + `appUrlOpen` يأخذ `pathname` فقط (فارغ للمخطط المخصص) | تسجيل مخطط `majlisilm` + `resolveNativeDeepLinkPath` + widgetURL → `https://majlisilm.com/prayer-times` | `test:ios-stability` + `test:ios-gates` |
| 2 | مرتفع | `PrivacyInfo.xcprivacy` غير مضمّن في Resources | ملف موجود بلا FileRef/Build phase | إضافته إلى `project.pbxproj` | `test:ios-gates` |
| 3 | مرتفع | تعارض Deployment Target 15.0 مقابل 16.2 للامتداد/SPM | إعدادات مشروع قديمة | توحيد App/Project على **16.2** | `test:ios-gates` |
| 4 | مرتفع | صوت الخلفية معلن في plist بلا جلسة `.playback` | HTMLAudio في WKWebView يحتاج AVAudioSession | `MajlisPlaybackAudioPlugin` + استدعاء من AudioEngine/main | بوابة مصادر + مراجعة كود |
| 5 | متوسط | شريط الصلاة يعرض «التالي» أثناء فترة ما بعد الأذان | HeaderTicker يتجاهل `sinceHms` | عرض «مضى على الأذان» + تكتّك تكيّفي | مراجعة `HeaderTicker` + وحدة prayer-ticker |
| 6 | متوسط | مؤقت صلاة كل ثانية دائمًا | `setInterval(1000)` | 1s فقط في نافذة 15/35 دقيقة وإلا 30s + تحديث عند العودة من الخلفية | `usePrayerCountdown` |
| 7 | متوسط | تباين إجابات الاختبارات في الوضع الليلي | `.sq-answer-label` بلا override داكن | ألوان دلالية في `section-quiz.css` | مراجعة CSS |
| 8 | متوسط | قائمة «المزيد» قد تفقد تباين النص نهارًا | رموز/وراثة متضاربة | قواعد صريحة light/dark في `more-bottom-sheet.css` | مراجعة CSS |

## 3. ما لم يُنفَّذ هنا (قيود البيئة)

| البند | السبب | يمنع الدمج؟ |
|---|---|---|
| `xcodebuild` Debug/Release/Archive | لا Xcode على Linux | **لا** — يُشغَّل على Mac قبل TestFlight |
| UI Tests على Simulator | لا Simulator | لا — يُكمَل يدويًا / macOS CI لاحقًا |
| Instruments (Leaks/Time Profiler) | يتطلب جهازًا | لا |
| نشر TestFlight | ممنوع صراحة في المهمة | — |
| دمج إلى main | ممنوع | — |

## 4. الأمن

- ATS: `NSAllowsArbitraryLoads=false`
- لا Service Role في هدف العميل (بوابة مسح نصي)
- الجلسة عبر Supabase JS `persistSession` / `autoRefreshToken` (localStorage داخل WebView — سلوك Capacitor القياسي؛ Keychain أصلي خارج نطاق هذا الـhybrid shell)
- Privacy Manifest مضمّن في الحزمة الآن

## 5. أوامر التحقق (Linux)

```bash
pnpm --filter @workspace/majalis run test:ios-gates
pnpm --filter @workspace/majalis run test:ios-stability
pnpm --filter @workspace/majalis run typecheck
```

## 6. أوامر التحقق (macOS — يدوي قبل TestFlight)

```bash
cd artifacts/majalis
pnpm exec cap sync ios
cd ios/App
xcodebuild -list
xcodebuild -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 16' build
xcodebuild -scheme App -configuration Release -destination 'generic/platform=iOS' archive -archivePath /tmp/Majlis.xcarchive
```

## 7. Rollback

إعادة الفرع أو `git revert` لسلسلة commits الخاصة بـiOS على هذا الفرع فقط — لا يمس main حتى الدمج اليدوي عبر workflow النشر.
