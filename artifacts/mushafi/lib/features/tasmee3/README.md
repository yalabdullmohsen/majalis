# Tasmee3 Feature

ميزة التسميع تعتمد على طبقات منفصلة:

- UI: شاشة التسميع.
- Controller: إدارة الجلسة.
- QuranRepository: قراءة النص القرآني من ملف موثق.
- QuranSpeechRecognizer: واجهة التعرف الصوتي.
- SpeechToTextQuranRecognizer: محرك fallback يعتمد على التعرف الصوتي في الجهاز.
- AdvancedQuranAsrRecognizer: مكان ربط محرك ASR قرآني متخصص لاحقا.
- MistakeDetectionEngine: مقارنة الكلمات وكشف الأخطاء.

## رفع الدقة

للوصول إلى دقة مثل التطبيقات المتقدمة، يجب ربط محرك ASR قرآني متخصص يرجع:

- الكلمة
- بداية الكلمة بالمللي ثانية
- نهاية الكلمة بالمللي ثانية
- confidence لكل كلمة

ثم تمرير النتائج إلى MistakeDetectionEngine.

## تخصيص الواجهة

عدّل القيم الافتراضية أو عدّل `tasmee3UiSettingsProvider` في:

`lib/features/tasmee3/application/tasmee3_ui_settings.dart`

## استبدال محرك الصوت

غيّر فقط `quranSpeechRecognizerProvider` في:

`lib/features/tasmee3/application/tasmee3_providers.dart`

من `SpeechToTextQuranRecognizer` إلى تنفيذ `AdvancedQuranAsrRecognizer` بعد ربط الـ API.

## ملاحظات مهمة

- لا يتم توليد النص القرآني بالذكاء الاصطناعي.
- النص يجب أن يأتي من assets/quran/quran_uthmani.json.
- speech_to_text مناسب كبداية لكنه ليس مثاليا للتسميع الطويل.
