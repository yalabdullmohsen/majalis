# تدقيق محتوى الفقه

- التاريخ: 2026-09-06 22:22 UTC
- الجولة: v7 — أداة تطبيق مغلقة + ورقة توقيع (بلا إدراج)
- المسائل المنشورة: 1103 | أمثلة: 270 | نوازل داخلية: 4
- review_ready: 2 | hold: 2 | promotionPreview: 2 | insertedIntoBooksJson: 0 | promotionApproved: 0

## الحالة

- الكتالوج العام مكتمل ولم يُمس.
- أُضيف `scripts/apply-fiqh-promotion.mjs` ويرفض التشغيل بلا بوابات.
- ورقة التوقيع: `content/fiqh/PROMOTION_SIGNOFF.md`
- «اكمل» لا تُفعّل الترقية.

## أوامر الاعتماد الحرفيّة (لاحقاً)
- `اعتمد ترقية لباس الشهرة إلى books.json`
- `اعتمد ترقية زيارة النساء للقبور إلى books.json`

## مؤجّل خارج الكتالوج العام

| المعرّف | المرحلة | المعاينة | مُدرج؟ |
|---|---|---|---|
| `libas-shuhra-muasir` | `review_ready` | `libas-shuhra-dawabit` | لا |
| `ziyarat-nisa-qubur` | `review_ready` | `janaza-ziyara-nisa-taalim` | لا |
| `shubuhat-ghidhaiyya-muasira` | `hold` | — | — |
| `nawazil-jihad-muasira` | `hold` | — | — |

## المنهج

- التطبيق الفعلي يحتاج: توقيع JSON + `--approve` الحرفي + اكتمال checklist.
- المعاينة وحدها لا تكتب إلى `books.json`.
