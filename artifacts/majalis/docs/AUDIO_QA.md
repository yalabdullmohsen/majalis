# جودة الصوت (Audio QA)

## مصدر الفحص
- `pnpm run audit:audio:stratified` — 200 ملف/قارئ (بوابة)
- `pnpm run audit:audio:full` — 6236 ملف (ليلاً)
- النتيجة: `docs/AUDIO_QA.last-audit.json`

## جدول QA

| reciterId | المصدر | checked | status | LUFS | mode |
|---|---|---:|---|---|---|
| `husary` | EveryAyah 128 | 200 | pass | n/a | stratified |
| `minshawi` | EveryAyah 128 | 200 | pass | n/a | stratified |
| `alafasy` | EveryAyah 128 | 200 | pass | n/a | stratified |

> آخر تحديث: 2026-08-19T17:28:51.590Z — mode=stratified
