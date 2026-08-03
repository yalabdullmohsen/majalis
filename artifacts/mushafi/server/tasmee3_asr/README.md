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
