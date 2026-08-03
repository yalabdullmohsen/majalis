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

## مكان استبدال المحرك

- Fallback: `lib/features/tasmee3/data/speech_to_text_quran_recognizer.dart`
- Advanced: `lib/features/tasmee3/data/advanced_quran_asr_recognizer.dart`
- اختيار تلقائي عبر: `quranSpeechRecognizerProvider`
