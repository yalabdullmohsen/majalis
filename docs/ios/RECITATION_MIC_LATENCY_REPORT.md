# تقرير كمون التقاط الميكروفون — التسميع

**الفرع:** `fix/recitation-mic-latency`  
**التاريخ:** 2026-07-30  
**Bundle ID:** `com.yousef.majlisilm` (بدون تغيير)

## الهدف

تقليل الزمن من ضغط «ابدأ التسميع» إلى بدء التقاط الصوت وظهور أول نتيجة جزئية، مع الحفاظ على الدقة والاستقرار.

## أهداف الكمون (تشغيلات لاحقة دافئة)

| المقياس | الهدف |
|---|---:|
| زر → بدء التقاط فعلي | ≤ 300ms |
| تفعيل الجلسة → أول buffer | ≤ 150ms |
| زر → أول partial | ≤ 800ms |
| بلا buffer خلال | 1000ms → خطأ واضح + إعادة محاولة |

## Baseline (قبل — تحليل مسار الكود على الجهاز)

قبل التحسين كان المسار عند **كل** ضغط زر:

1. `requestPermissions` (قد يفتح حوارًا)
2. JS `ensureNativeRecordingAudioSession` → `.playAndRecord`
3. Swift `setCategory(.record)` + `setActive` (**thrash فئة**)
4. `new SFSpeechRecognizer` + Request + Task
5. `removeTap` → `installTap` → `prepare` → `engine.start`
6. `stop` يهدم المحرك و`setActive(false)` في كل مرة

تقدير كمون بارد نموذجي على جهاز حقيقي (من ملاحظات تدقيق سابقة + مسار متسلسل):

| المرحلة | تقدير قبل |
|---|---:|
| زر → تهيئة AVAudioSession | 80–250ms (أبرد مع thrash) |
| جلسة → بدء input tap | 50–150ms |
| tap → أول buffer | 30–120ms |
| أول buffer → أول partial | 300–1200ms (SFSpeech) |
| **زر → أول partial (أول تشغيل)** | غالبًا **1.2–2.5s** |
| **زر → أول partial (تشغيل لاحق)** | غالبًا **0.9–1.8s** بسبب إعادة إنشاء المحرك |

> القياسات الرقمية الدقيقة على جهاز حقيقي تُملأ من أحداث `latency` الأصلية بعد التشغيل على Xcode.

## بعد التحسين — تغييرات جذرية

### Swift (`MajlisSpeechRecognitionPlugin.swift`)
- `prepare`: تسخين AVAudioSession + `audioEngine.prepare` عند فتح الصفحة
- `teardown`: تحرير عند مغادرة الصفحة فقط
- فئة موحّدة `.playAndRecord` + `.measurement` (تفادي thrash مع Playback plugin)
- إعادة استخدام `AVAudioEngine` و`SFSpeechRecognizer`
- فصل إيقاف مهمة التعرّف عن هدم الجلسة الدافئة (`keepWarm`)
- `bufferSize: 512` لأول إطار أسرع
- `partialResults` فورية + `isFinal` في الحمولة
- on-device عند الدعم دون فرضه
- watchdog: لا buffer خلال 1s → `NO_AUDIO_BUFFER`
- أحداث: `latency`, `audioLevel`, `listeningState` (timestamps فقط — بلا صوت/نص)
- `os_signpost` + `OSLog` لقياس Instruments
- معالجة interruptions / route changes / media services reset
- منع أكثر من recognition task (`SESSION_SUPERSEDED` + `sessionGeneration`)

### JS
- `speech-recognition.ts`: `prepare` / `teardown`، إيقاف تلاوة القرآن قبل التسجيل، عدم deactivate العدواني بعد كل `stop`
- `OnDeviceQuranASRProvider`: prewarm، `activeSessionId` ضد الجلسات المزدوجة، `onAudioLevel`
- `useRecitationTest`: حالات `warming` / `ready` / `no_audio`، مؤشر مستوى، أخطاء واضحة، إيقاف فوري
- `RecitationTestPage`: prewarm عند الفتح، رسالة «جارٍ تهيئة الميكروفون»، إيقاف AudioEngine قبل البدء

## قياسات متوقعة بعد (تشغيل دافئ)

| المقياس | هدف | آلية التحقق |
|---|---:|---|
| زر → أول buffer | ≤ 300ms | حدث `first_buffer.msFromButton` |
| tap → أول buffer | ≤ 150ms | حدث `first_buffer.msFromTap` |
| زر → أول partial | ≤ 800ms | حدث `first_partial.msFromButton` |

القيم الفعلية تُسجَّل على الجهاز عبر:

```text
[MajlisSpeech][latency] first_buffer { msFromTap, cold }
[MajlisSpeech][latency] first_partial { msFromButton, cold }
```

وفي JS: `createMicLatencyTracker().summarize()`.

## ما لم يُختبر على جهاز حقيقي (بيئة Linux)

- AirPods / Bluetooth route changes
- بعد مكالمة / Siri
- خلفية → مقدمة
- 20× بدء/إيقاف مع Instruments (leaks)
- xcodebuild Debug/Release Simulator (لا Xcode هنا)
- قياسات ms رقمية حية (تُعبَّأ بعد تشغيل على Mac)

## اختبارات آلية منفَّذة

- `recitation-mic-latency.test.ts` — أهداف + متتبع + بوابات مصدر
- تحديث `test-ios-capacitor-gates.mjs` — prepare/teardown/NO_AUDIO_BUFFER/latency
- `cap sync ios` + بوابات iOS الثابتة

## READY / NOT READY

**NOT READY** لاعتماد أرقام الكمون النهائية على TestFlight حتى تُقاس على جهاز حقيقي عبر Instruments/Console.  
**READY** لمراجعة الكود ودمج التحسينات بعد خضرة CI — مع إكمال القياس اليدوي لاحقًا.
