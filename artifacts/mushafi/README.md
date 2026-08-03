# مصحفي (Mushafi)

تطبيق مصحف Flutter احترافي هادئ للقراءة والتلاوة ومراجعة الحفظ.

> **تحذير شرعي وتقني:** النص القرآني في `assets/data/quran_uthmani.json` حالياً **عيّنة MOCK محدودة** للتطوير والاختبار فقط.  
> **لا تعرضه كمصحف مكتمل.** قبل أي إصدار إنتاجي، استبدله بنص عثماني (حفص) من **مصدر موثّق ومرخّص** ثم شغّل سكربت السلامة.

## التشغيل

```bash
export PATH="$HOME/development/flutter/bin:$PATH"
cd artifacts/mushafi
flutter pub get
dart run scripts/quran_integrity_check.dart
flutter analyze
flutter test
flutter run
```

## البنية

Clean Architecture:

- `lib/core` — ثوابت، أخطاء، تطبيع عربي، ثيم
- `lib/design_system` — ألوان عاجية/ذهبية، زخارف CustomPainter أصلية
- `lib/features/quran` — المصحف، الفهارس، تخطيط الصفحة
- `lib/features/audio` — just_audio + MiniPlayer
- `lib/features/bookmarks` / `notes` / `search` / `khatmah` / `tarteel` / `settings`

State: **Riverpod** · Routing: **go_router** · Local store: **shared_preferences** (+ sqflite جاهز للتوسعة)

## بيانات القرآن

ضع الملف الموثّق هنا:

```
assets/data/quran_uthmani.json
```

الحقول المتوقعة: `surahs[]`, `ayahs[]` مع `textUthmani`, `pageNumber`, `juzNumber`, `hizbQuarter`, `bismillahPre`.

اضبط:

```json
{ "isMock": false, "isComplete": true }
```

ثم:

```bash
dart run scripts/quran_integrity_check.dart
```

يتحقق من: 114 سورة، 6236 آية، عدم فراغ الآيات، بسملة التوبة، توافق الصفحة/الجزء/الربع.

## الخطوط

- العائلة: `MushafiQuran` من `assets/fonts/`
- استبدل بخط عثماني مرخّص عند التوفر (مثل KFGQPC بإذن رسمي)
- `MushafiFontLoader` يتحقق من وجود الملف مع fallback آمن

## الصوت

- `AudioRepository` يبني روابط everyayah بنمط `SSSAAA.mp3`
- للتنزيل دون إنترنت: أضف طبقة تخزين ملفات تحت `path_provider` واستبدل `setUrl` بمسار محلي
- بيانات التوقيت: ضع JSON توقيت لكل آية بجانب البيانات ومرّره لـ highlight

## مراجعة الحفظ (بدل اسم تجاري)

- الواجهة: «مراجعة الحفظ»
- `QuranSpeechRecognizer` + `MockQuranSpeechRecognizer` (محلي، لا يرسل صوتًا)
- `ExternalApiQuranSpeechRecognizer` placeholder — يتطلب API Key + إذن ميكروفون صريح
- `MistakeDetectionEngine` للمقارنة بعد التطبيع

## الخصوصية المقترحة

- الملاحظات والمفضلة والختمة محلية افتراضيًا
- لا تحليلات خارجية دون موافقة
- لا إرسال تسجيلات في الـ Mock
- شاشة الخصوصية توضح معالجة الصوت قبل أي ASR سحابي

## الوضع البصري

- Light / Dark / Sepia
- خلفية عاجية `#FBF7EF`، زخرفة `#A77A48`، حبر `#11100E`
- صفحة بنسبة ≈ 9:16، أدوات تظهر عند اللمس فقط
