# تشخيص نظام الأذان والإشعارات

تاريخ الفحص: 2026-08-16  
الفرع: `fix/adhan-audio-notifications-root`

## نوع المشروع

- **ويب أساسي:** Vite + React (`artifacts/majalis`)
- **التغليف للمتاجر:** Capacitor 8 → iOS + Android
- **ليس:** React Native / Expo (مسار المتجر) / Flutter

## أماكن الكود

| الدور | المسار |
|------|--------|
| صفحة إعدادات الأذان | `src/pages/worship/ui/AdhanSettingsView.tsx` |
| تشغيل HTMLAudio | `src/lib/adhan-playback.ts` |
| خدمة مركزية In-App | `src/lib/adhan-audio-service.ts` |
| كتالوج المؤذنين | `src/lib/adhan-audio.ts` |
| أصول أوفلاين | `src/lib/adhan-offline-assets.ts` |
| AVAudioSession (iOS) | `ios/App/App/MajlisPlaybackAudioPlugin.swift` + `src/lib/native-playback-audio.ts` |
| إشعارات الصلاة (منفصلة) | `src/lib/prayer-notification-service.ts` → `prayer-local-notifications.ts` |
| تفضيلات | `localStorage` مفتاح `majalis-adhan-prefs-v1` |

## السبب الجذري

ملفات `*-full.mp3` المحلية كانت بمعدل **٨kbps / ١١kHz** (شبه غير مسموعة على iOS WebView). استُبدلت بمقاطع AAC `.m4a` (~٢٨ث، ~٣١–١٣٠kbps).

## APIs المركزية

- `playAdhanPreview(adhanId, playbackMode)` / `stopAdhanPreview()`
- `preloadAdhanSounds()` / `validateAudioAssets()` / `getAudioDiagnostics()`
- `schedulePrayerNotifications` / `cancelPrayerNotifications` / `listScheduledPrayerNotifications`

## فصل المسارات

1. **In-App Audio:** `HTMLAudioElement` + `AVAudioSession.category = .playback` (+ duckOthers)
2. **Local Notification:** CAF قصير في Bundle — لا أذان كامل من إشعار عند قتل التطبيق

## قيود iOS المتبقية

- لا Critical Alerts entitlement → لا تجاوز للصامت / Focus لإشعارات النظام
- الأذان الكامل مضمون داخل التطبيق بعد تفعيل الجلسة؛ الإشعار القصير يخضع لرنين الجهاز
- ميزانية الحجم (<٥٠٠KB/ملف، <٢MB للمجلد) تمنع تضمين أذان كامل طويل عالي الجودة — الكامل الطويل عبر CDN عند الاتصال
