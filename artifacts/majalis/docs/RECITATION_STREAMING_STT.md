# التسميع — بث صوتي منخفض الكمون

## المعمارية الحالية

| المسار | متى يُستخدم | الكمون المتوقع |
|---|---|---|
| On-device (SFSpeech / Android SR) | تطبيق Capacitor | جزئيات حية |
| Web Speech API | Chrome / Edge | شبه فوري (+ interim مكتمل) |
| Server (Groq Whisper) | Safari / تجويد زمني / fallback | شرائح **~400ms** + نافذة ~1.2ث + VAD |

لا يوجد WebSocket ASR دائم على Vercel (serverless). البديل العملي: `MediaRecorder` بـ timeslice قصير + تفريغ عند انتهاء الكلام عبر VAD على الجهاز.

## إعداد الخادم (Groq)

1. أنشئ مفتاحًا من [Groq Console](https://console.groq.com/).
2. أضف السر على Vercel / بيئة التشغيل:
   ```bash
   GROQ_API_KEY=gsk_...
   ```
3. تحقق:
   ```bash
   curl -s https://majlisilm.com/api/recitation-transcribe
   # → {"configured":true}
   ```

لا يُخزَّن الصوت على خوادمنا — يُمرَّر لـ Groq ويُهمَل.

## وحدات العميل ذات الصلة

- `src/lib/recitation-ai/vad.ts` — Energy VAD
- `src/lib/recitation-ai/soft-match.ts` — تسامح ASR محدود
- `src/lib/recitation-ai/providers/server-provider.ts` — بث الشرائح + طابور إعادة المحاولة
- `src/lib/recitation-ai/providers/web-speech-provider.ts` — interim مكتمل + finals
- `src/lib/recitation-ai/verse-alignment-engine.ts` — محاذاة حيّة + تمييز كلمات

## حدود صادقة

- لا تجويد فونيمي كامل (إدغام/إخفاء) بدون نموذج متخصص.
- كمون Whisper يعتمد على شبكة + Groq؛ VAD يقلّل الطلبات الفارغة فقط.
- WebSocket ثنائي الاتجاه يتطلّب خدمة طويلة العمر (ليست Vercel Functions).
