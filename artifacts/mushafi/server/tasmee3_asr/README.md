# Tasmee3 ASR Server

خادم ASR لميزة التسميع.

## التشغيل المحلي

```bash
cd server/tasmee3_asr
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## التشغيل عبر Docker

```bash
cd server/tasmee3_asr
docker build -t tasmee3-asr .
docker run -p 8000:8000 tasmee3-asr
```

## اختبار الصحة

```bash
curl http://localhost:8000/health
```

## ربط Flutter

شغّل التطبيق بهذا الشكل:

```bash
flutter run \
  --dart-define=TASMEE3_ASR_ENDPOINT=http://YOUR_SERVER_IP:8000/transcribe
```

مع API key:

```bash
flutter run \
  --dart-define=TASMEE3_ASR_ENDPOINT=http://YOUR_SERVER_IP:8000/transcribe \
  --dart-define=TASMEE3_ASR_API_KEY=your_key
```

## ملاحظات مهمة

- لا تضع هذا الخادم مفتوحا للعامة بدون حماية.
- استخدم HTTPS عند النشر الحقيقي.
- استخدم API key.
- عالج التسجيلات كبيانات حساسة.
- احذف الملفات المؤقتة بعد التحليل.

## Forced Alignment

الإصدار 2.0 يدعم Forced Alignment.

مثال الحقول المرسلة:

- `audio`: ملف الصوت
- `language`: ar
- `expectedText`: النص المتوقع normalized
- `expectedWords`: JSON array للكلمات المتوقعة
- `fromSurah`
- `fromAyah`
- `toSurah`
- `toAyah`

الاستجابة تحتوي:

```json
{
  "fullText": "...",
  "confidence": 0.91,
  "isFinal": true,
  "alignedWords": [
    {
      "expectedWord": "قل",
      "recognizedWord": "قل",
      "globalWordIndex": 0,
      "startMs": 120,
      "endMs": 400,
      "confidence": 0.98,
      "status": "correct"
    }
  ]
}
```

## Version 3.0

يدعم الخادم الآن:

- Edit Distance Alignment.
- expectedWordMap.
- ayahScores.
- weakSpots.
- تقليل الهلوسة عبر:
  - condition_on_previous_text=False
  - temperature=0.0

الاستجابة تشمل:

```json
{
  "alignedWords": [],
  "ayahScores": [],
  "weakSpots": []
}
```

## Audio Validation

الخادم يفحص:

- حجم ملف الصوت.
- مدة ملف الصوت عبر ffprobe.
- يرفض الملفات الفارغة أو القصيرة جدا.

متغيرات البيئة:

```bash
TASMEE3_MIN_AUDIO_BYTES=1200
TASMEE3_MIN_AUDIO_DURATION_SECONDS=1.2
```

## Health endpoint

يرجع `/health` معلومات عن:

- إصدار الخادم.
- نوع النموذج.
- الجهاز.
- الميزات المفعلة.
- حد الثقة المنخفضة.
- أقل حجم صوت.
- أقل مدة صوت.

## WebSocket Live ASR

تمت إضافة endpoint:

`/ws/live`

مثال:

```txt
ws://localhost:8000/ws/live
```

الرسائل من العميل:

```json
{ "type": "start", "language": "ar" }
{ "type": "audioChunk", "data": "base64..." }
{ "type": "stop" }
```

الرسائل من الخادم:

```json
{ "type": "ready", "text": "", "confidence": 0, "words": [] }
{ "type": "partial", "text": "", "confidence": 0, "words": [] }
{ "type": "final", "text": "", "confidence": 0, "words": [] }
{ "type": "error", "error": "..." }
```

ملاحظة: التحليل الحي الحقيقي يحتاج استقبال audio chunks بصيغة متفق عليها ثم تشغيل ASR على دفعات. endpoint الحالي يؤسس البروتوكول ولا يستبدل `/transcribe`.

## Live Audio Chunks

الإصدار الحالي يستقبل chunks بصيغة base64.

ملاحظة مهمة:
إذا كانت chunks بصيغة m4a مستقلة، قد لا يكون دمجها byte-by-byte مثاليا في كل الأجهزة.
لإنتاج احترافي يفضل لاحقا:
- إرسال PCM raw
- أو WAV chunks متوافقة
- أو استخدام native audio stream في Flutter
- أو تسجيل ملف مستمر وقراءة tail chunks

الحل الحالي عملي كتجربة أولى، وقد يحتاج تحسين حسب المنصة.
الخادم يحلّل أحدث chunk منفرداً للـ partial، وعند stop يحلّل كل chunk على حدة ثم يضم النصوص.

## Native PCM WebSocket Streaming

يدعم `/ws/live` الآن binary PCM frames بالإضافة إلى بروتوكول m4a chunks.

بروتوكول العميل:

```json
{
  "type": "startPcm",
  "language": "ar",
  "sampleRate": 16000,
  "channels": 1,
  "bitsPerSample": 16
}
```

ثم يرسل العميل binary frames مباشرة عبر WebSocket.

يمكن إرسال metadata اختيارية:

```json
{
  "type": "pcmMeta",
  "sequence": 1
}
```

لإنهاء الجلسة:

```json
{
  "type": "stopPcm"
}
```

الخادم يحول PCM إلى WAV مؤقتا ثم يحلل آخر المقاطع ويرسل:

```json
{
  "type": "partial",
  "text": "...",
  "confidence": 0.8,
  "words": []
}
```

وعند الإيقاف:

```json
{
  "type": "final",
  "text": "...",
  "confidence": 0.9,
  "words": []
}
```

### Android

Android يستخدم AudioRecord عبر EventChannel لإرسال PCM 16-bit mono 16k.

### iOS

iOS يحتاج تنفيذ AVAudioEngine لاحقا. إذا لم ينفذ، يستخدم التطبيق fallback.
