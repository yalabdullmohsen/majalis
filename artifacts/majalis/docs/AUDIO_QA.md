# جودة الصوت (Audio QA)

هذا المستند يلخّص نتيجة فحص الجودة لملفات صوت التلاوة المعروضة للمستخدم.

## مصدر الفحص
- السكربت: `scripts/audit-audio.mjs` (`pnpm run audit:audio`)
- يقرأ `public/data/audio/audio-registry.json`
- يخرج نتيجة آخر تشغيل في: `docs/AUDIO_QA.last-audit.json`

## جدول QA

| reciterId | المصدر | expected files | status | ملاحظات |
|---|---|---:|---|---|
| `husary` | EveryAyah (128kbps) | 50 checked | pass | avg n/a |
| `minshawi` | EveryAyah (128kbps) | 50 checked | pass | avg n/a |
| `alafasy` | EveryAyah (128kbps) | 50 checked | pass | avg n/a |

> آخر تحديث: 2026-08-19T17:07:54.757Z (وضع quick — فحص جزئي)
