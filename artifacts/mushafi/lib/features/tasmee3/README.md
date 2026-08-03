# Tasmee3 Feature

ميزة التسميع في التطبيق.

## الملفات الأساسية

- `domain/`: نماذج البيانات.
- `data/`: قراءة القرآن، التعرف الصوتي، وسجل الجلسات.
- `application/`: controller ومحرك كشف الأخطاء.
- `presentation/`: شاشة التسميع، السجل، والتقارير.

## مصدر القرآن

يجب وضع ملف القرآن هنا:

`assets/quran/quran_uthmani.json`

الصيغة:

```json
[
  {
    "surah": 1,
    "ayah": 1,
    "textUthmani": "..."
  }
]
```

## محرك ASR المتقدم

تمت إضافة محرك:

`AdvancedQuranAsrRecognizer`

المحرك يسجل الصوت من التطبيق ثم يرسله إلى endpoint:

`TASMEE3_ASR_ENDPOINT`

مثال تشغيل:

```bash
flutter run --dart-define=TASMEE3_ASR_ENDPOINT=http://192.168.1.10:8000/transcribe
```

إذا لم يتم ضبط endpoint، يستخدم التطبيق:

`SpeechToTextQuranRecognizer`

كمحرك fallback. لا يدّعي التطبيق أن المحرك المتقدم يعمل بدون endpoint مضبوط.

## الخادم

يوجد خادم جاهز في:

`server/tasmee3_asr/`

يشغّل FastAPI ويستخدم whisper-timestamped لإرجاع الكلمات مع التوقيت والثقة.

## الخصوصية

إذا كان ASR المتقدم مفعلا، يتم إرسال تسجيل التلاوة إلى الخادم المحدد. يعرض التطبيق تنبيهاً للمستخدم قبل التسجيل. يجب استخدام HTTPS و API key عند النشر.

## Forced Alignment

تمت إضافة Forced Alignment.

الفكرة:

- التطبيق يرسل الصوت + كلمات الآيات المتوقعة.
- الخادم يفرغ الصوت إلى كلمات مع timestamps.
- الخادم يطابق الكلمات المتوقعة مع الكلمات المسموعة.
- النتيجة ترجع لكل كلمة:
  - correct
  - missing
  - mismatch
  - lowConfidence

هذا يعطي دقة أعلى من التفريغ الصوتي العام، لأن المقارنة تصبح موجهة بالنص القرآني المتوقع.

## endpoint

يستخدم نفس endpoint:

`/transcribe`

لكن الآن يستقبل:

- audio
- expectedText
- expectedWords
- fromSurah
- fromAyah
- toSurah
- toAyah

## ملاحظة

Forced Alignment الحالي يعتمد على مطابقة كلمات بعد التفريغ.
للوصول لمستوى أعلى جدا، يمكن لاحقا إضافة alignment صوتي مباشر باستخدام نماذج acoustic alignment أو wav2vec alignment.

## مكان استبدال المحرك

- Fallback: `lib/features/tasmee3/data/speech_to_text_quran_recognizer.dart`
- Advanced: `lib/features/tasmee3/data/advanced_quran_asr_recognizer.dart`
- اختيار تلقائي عبر: `quranSpeechRecognizerProvider`
