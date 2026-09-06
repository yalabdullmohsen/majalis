# تدقيق محتوى الفقه

- التاريخ: 2026-09-06 21:50 UTC
- الجولة: v5 — حزم مراجعة ترقية (promotionReview) دون ترقية فعلية
- المسائل المنشورة: 1103 | أمثلة: 270 | نوازل داخلية: 4
- review_ready: 2 | hold: 2 | lessonCandidate: 2 | promotionReview: 2 | promotionApproved: 0

## الحالة

- الكتالوج العام مكتمل.
- مرشّحا الدروس + حزم التوقيع داخل `deferred-nawazil.json` فقط.
- اكتشاف اتساق: باب زيارة القبور المنشور يذكر كراهة زيارة النساء؛ v5 يحاذي ذلك.
- لا نقل إلى `books.json` قبل توقيع بشري صريح على `humanDecision.promotionApproved`.

## مؤجّل خارج الكتالوج العام

| المعرّف | المرحلة | مرشّح | حزمة ترقية | الوضع المقترح |
|---|---|---|---|---|
| `libas-shuhra-muasir` | `review_ready` | نعم | awaiting_human_signoff | `insert_new_lesson` |
| `ziyarat-nisa-qubur` | `review_ready` | نعم | awaiting_human_signoff | `align_existing_then_optional_insert` |
| `shubuhat-ghidhaiyya-muasira` | `hold` | لا | لا | ممنوع |
| `nawazil-jihad-muasira` | `hold` | لا | لا | ممنوع |

## المنهج

- تعليمي حنبلية المصدر.
- `promotionReview` يجهّز القرار البشري ولا ينفّذ الترقية.
- `hold` بلا مرشّح وبلا حزمة ترقية.
