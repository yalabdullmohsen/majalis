# تقرير الوحدة ٦ — مشغّل التلاوة المستمر

**الفرع:** `cursor/recitation-player`  
**الوسم:** `safe:ui`  
**التاريخ:** 2026-08-11

## ما نُفّذ

### أ) مشغّل مصغّر ثابت
- شريط سفلي بارتفاع **56px** (`--qmp-h`) فوق شريط التنقّل؛ على المصحف الغمري يستخدم `--inset-bottom` فقط.
- يعرض: اسم القارئ · السورة والآية · تشغيل/إيقاف · سابق/تالٍ · سرعة · شريط تقدّم رفيع · إغلاق يحرّر عبر `stopAndUnload`.
- السحب لأعلى / زر التوسيع يفتح لوحة كاملة؛ السحب لأسفل يطويها — حركة `360ms` مع `--mj-ease-spring`.
- لم يعد يُخفى على مسار `/mushaf`.

### ب) تشغيل مستمر عبر الصفحات
- تشغيل الآية من ورقة الإجراءات يمر عبر `AudioEngine` + `showMiniPlayer`.
- `useMushafRecitationFollow`: عند تغيّر الآية → `ayahKeyToPage` → `goToPage`؛ تمرير إلى `[data-verse]`؛ التمرير يتوقف عند `touchstart`/`wheel` ويُعاد عند استئناف التشغيل.

### ج) وضع الحفظ
- نطاق من–إلى · تكرار ١–٢٠ أو لا نهائي · سرعة 0.75×/1×/1.25× · فاصل صمت.
- حفظ في `majalis-quran-loop-v1` واستئناف عبر المشغّل الموسّع.
- `AudioEngine.setLoopConfig` + `ayah-loop-controller` (Infinity مدعوم).

### تنبيهات تقنية
| تنبيه | الحالة |
|---|---|
| `UIBackgroundModes: audio` | موجود في `ios/App/App/Info.plist` |
| `AVAudioSession` playback | عبر `MajlisPlaybackAudio` / `ensureNativePlaybackAudioSession` |
| MediaSession (شاشة القفل) | `useMediaSession` على المشغّل المصغّر |
| مقاطعة مكالمة / نزع سمّاعة | مستمعو `audioInterruption` + `audioRouteChange` (reason 2) في `AudioEngine` |
| هالة بلا إزاحة أساس | `.mf2-ayah-group--active` خلفية/ظل فقط بلا padding |

## بوابات القياس

| بوابة | نتيجة |
|---|---|
| صوت ٦٠ ثانية والشاشة مقفلة | **معلّق — يلزم جهاز حقيقي** (البُنى التحتية موجودة؛ لم يُقس هنا) |
| تمييز صفر إزاحة لخطوط الأساس | محافظ عليه في CSS (بلا padding على الهالة) — قياس جهاز معلّق |
| صفر تسريب AudioContext عند الإغلاق | الإغلاق يستدعي `stopAndUnload` + `deactivateNativeAudioSession`؛ لا يُنشأ `AudioContext` في هذا المسار (HTMLAudioElement فقط) |
| فتح/إغلاق المشغّل ≥58fps | **معلّق — يلزم ملف تعريف أداء على جهاز**؛ الحركة عبر CSS spring رمزي |
| بوابات المصحف القائمة | لم تُمس خوارزميات التخطيط/الشبكة |

## اختبارات آلية
- `src/lib/__tests__/recitation-player.test.ts`
- تحديث بوابة المرحلة ٥ إن لزم (`cycleMiniPlayerRate` / `quran-mini-player__range` ما زالا موجودين)
