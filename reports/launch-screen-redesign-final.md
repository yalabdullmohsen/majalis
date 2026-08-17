# إعادة تصميم شاشة التشغيل اليومية — ملغى 2026-08-17

> **ملغى.** `MajlisLaunchScreen` حُذف. الدخولية الحالية SVG صامت في `index.html`. راجع `artifacts/majalis/docs/SPLASH_REPLACEMENT.md`.

تاريخ: 2026-08-16  
الفرع: `feat/majlis-launch-screen`

## الفرق بين Launch Screen و Onboarding

| | Launch Screen | Onboarding |
|---|---|---|
| الغرض | علامة تجارية قصيرة عند كل إقلاع | إعداد أول تشغيل |
| التكرار | كل فتح للتطبيق / إعادة تحميل الصفحة | مرة (أو عند تغيّر إصدار) |
| المحتوى | شعار + اسم + عبارة + مؤشر خفيف | اهتمامات / صلاحيات / شرائح / أزرار |
| الحالة | `isLaunching` | `onboarding-state` / firstLaunch |
| هذا العمل | `MajlisLaunchScreen` فقط | لم يُمس منطق Onboarding |

لا تُستخدم: `onboardingVersion`، `firstLaunch`، أسئلة الاهتمامات، طلب صلاحيات، شرائح، «ابدأ الآن»، «تخطي».

## متى تظهر الشاشة

- عند تركيب `AppShell` بعد إقلاع WebView / تحميل الصفحة.
- في Capacitor عند فتح التطبيق من جديد (تحميل الويب الحي).
- **لا** عند التنقّل الداخلي في الـSPA (الصدفة لا تُعاد تركيبها).

## متى تختفي

1. اكتمال بوابات الجاهزية المحلية (`theme` · `shell` · `auth` محلي · `prayerCache` محلي) **و** مضي ≥ 350ms (دخول الحركة).
2. أو بعد **3 ثوانٍ** كسقف مطلق مع fallback + `console.warn` في التطوير فقط.

سقف الظهور عندما التطبيق جاهز مبكرًا: ≤ **1.2s** (`LAUNCH_READY_CAP_MS`).  
خروج التلاشي: **250ms**.

## منع الشاشة البيضاء

- خلفية `#002b21` في `index.html` و`html/body/#root` وطبقة Launch.
- StatusBar / `theme-color` يُضبطان للون الإقلاع الداكن أثناء الظهور.
- لا `await` لـ Preferences/كاش قبل `createRoot` (بوابة boot السابقة).
- لا اعتماد على صور خارجية أو API داخل الشاشة.

## iOS safe-area و StatusBar

- `min-height: 100dvh` / `100svh` + حشوات عبر `var(--inset-*)` (من `theme.css` → `env(safe-area-inset-*)`).
- الخلفية تغطي الشاشة بالكامل خلف الشريط والمؤشر (`position: fixed; inset: 0`).
- على Capacitor: `setOverlaysWebView(true)` + `Style.Light` + لون `#002b21`.
- أثناء الإطلاق: إخفاء `.navbar-v3` و`.bottom-nav` و`.top-section-bar` عبر `body.mj-launching`، مع `overflow: hidden`.

## الملفات

- `src/components/MajlisLaunchScreen.tsx` (جديد؛ بديل `MajalisLaunchScreen`)
- `src/styles/launch-screen.css`
- `src/lib/launch-intro.ts` (توقيتات)
- `src/lib/launch-readiness.ts` (بوابات محلية)
- `src/App.tsx` (`isLaunching` + `data-launching`)
- اختبارات: `launch-splash-unified` · `launch-intro` · `launch-readiness`

## نتيجة الاختبارات

| فحص | النتيجة |
|---|---|
| `test:launch-splash-unified` | ناجح |
| `test:launch-intro` | ناجح |
| `test:launch-readiness` | ناجح |
| `boot-mount-order-gate` | ناجح |
| `typecheck` (@workspace/majalis) | ناجح |
| `lint` (@workspace/majalis) | ناجح |
| Playwright بصري مخصص لشاشة التشغيل | غير موجود في المستودع — الاعتماد على بوابات الملف/المنطق أعلاه |

تحقق الأجهزة (تصميم/CSS مبني لـ):
- iPhone صغير/كبير: `100dvh` + safe-area insets
- PWA / Safari: خلفية داكنة في HTML + طبقة ثابتة
- Capacitor iOS: StatusBar overlay + Light content على `#002b21`
