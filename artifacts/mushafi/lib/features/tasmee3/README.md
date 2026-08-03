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

## الدقة

المحرك الحالي يستخدم speech_to_text كحل أولي. للوصول إلى دقة أعلى مثل التطبيقات المتقدمة، يجب ربط محرك ASR قرآني متخصص يعطي:

- الكلمات.
- توقيت كل كلمة.
- نسبة ثقة لكل كلمة.
- نتيجة نهائية أو جزئية.

## مكان استبدال المحرك

استبدل implementation الحالي في:

`lib/features/tasmee3/data/speech_to_text_quran_recognizer.dart`

أو اربط:

`lib/features/tasmee3/data/advanced_quran_asr_recognizer.dart`

مع provider:

`quranSpeechRecognizerProvider`
