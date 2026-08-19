# جودة الصوت (Audio QA)

هذا المستند يلخّص نتيجة فحص الجودة لملفات صوت التلاوة المعروضة للمستخدم.

## مصدر الفحص
- السكربت: `scripts/audit-audio.mjs`
- يقرأ `public/data/audio/audio-registry.json`
- يخرج نتيجة آخر تشغيل في: `docs/AUDIO_QA.last-audit.json`

## جدول QA (حالة التجهيز)

> ملاحظة: يتم تحديث “النتيجة الدقيقة” بعد تشغيل سكربت `audit-audio.mjs` في بيئة تتوفر فيها أدوات `ffprobe` و `ffmpeg`.

| reciterId | المصدر | expected files | status | ملاحظات |
|---|---|---:|---|---|
| `husary` | EveryAyah (128kbps) | 6236 | pending | run `node scripts/audit-audio.mjs` |
| `minshawi` | EveryAyah (128kbps) | 6236 | pending | run `node scripts/audit-audio.mjs` |
| `alafasy` | EveryAyah (128kbps) | 6236 | pending | run `node scripts/audit-audio.mjs` |

