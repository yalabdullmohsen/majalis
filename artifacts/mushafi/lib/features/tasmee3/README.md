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

## تحسينات البرومبت السادس

تمت إضافة:

- Edit Distance Alignment.
- ربط كل كلمة بالآية الخاصة بها.
- نتيجة لكل آية.
- مواضع الضعف.
- تحسين تنبيهات المستخدم.
- دعم expectedWordMap بين Flutter والخادم.

## لماذا Edit Distance؟

المطابقة السابقة تعتمد على المقارنة المباشرة أو الكلمة التالية.
أما Edit Distance فيتعامل أفضل مع:

- كلمة ناقصة.
- كلمة زائدة.
- كلمة قريبة في التفريغ.
- خطأ بسيط في ASR.
- اختلافات طفيفة بعد التطبيع.

## نصيحة دقة

لأفضل دقة:

- استخدم نطاقا قصيرا.
- اقرأ في مكان هادئ.
- لا تقرأ خارج النطاق المختار.
- استخدم خادم ASR قريب وسريع.

## تحسينات جودة الصوت

تمت إضافة:

- مؤشر مباشر لمستوى الصوت أثناء التسميع.
- عداد مدة التسجيل.
- رفض التسجيل إذا كان قصيرا جدا.
- رفض التسجيل إذا كان الصوت منخفضا جدا.
- رسائل خطأ أوضح للمستخدم.
- إرشادات للحصول على دقة أعلى.
- تسجيل WAV/PCM عند استخدام المحرك المتقدم لتحسين وضوح ASR.

## نصائح للمستخدم

- اقرأ في مكان هادئ.
- اقترب قليلا من الميكروفون.
- اختر نطاقا قصيرا.
- تجنب الصمت الطويل أثناء التسجيل.
- اقرأ النطاق المختار فقط دون زيادة.

## إعدادات محرك التسميع

تمت إضافة شاشة:

`Tasmee3AsrSettingsScreen`

تسمح بـ:

- اختيار المحرك:
  - Auto
  - Advanced Server
  - Device fallback
- ضبط endpoint.
- ضبط API key.
- السماح أو منع إرسال الصوت للخادم.
- اختبار اتصال الخادم.
- تفعيل retry.
- حفظ الجلسات الفاشلة في queue.

## الخصوصية

تمت إضافة شاشة:

`Tasmee3PrivacyScreen`

توضح:

- مصدر النص القرآني.
- متى يستخدم الميكروفون.
- متى يرسل الصوت إلى الخادم.
- أين تحفظ الإعدادات.
- نصائح الأمان.

## البرومبت التاسع - تجربة إنتاج كاملة

تمت إضافة:

- Dashboard للتسميع.
- إحصائيات آخر 7 أيام.
- خطة مراجعة ذكية.
- تقرير جلسة قابل للنسخ.
- تشخيص الجلسة بدون إرسال الصوت.
- تحسين سجل التسميع.
- عرض متوسط الدقة وعدد الجلسات.
- صفحة إنجازات بسيطة.

## Dashboard

الشاشة:

`Tasmee3DashboardScreen`

تعرض:

- زر بدء تسميع جديد.
- إحصائيات الأسبوع.
- ملخص الجلسات.
- خطة المراجعة.
- روابط السجل وخطة المراجعة والإنجازات.

المسار: `/tasmee3-dashboard`

## خطة المراجعة

تعتمد على الجلسات السابقة:

- الدقة الأقل من 85%.
- عدد الأخطاء.
- تكرار الضعف في نفس النطاق.

## تقرير الجلسة

يمكن نسخ تقرير نصي يحتوي:

- النطاق.
- المدة.
- الدقة.
- عدد الأخطاء.
- تفاصيل الأخطاء.

التشخيص (`Tasmee3SessionDiagnostics`) يبقى محليا داخل التطبيق ولا يرسل الصوت.

## البرومبت العاشر - الأهداف والإنجازات

تمت إضافة:

- هدف يومي للتسميع.
- Streak.
- إنجازات Badges.
- إعدادات الهدف.
- عرض تقدم الهدف في Dashboard.
- خطة مراجعة أسبوعية تلقائية (آخر 7 أيام).
- تذكير محفوظ داخل التطبيق.

## الشاشات الجديدة

- `Tasmee3GoalSettingsScreen`
- `Tasmee3BadgesScreen`

## Providers الجديدة

- `tasmee3DailyGoalProvider`
- `tasmee3TodayGoalProgressProvider`
- `tasmee3StreakProvider`
- `tasmee3BadgesProvider`

## ملاحظة عن التذكير

تم حفظ وقت التذكير في الإعدادات، مع تنبيه داخل لوحة التسميع إذا لم يكتمل الهدف. لإشعار فعلي على الجهاز يمكن لاحقا إضافة:

- flutter_local_notifications
- timezone
- notification permission handling

## البرومبت الحادي عشر - الإشعارات و PDF

تمت إضافة:

- إشعارات محلية للتذكير اليومي.
- طلب صلاحية الإشعارات.
- جدولة تذكير يومي حسب وقت الهدف.
- إلغاء التذكير عند تعطيله.
- اختبار إشعار من داخل إعدادات الهدف.
- تصدير تقرير جلسة PDF.
- مشاركة التقرير عبر share_plus.
- شاشة معلومات عن التذكيرات والخصوصية.

## ملفات جديدة

- `Tasmee3NotificationService`
- `Tasmee3PdfReportService`
- `Tasmee3NotificationsInfoScreen`

## ملاحظة PDF

يستخدم التقرير خط `ScheherazadeNew-Regular.ttf` لعرض العربية داخل PDF.

## البرومبت الثاني عشر - PDF عربي احترافي

تمت إضافة:

- تحميل خط عربي للـ PDF (Noto Naskh Arabic).
- تصميم تقرير PDF أفضل.
- جدول ملخص الجلسة.
- جدول الأخطاء.
- نصائح مراجعة.
- تاريخ ورقم تقرير.
- معاينة تقرير داخل التطبيق.
- مشاركة PDF.

## الخطوط المطلوبة

```text
assets/fonts/NotoNaskhArabic-Regular.ttf
assets/fonts/NotoNaskhArabic-Bold.ttf
```

الخطوط مضافة فعلياً (ترخيص OFL من Google Noto). إذا فشل التحميل، تستخدم الخدمة Scheherazade كاحتياطي.

## الملفات الجديدة

- `Tasmee3PdfFontLoader`
- `Tasmee3ReportPreviewScreen`

## البرومبت الثالث عشر - نظام تذكيرات Production

تمت إضافة:

- إدارة تذكيرات متعددة.
- تذكير هدف يومي.
- تذكير حماية Streak.
- تذكير مواضع الضعف.
- تذكير ذكي (يقترح وقتاً من نشاط الجلسات).
- تذكير ورد رمضان.
- دعم أيام الأسبوع.
- دعم exactAllowWhileIdle مع fallback إلى inexactAllowWhileIdle.
- شاشة إدارة التذكيرات.

## الشاشة الجديدة

`Tasmee3RemindersScreen`

## ملاحظات Android

قد تحتاج الأجهزة الحديثة إلى:

- POST_NOTIFICATIONS
- SCHEDULE_EXACT_ALARM

إذا فشل exact alarm، يستخدم التطبيق fallback إلى inexact alarm.

## البرومبت الرابع عشر - SRS والمراجعة الذكية

تمت إضافة:

- Spaced Repetition للآيات.
- مستوى إتقان لكل آية.
- اقتراح مراجعة اليوم.
- اقتراح النطاق التالي.
- تحديث مستوى الإتقان بعد كل جلسة.
- عرض مراجعات اليوم في Dashboard.
- خطة المراجعة تعتمد SRS أولاً مع fallback للتحليل القديم.

## كيف يعمل SRS؟

بعد كل جلسة:
- يتم توسيع النطاق إلى آيات.
- يتم حساب الأخطاء لكل آية.
- يتم تحديث masteryScore.
- يتم تحديد المستوى:
  - newAyah
  - weak
  - learning
  - good
  - mastered
- يتم تحديد nextReviewAt بناء على الأداء.

## الشاشات الجديدة

- `Tasmee3TodayReviewScreen`

## الملفات الجديدة

- `AyahMasteryRecord`
- `Tasmee3SrsService`
- `AyahMasteryRepository`
- `Tasmee3ReviewSuggestion`

## البرومبت الخامس عشر - ربط SRS بشاشة التسميع

تمت إضافة:

- `initialTarget` إلى `Tasmee3Screen`.
- فتح شاشة التسميع مباشرة من مراجعة اليوم.
- زر "ابدأ المراجعة المقترحة".
- عرض النص المتوقع قبل التسميع.
- وضع اختبار حفظ افتراضي للمراجعات المقترحة.
- Mapper لتحويل `Tasmee3ReviewSuggestion` إلى `RecitationTarget`.
- تحديد أقصى نطاق مقترح بـ 5 آيات.

## تجربة المستخدم

المستخدم الآن يستطيع:
1. فتح Dashboard.
2. رؤية مراجعة مقترحة.
3. الضغط على "ابدأ المراجعة المقترحة".
4. قراءة النص المتوقع إن أراد.
5. بدء التسميع في وضع اختبار الحفظ.

## البرومبت السادس عشر - تجربة المصحف داخل التسميع

تمت إضافة:

- صفحة عرض آيات شبيهة بالمصحف داخل التسميع.
- أوضاع عرض النص:
  - showAll
  - hideAll
  - firstWordOnly
  - hifzTest
  - revealOnMistake
- عرض الكلمات الملونة داخل النص.
- زر إظهار/إخفاء النص.
- BottomSheet لتغيير وضع العرض.
- عرض النتيجة داخل صفحة مصحف بدل Chips فقط.
- fallback للـ Chips إذا لم تتوفر expectedAyahs.

## الملفات الجديدة

- `Tasmee3TextVisibilityMode`
- `Tasmee3DisplayWord`
- `Tasmee3DisplayBuilder`
- `Tasmee3MushafRecitationView`
- `Tasmee3VisibilityModeSheet`

## ملاحظة

هذه المرحلة لا تغيّر النص القرآني ولا تولده. هي فقط تغير طريقة العرض.

## البرومبت السابع عشر - Live Follow Along

تمت إضافة:

- متابعة مباشرة أثناء التسميع.
- تمييز الكلمة الحالية.
- تمييز الكلمات المتعرف عليها.
- تقدم حي بعدد الكلمات.
- عرض الآية الحالية.
- تنبيه عند التوقف.
- دعم partial recognition من fallback.
- تجهيز WebSocket recognizer مستقبلي.

## الملفات الجديدة

- `Tasmee3LiveWordStatus`
- `Tasmee3LiveWord`
- `Tasmee3LiveProgress`
- `Tasmee3LiveFollowService`
- `Tasmee3LiveProgressCard`
- `LiveAsrWebSocketRecognizer`

## ملاحظة

Live Follow Along الحالي يعتمد على النص الجزئي القادم من recognizer.
إذا تم ربط WebSocket ASR مستقبلا، يمكن تحديث `LiveAsrWebSocketRecognizer` ليرسل partial segments بدقة أعلى.

## البرومبت الثامن عشر - الذكاء الصوتي المباشر

تمت إضافة:

- Auto Resume للـ speech_to_text fallback.
- تقدم حي لكل آية.
- أوامر صوتية بسيطة:
  - أعد
  - التالي
  - أظهر
  - أخف
  - توقف
- عرض آخر أمر صوتي تم رصده.
- تدريب على الأخطاء بعد الجلسة.
- شاشة `Tasmee3MistakeTrainingScreen`.
- تجهيز `LiveAsrWebSocketRecognizer` للبث الحي مستقبلا.

## ملاحظات

الأوامر الصوتية تعتمد على النص المتعرف عليه، وقد تختلف دقتها حسب محرك ASR.
الأوامر لا تغيّر النص القرآني ولا تولده.

## البرومبت التاسع عشر - WebSocket Live ASR

تمت إضافة:

- إعداد Live WebSocket endpoint.
- `LiveAsrWebSocketRecognizer`.
- اختيار WebSocket من provider عندما يكون مفعلا.
- WebSocket endpoint في الخادم:
  `/ws/live`
- بروتوكول رسائل:
  - start
  - audioChunk
  - stop
  - ready
  - partial
  - final
  - error

## ملاحظة مهمة

WebSocket الحالي هو بنية جاهزة للبث الحي.
التحليل النهائي الدقيق ما زال يتم عبر HTTP `/transcribe`.
إذا لم يكن WebSocket مضبوطا أو فشل، يستخدم التطبيق:
- Advanced HTTP ASR
- أو speech_to_text fallback

## البرومبت العشرون - Audio Chunks Streaming

تمت إضافة:

- إرسال audio chunks عبر WebSocket.
- استقبال partial transcripts.
- watchdog إذا تأخرت partials.
- final result عند stop.
- fallback عند فشل WebSocket.
- استمرار HTTP Forced Alignment كمرحلة نهائية.

## ملاحظة تقنية

حزمة record قد لا توفر stream audio raw موحدا لكل المنصات.
لذلك يستخدم التطبيق chunks قصيرة مسجلة ثم يرسلها.
لإنتاج احترافي يفضل لاحقا native PCM stream.

## البرومبت الحادي والعشرون - Native PCM Streaming

تمت إضافة:

- `PcmAudioStreamService`
- `LiveAsrPcmWebSocketRecognizer`
- Android AudioRecord PCM stream
- دعم binary frames عبر WebSocket
- تحويل PCM إلى WAV في الخادم
- fallback إلى m4a chunks أو HTTP أو speech_to_text

## ملاحظات

- Android مدعوم عبر AudioRecord.
- iOS يحتاج AVAudioEngine لاحقا.
- إذا PCM غير متاح، يستخدم التطبيق fallback حسب الإعدادات.
- iOS PCM Streaming يحتاج تنفيذ AVAudioEngine لإرسال PCM frames عبر EventChannel.
- حاليا Android مدعوم، و iOS يستخدم fallback إذا لم يتم تنفيذ PCM.
