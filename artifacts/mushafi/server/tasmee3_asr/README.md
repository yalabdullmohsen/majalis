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
