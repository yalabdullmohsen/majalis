# الدخولية الموحّدة — أصلي فقط

## القاعدة الحاكمة

**لا طبقة دخولية ويب تحجب المحتوى.** الويب يفتح `#root` فوراً (LCP/CLS غير متأثرين).

## الطبقات

1. **iOS `LaunchScreen.storyboard` + Android `Theme.SplashScreen`**
   - خلفية `#0E1A15` + الشعار + «المجلس العلمي» + سطر تعريفي + مؤشر تقدّم
2. **Capacitor `SplashScreen`** — `launchAutoHide: false`
   - يُخفى برمجياً فقط عبر `src/lib/splash-screen.ts`

## سياسة التوقيت (أصلي)

| ثابت | قيمة |
|---|---|
| minVisible | 900ms |
| maxVisible | 1500ms |
| fadeOut | 250ms |

- **«التطبيق جاهز»** = حدث `app:first-paint` (يُطلَق من `main.tsx` بعد أول rAF×2)
- **جلسة واحدة** — `sessionStorage mj.native-splash.session.v1`
- **لا عودة** من الخلفية أو التنقل الداخلي

## Service Worker (ويب/PWA)

- كاش: `majlisilm-v{BUILD_SHA}-offline|data|meta`
- `index.html` / navigations: network-first — لا cache-first
- `activate`: يحذف كل الكاشات خارج البادئة الحالية
- إعادة تحميل واحدة عند `SW_UPDATED_RELOAD_ONCE`

## البوابات

```bash
pnpm run test:launch-splash-unified   # static + splash-timing-gate
pnpm run test:flash-gates             # Playwright post-build
pnpm run test:feature-tour-gate       # جولة المزايا
```

## جولة المزايا

- **منفَّذة** — `AppFeatureTour` + `onboarding.completed.v1` في Preferences
- سبع شرائح · إذن الإشعارات في الأخيرة · «جولة المزايا» في الإعدادات
