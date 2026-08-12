# عمل واجهة مؤجّل — اكتُمل الربط (2026-07-26)

انظر PR: https://github.com/yalabdullmohsen/majalis/pull/356

البنود أدناه نُفّذت في فرع `content/deferred-ui-trust`.

## 1) شارة درجة التوثيق `SourceBadge`

- مكوّن جديد مقترح: `src/components/content-trust/SourceBadge.tsx` (في فرع المؤجّل).
- يعرض `trust_level` الخمس: primary_text / scholarly_source / institutional_ruling / general_reasoning / unsourced.
- **مهم:** لا تستخدم `documentation_level` في المسائل الفقهية كشارة ثقة — ذلك الحقل بوابة عرض (`official_verified`). الشارة تقرأ `trust_level` فقط.

## 2) تاريخ التحديث واسم المراجع

- عرض `last_updated_at` و`reviewed_by` (أو `reviewed_at` عند وجود مراجعة فعلية) على صفحات المحتوى.
- الحقل التحريري `editorial_review_status` منفصل عن `review_status` التشغيلي في QA (`approved`).

## 3) بوابة النشر `publication_gate`

- إخفاء أو وسم السجلات ذات `publication_gate: "blocked"` و/أو `text_flags` يتضمن `SUSPECT_TEXT`.
- لا تُصحَّح المتون من الواجهة؛ تُحجب حتى مراجعة بشرية.

## 4) سطر `package.json`

أضف (عندما يأمن التعارض مع النافذة الأخرى):

```json
"verify:citations": "node scripts/verify-citations.mjs"
```

واربطه ببوابة الجودة المحلية/CI إن وُجدت. **نافذة المحتوى لم تعدّل `package.json`.**

## 5) صفحة المنهجية `/methodology`

- النص الجاهز في `docs/methodology-page-content.md`.
- اربط المحتوى بصفحة `/methodology` الموجودة دون اختراع مسار جديد.

## 6) تعارضات متجنَّبة

| المطلوب | السبب |
|---|---|
| خفض `documentation_level` في الفقه | يخفي المسائل من العرض العام |
| تعديل `src/components/**` / `src/views/**` | ملكية نافذة الواجهة |
| تعديل `package.json` / إعداد البناء | ملكية نافذة الواجهة |
| صفحات `/privacy` `/terms` `/contact` | خارج نطاق هذه الجلسة + ملكية أخرى |
