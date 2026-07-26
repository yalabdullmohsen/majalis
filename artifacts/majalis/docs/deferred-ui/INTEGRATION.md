# تعليمات دمج PR الواجهة المؤجّل

**عنوان PR:** `[محتوى] مؤجّل — يدمج بعد انتهاء أعمال الواجهة`  
**لا يُدمج قبل اكتمال أعمال واجهة الإصلاح الموازية.**

## الملفات الجديدة في هذا الفرع

| ملف | الغرض |
|---|---|
| `src/components/content-trust/SourceBadge.tsx` | شارة `trust_level` |
| `src/components/content-trust/ReviewMeta.tsx` | تاريخ التحديث / المراجع |
| `src/components/content-trust/PublicationGate.tsx` | إخفاء `blocked` / `SUSPECT_TEXT` |
| هذا الملف | تعليمات الربط |

## خطوات الربط (بعد استقرار فرع الواجهة)

1. ادمج أولاً فرع المحتوى `content/citation-trust-pipeline` (مخطط + بيانات + سكربت).
2. أضف إلى `package.json` (يملكه فرع الواجهة):
   ```json
   "verify:citations": "node scripts/verify-citations.mjs"
   ```
3. اربط `SourceBadge` في بطاقات المسائل/الأسئلة/الأسماء حيث يُعرض الدليل.
4. اربط `ReviewMeta` أسفل صفحات المحتوى.
5. لفّ المحتوى الحسّاس بـ `PublicationGate`.
6. انسخ نص `docs/methodology-page-content.md` (من فرع المحتوى) إلى صفحة `/methodology`.

## ممنوع عند الدمج

- استخدام `documentation_level` كشارة ثقة.
- تصحيح متون آيات/أحاديث من الواجهة.
- ملء `reviewed_by` بقيم آلية.
