# تقرير فجوات وإعادة بناء — التسميع بالذكاء الاصطناعي

تاريخ: 2026-07-27 · فرع: `cursor/ai-recitation-rebuild-4f26`

## ما كان موجودًا
- محرك محاذاة Needleman–Wunsch تدفقي (`VerseAlignmentEngine`) + تطبيع عثماني.
- مزودات: on-device / Web Speech / server(Groq whisper-large-v3).
- أوضاع UI متعددة + حفظ جلسات Supabase + مراجعة SM-2.
- نص مرجعي ثابت من `public/data/quran/` — لا توليد بالذكاء الاصطناعي.

## ضعف جذري عولج في هذه الجولة
1. مقاطع صوتية منفصلة بلا تداخل → نافذة متداخلة + إزالة تكرار البادئة.
2. ثقة Whisper كانت `undefined` دائمًا → ثقة تقديرية 72 لتفعيل needs_repeat بدل الجزم.
3. unclear/needs_repeat كانت تُقدِّم المؤشر → تعليق المؤشر حتى إعادة النطق.
4. gentle ≈ medium بلا فرق → `session-event-policy` يفرّق المستويات.
5. `wrong_ayah_jump` بلا مُنتج → كشف سلسلة استبدال متتالية في post-process.
6. لا مؤشر مستوى صوت / Wake Lock → أُضيفا.
7. تسمية أوضاع أوضح + وضع `listen_repeat` (يُحفَظ كـword_follow حتى توسعة قيد DB).

## مزودات الذكاء الاصطناعي
| مزود | الدور | مفاتيح |
|---|---|---|
| Groq whisper-large-v3 عبر `/api/recitation-transcribe` | Safari/PWA/fallback | `GROQ_API_KEY` خادم فقط |
| SFSpeech / Android SR | Capacitor أصلي | بلا مفتاح سحابي |
| Web Speech API | Chrome/Edge | متصفح |

## ما لم يُكتمل بعد (قيود صادقة)
- تجويد فونيمي حقيقي (لا مزود يدعمه بعد — الزر يبقى معطّلًا بصدق).
- بث WebSocket حقيقي (قيود Vercel serverless).
- ثقة أصلية من iOS SFSpeech segments (يتطلب تعديل Swift + cap sync).
- WER على تسجيلات بشرية حقيقية في CI (الاختبارات نصية + سياسة + تداخل).
- توسعة قيد DB لـ`listen_repeat` وربط تشغيل قارئ قبل الميكروفون بالكامل.

## ترتيب أثر لاحق
1. ثقة أصلية من الجسر iOS.
2. harness صوتي بمقاطع مصرَّح بها.
3. هجرة SQL لـ`listen_repeat` + تشغيل آية ثم تسميع.
4. PCM native capture إن لزم WebView.
