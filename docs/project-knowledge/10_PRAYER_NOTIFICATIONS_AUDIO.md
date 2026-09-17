# 10 — الصلاة والإشعارات والصوت

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`

## مواقيت الصلاة

| بند | تفاصيل | ملف |
|---|---|---|
| المحرك | adhan-js عبر `computePrayerTimesForDate` | `src/lib/prayer-times.ts` |
| الطريقة الافتراضية | Kuwait (قابلة للتغيير) | `prayer-calc-prefs.ts` |
| الموقع | gps / city / kuwait | `prayer-location-prefs.ts` |
| كاش | `majalis-prayer-cache-v2` | prayer-times.ts |
| DB اختياري | `getPrayerTimesFromDb` | supabase.ts |
| UI | PrayerTimesView, AdhanSettingsView | pages/worship |

**لا تُجدول مواقيت تقديرية غير موثوقة** كإشعارات أصلية — مذكور في rebuild inventory.

## تشخيص مثبت

من `docs/PRAYER_TIME_DIAGNOSIS.md`: تعدد مصادر، انحراف تقويم/جهاز، تأخير تنبيهات، نصوص ثابتة مضللة سابقًا. التحقق على جهاز حقيقي ما زال مطلوبًا — **لا ادّعاء عمل كامل دون اختبار جهاز**.

## إشعارات

| طبقة | الدور | ملفات |
|---|---|---|
| Local Capacitor | صلاة | `prayer-alert-scheduler.ts`, `prayer-local-notifications.ts`, `prayer-notification-ids.ts`, `prayer-notifications/*` |
| Web timers | داخل التطبيق/المتصفح | `adhan-scheduler.ts` — **لا** يملك LocalNotifications |
| Push | بعيد | `pushNotifications.ts`, api-server, `/api` push-subscribe |
| أذونات | iOS/Android/Web مختلفة | native-bootstrap |

IDs: لا تلغِ إشعارات غير صلاة (مثال ورد قرآن/أذكار في inventory).

## جدول أصوات واجهة (أسماء كتالوج — بلا تنزيل)

| الاسم/المعرّف | الملف أو URL | موجود في repo؟ | قابل للتشغيل؟ | Local/remote | ترخيص موثق؟ | Production-ready؟ | Placeholder؟ |
|---|---|---|---|---|---|---|---|
| نغمات كتالوج الإعدادات | عبر `adhan-settings-sound-catalog.ts` | راجع المسارات المشار إليها | Unknown بدون تشغيل جهاز | Mixed | جزئي — LICENSE_RISKS | Partial | silent mode موجود |
| حزم `public/sounds/adhan` | ملفات محلية | نعم إن وُجدت في الشجرة | Unknown جهاز | Local | **Unresolved** (LICENSE_RISKS) | لا تُعلن جاهزة | لا |
| iOS `Sounds/*.caf` | أصلي | نعم في مشروع iOS | Unknown جهاز | Local | راجع CREDITS/LICENSE | Partial | لا |
| remote kill-switch | `public/data/adhan-audio-remote.json` | نعم | يعتمد الشبكة | Remote | حسب المصدر | Partial | — |
| `aqsa-pending` / `levantine-pending` / `turkish-pending` | لا ملف مرخّص | لا | لا | — | لا | لا | **نعم pending** |
| Audio tafsir catalog | فارغ عمدًا | — | لا | — | ينتظر license_ref | لا | فارغ |
| everyayah / mp3quran تلاوات | URL خارجي | لا تُخزَّن كلها | يعتمد الشبكة | Remote | بث مقيّد — قرار بشري | Partial | لا |
| mushafi audioBaseUrl | `''` | — | لا تلاوة مضمّنة | — | — | مرجع فقط | — |

المصادر: `LICENSE_RISKS.md`, `CREDITS.md`, `adhan-*-catalog` files, TASMEE3 inventory.

## Express push API

- `artifacts/api-server`: تسجيل tokens + إرسال Expo؛ تحقق JWT مشرف عبر إعدادات supabase.
- **ليس** مجدول مواقيت الصلاة.
