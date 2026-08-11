# التسميع — بث صوتي منخفض الكمون

## المعمارية الحالية

| المسار | متى يُستخدم | الكمون المتوقع |
|---|---|---|
| On-device (SFSpeech / Android SR) | تطبيق Capacitor | جزئيات حية |
| **WebSocket ASR** | عند ضبط `VITE_RECITATION_WS_URL` | شرائح **~250ms** + VAD → بوابة طويلة العمر (Deepgram proxy / مخصّصة) |
| Web Speech API | Chrome / Edge (بدون WS) | شبه فوري (+ interim مكتمل) |
| Server (Groq Whisper REST) | Safari / fallback | شرائح **~250ms** + نافذة ~0.75ث + VAD |

Vercel Functions **لا** تستضيف WebSocket ASR دائم. مسار الـ WebSocket يتطلّب خدمة منفصلة طويلة العمر؛ دونها يبقى REST/Web Speech.

## إعداد WebSocket (اختياري — أقرب لتجربة ترتيل)

1. انشر بوابة ASR (مثال: وكيل Deepgram Live) على مضيف يدعم WebSocket.
2. أضف على Vercel / بيئة البناء:
   ```bash
   VITE_RECITATION_WS_URL=wss://asr.example.com/v1/recitation
   # اختياري — يُرسَل في رسالة start بعد الاتصال
   VITE_RECITATION_WS_TOKEN=...
   ```
3. البروتوكول من العميل:
   - بعد `open`: `{ type:"start", mimeType, language:"ar", token? }`
   - أثناء الكلام: إطارات **binary** (webm/opus) كل ~250ms، أو `{ type:"audio", mimeType, data:base64 }`
   - عند الإيقاف: `{ type:"stop" }`
4. البروتوكول من الخادم (أي شكل):
   - مخصّص: `{ type:"transcript"|"partial"|"final", text?, words?:string[], is_final? }`
   - أو شبيه Deepgram: `{ channel:{ alternatives:[{ transcript, words }] }, is_final }`

الكلمات المُستقبَلة تُطبَّع عبر `normalizeQuranWord` وتُحاذى مع المرجع من `fetchSurahDetail` (ملفات محلية + IndexedDB عبر Dexie).

## إعداد الخادم REST (Groq) — fallback

1. أنشئ مفتاحًا من [Groq Console](https://console.groq.com/).
2. أضف السر على Vercel:
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

- `src/lib/recitation-ai/streaming-audio.ts` — `SLICE_MS=250` + عنوان WS
- `src/lib/recitation-ai/vad.ts` — Energy VAD (بلا تجميد UI)
- `src/lib/recitation-ai/soft-match.ts` — تسامح ASR محدود
- `src/lib/recitation-ai/providers/websocket-provider.ts` — بث WebSocket
- `src/lib/recitation-ai/providers/server-provider.ts` — بث شرائح REST + طابور
- `src/lib/recitation-ai/providers/web-speech-provider.ts` — interim مكتمل + finals
- `src/lib/recitation-ai/verse-alignment-engine.ts` — محاذاة حيّة + تمييز كلمات
- `src/components/MicPermissionHelp.tsx` — إرشاد RTL عند حظر الميكروفون
- `src/lib/offline-content-store.ts` — كاش قرآن IndexedDB (Dexie)

## الملاحظات البصرية الحية

- تمييز الكلمات المطابقة فورًا (`.imr-word--revealed` / حالات الخطأ)
- مؤشر الموضع الحالي (`.imr-word--cursor`) + تمرير تلقائي لـ `#rai-word-…` إن خرج عن الشاشة
- تمرير صفحة المصحف عبر `#rai-page-{n}` للنطاقات متعددة الصفحات

## حدود صادقة

- لا تجويد فونيمي كامل (إدغام/إخفاء) بدون نموذج متخصص.
- كمون Whisper REST يعتمد على شبكة + Groq؛ VAD يقلّل الطلبات الفارغة فقط.
- WebSocket ثنائي الاتجاه يتطلّب خدمة طويلة العمر (ليست Vercel Functions).
