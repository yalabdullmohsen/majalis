# AudioEngine — نواة تشغيل التلاوة

خدمة `src/core/audio/AudioEngine.ts` تدير التشغيل عبر **HTML5 Audio** (لا يحجب خيط الواجهة).

## القدرات
- تشغيل/إيقاف/انتقال لآية (مقاطع everyayah أو ملف سورة متصل مع `.sync.json`)
- أحداث `onAyahChange` / `onStateChange` / `onDownloadProgress`
- تكرار: `none` | `ayah` | `surah` | `range`
- وضع معلم/طالب (صمت بعد الآية)
- Prefetch للآيات التالية أثناء التشغيل
- تنزيل سورة أوفلاين مع تتبّع في `offline_assets_store`

## الربط
- `QuranEngineContext.audio` + `playAyah` / `togglePlayAyah` / `seekAudioToAyah` / `setRepeatMode` / `downloadSurahAudio`
- عند اختيار آية أثناء التشغيل: `setActiveVerse` يستدعي `seekToAyah`
- `QuranActionBar` يستدعي واجهات السياق بدل عنصر Audio محلي

## مزامنة اختيارية
`/data/quran/timestamps/{reciter}/{surah}.sync.json`:

```json
{ "ayahs": [{ "ayah": 1, "start": 0, "end": 4.2 }] }
```
