# تقرير ترقية تطبيق Capacitor / iOS — Majlisilm

**التاريخ:** 2026-08-16  
**الفرع:** `improve/mobile-capacitor-app-ux`

## ما تم تحسينه للتطبيق

| مجال | التغيير |
|---|---|
| احتواء الروابط | `installInAppNavigationGuard` — داخلي عبر router، خارجي عبر Browser + تأكيد |
| التخزين | `native-storage` + `@capacitor/preferences` مع fallback لـ localStorage |
| اللمسات | `haptics.ts` يمرّ عبر Capacitor Haptics (الأذكار/العداد) |
| AppShell | `isNativeApp` + `data-native-app` + خلفية غير بيضاء |
| الإشعارات | تسميات: تنبيهات الصلاة · ورد اليوم · تذكير الأذكار (`adhkarReminder`) — بلا طلب إذن عند الإطلاق |
| الدروس | مشاركة · تقويم (Share/ICS) · خرائط/بث عبر Browser |
| سين جيم | أفضل نتيجة محفوظة + haptic موجود |
| المصحف | اختيار الآية محلي (بدون تغيير route) — كما هو، مع مزامنة آخر صفحة |

## ما تم تحسينه للويب

- نفس مسارات التخزين تعمل عبر localStorage دون Preferences.
- روابط الدروس أصبحت أزرارًا (تعمل على الويب بـ `window.open` عبر `openExternalUrl`).
- لا تغييرات تكسر RTL أو مسارات `/mushaf`.

## حالة safe-area

- المصدر: `theme.css` → `--inset-*` من `env(safe-area-inset-*)`
- `capacitor-native-ux.css` يربط aliases
- `contentInset: never` في Capacitor لتجنّب حشو مزدوج

## حالة status bar

- `overlaysWebView: true`
- لون الإقلاع `#F2F4F3` (ليس أبيض)
- المزامنة عبر `apply-page-chrome` / `PageChromeSync`

## حالة التنقل الداخلي

- حارس نقرات على الأصلي فقط
- Deep links موجودة مسبقًا عبر `appUrlOpen`

## حالة التخزين المحلي

- Preferences عند الأصلي + LS متزامن
- مفاتيح: مصحف، متابعة، ورد، أذكار، سين جيم، تفضيلات إشعارات

## حالة الإشعارات

- لا PushPrompt على الأصلي
- التفعيل من `/notification-settings` فقط
- `adhkarReminder` منفصل عن `resumeReminder`

## هل يحتاج رفع TestFlight؟

**نعم — إذا أردت تجربة Preferences/Browser/Haptics داخل البناء الأصلي.**  
النشر على `majlisilm.com` يكفي لتحديث المحتوى داخل الـ remote shell الحالي، لكن إضافة `@capacitor/preferences` تتطلب `npx cap sync ios` ثم build جديد لـ TestFlight حتى يظهر الـ plugin في الـ binary.

## نتائج الأوامر

| أمر | النتيجة |
|---|---|
| `audit:mobile-app` | ✅ P0=0 |
| `audit:product-upgrade` | ✅ |
| `typecheck` / `lint` / `build` | تُسجَّل بعد التشغيل في الجلسة |
| `npx cap sync ios` | يُنفَّذ إن توفّر Xcode/CocoaPods |

## ملفات رئيسية

- `src/lib/native-storage.ts`
- `src/lib/in-app-navigation.ts`
- `src/lib/haptics.ts`
- `src/lib/capacitor-utils.ts`
- `scripts/audit-mobile-app-readiness.ts`
- `scripts/audit-product-upgrade.ts`
