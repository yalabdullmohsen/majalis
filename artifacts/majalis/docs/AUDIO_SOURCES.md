# مصادر الصوت (تلاوة / أذان / تفسير صوتي)

## تلاوة القرآن (Ayah-level) — EveryAyah

| reciterId | القارئ | جودة | reciter_folder |
|---|---|---:|---|
| `husary` | محمود خليل الحصري | 128 | `Husary_128kbps` |
| `minshawi` | محمد صديق المنشاوي | 128 | `Minshawy_Murattal_128kbps` |
| `alafasy` | مشاري راشد العفاسي | 128 | `Alafasy_128kbps` |

- النمط: `https://everyayah.com/data/{folder}/{SSS}{AAA}.mp3`
- QA: `pnpm run audit:audio:stratified` ثم `pnpm run audit:audio:full`

### احتياط Islamic Network CDN
- `https://cdn.islamic.network/quran/audio/128/{edition}/{ayahNumber}.mp3`

## تلاوة (Surah-level)
- `mp3quran.net` — تنزيل دون اتصال عبر `quran-audio-downloads.ts`

---

## الأذان — مصدر CDN والنسبة

### المستودع
- **GitHub/CDN:** [mohsalvi/adhan-audio](https://github.com/mohsalvi/adhan-audio)
- **CDN base:** `https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main`

### الملفات المُنزَّلة (عبر `pnpm run generate:adhan-bundle`)

| ملف محلي | مصدر CDN | الاستخدام |
|---|---|---|
| `adhan-makkah-full.m4a` | `general/makkah-haram-02.mp3` | تشغيل داخل التطبيق (~28ث) |
| `adhan-madinah-full.m4a` | `general/madinah-02.mp3` |同上 |
| `adhan-egypt-full.m4a` | `general/egypt-traditional-02.mp3` |同上 |
| `adhan-haram-full.m4a` | `general/al-haram-01.mp3` |同上 |
| `adhan-aqsa-full.mp3` | `general/al-aqsa-jerusalem-02.mp3` |同上 |
| `adhan-makkah-fajr.mp3` | `fajr/makkah-fajr-01.mp3` | فجر — تثويب |
| `adhan-takbeerat-short.mp3` | `general/madinah-02.mp3` (مقطع قصير) | تكبيرات |
| `ios/.../adhan-short-*.caf` | مقاطع ≤~12ث من المصادر أعلاه | **نغمة إشعار iOS ≤30ث** |
| `ios/.../adhan-seq-makkah-0N.caf` | `makkah-haram-02.mp3` (4×~28ث) | سلسلة إشعارات تجريبية |
| `android/res/raw/adhan_*.mp3` | mirrors للـ CAF | Android notifications |

### الترخيص والنسبة
- **الترخيص:** تسجيلات أذان عامة منشورة في مستودع `mohsalvi/adhan-audio` — **يجب مراجعة README/TR LICENSE في ذلك المستودع قبل الإصدار التجاري.**
- **نص النسبة في التطبيق:** «أذان — تسجيلات عامة منشورة عبر mohsalvi/adhan-audio (jsDelivr CDN).»
- **CREDITS:** يُحدَّث في `CREDITS.md` عند اعتماد نسخة نهائية.
- **توليد الحزمة:** `node scripts/adhan-audio/generate-adhan-bundle.mjs` — يتحقق أن كل `.caf` إشعار **≤30 ثانية** (`afinfo`).

### فجر منفصل
- إشعار iOS: `adhan-short-makkah-fajr.caf` (من `fajr/makkah-fajr-01.mp3`)
- تشغيل كامل داخل التطبيق: `adhan-makkah-fajr.mp3`

---

## التفسير الصوتي

- الكتالوج: `public/data/tafsir-audio-catalog.json` — **فارغ حتى توثيق الترخيص**
- **واجهة المستخدم مخفية** (لا معطّلة) حتى توثيق `attributionVerified` في الكتalog
- خريطة seek: `public/data/tafsir-audio-map.json`
