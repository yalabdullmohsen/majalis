# تقرير فجوات وإعادة بناء — التسميع بالذكاء الاصطناعي

تاريخ: 2026-07-27 · فرع: `cursor/ai-recitation-complete-4f26`

## ما كان موجودًا
- محرك محاذاة Needleman–Wunsch تدفقي (`VerseAlignmentEngine`) + تطبيع عثماني.
- مزودات: on-device / Web Speech / server(Groq whisper-large-v3).
- أوضاع UI متعددة + حفظ جلسات Supabase + مراجعة SM-2.
- نص مرجعي ثابت من `public/data/quran/` — لا توليد بالذكاء الاصطناعي.

## ما أُكمل في هذه الجولة (رفع القيود السابقة)
1. ثقة أصلية من iOS `SFSpeechTranscription.segments` + Android `EXTRA_CONFIDENCE_SCORES` عبر الجسر JS و`on-device-provider`.
2. Whisper `verbose_json` + `timestamp_granularities[]=word` → طوابع زمنية للكلمات في `/api/recitation-transcribe` و`server-provider`.
3. مستوى «إتقان التجويد» يُفعَّل عند توفر الخادم: ملاحظات **مدة المد** فقط (`tajweed-timing.ts`) بثقة &lt; 85 بصيغة «قد» — بلا ادعاء فونيمي.
4. وضع `listen_repeat` كامل: تشغيل أول آية من القارئ ثم فتح الميكروفون؛ هجرة SQL `v5_listen_repeat`؛ الحفظ كـ`listen_repeat` مباشرة.
5. Harness نصي WER + اختبارات tajweed/pairing (`test:recitation-wer-tajweed`).
6. عند اختيار التجويد يُفضَّل المزوّد الخادمي (`preferTajweed`).

## مزودات الذكاء الاصطناعي
| مزود | الدور | مفاتيح |
|---|---|---|
| Groq whisper-large-v3 عبر `/api/recitation-transcribe` | Safari/PWA/fallback + تجويد زمني | `GROQ_API_KEY` خادم فقط |
| SFSpeech / Android SR | Capacitor أصلي + ثقة كلمات | بلا مفتاح سحابي |
| Web Speech API | Chrome/Edge (حفظ) | متصفح |

## حدود صادقة متبقية (ليست قيودًا قابلة للإزالة في هذه الجلسة)
- لا تجويد فونيمي (إدغام/إخفاء/قلقلة صوتية) — لا مزود يدعمه دون نموذج متخصص.
- لا بث WebSocket حقيقي على Vercel serverless — نافذة متداخلة بديل عملي.
- WER على تسجيلات بشرية صوتية في CI يتطلب مقاطع مصرَّحًا بنشرها (الحالي نصي/تزامني).
- هجرة `v5_listen_repeat` تحتاج تطبيقًا يدويًا في Supabase إن لم تُطبَّق بعد — بدونها قد يفشل حفظ الجلسة بصمت ويعود التقرير على الشاشة سليمًا.
