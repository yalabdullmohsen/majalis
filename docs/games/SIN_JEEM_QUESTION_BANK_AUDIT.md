# سين جيم — تدقيق بنك الأسئلة (أرقام فعلية)

**تاريخ:** 2026-09-26  
**مصدر العد:** `buildFullQuizBank()` من `artifacts/majalis/src/data/quiz-bank`  
**مرجع الجرد:** `docs/games/SIN_JEEM_ROOT_CAUSE_AND_CONTENT_AUDIT.md`

| المقياس | العدد |
|---------|------:|
| Total questions (local bank) | 490 |
| Published (local) | 0 |
| Approved path ready for publish (`canPublishQuestion`) | 0 — كل المحلي DRAFT بلا مصدر مكتمل |
| DRAFT | 490 |
| NEEDS_SOURCE | 0 (المحلي الحالي يُصنَّف DRAFT عند غياب المصدر) |
| Needs review (sharia/language/factual PENDING) | 490 |
| Duplicates (id) | 0 |
| Duplicates (question text) | 0 |
| Missing primary category | 0 (كل صف له `categoryId`) |
| Multiple primary categories | 0 في صف واحد — التداخل عبر **fallback برك** لا عبر حقول متعددة |
| Missing answer | 0 |
| Missing source | 490 |
| Excluded from Release (local) | **490** — كلها غير PUBLISHED |

## Per-category (أسئلة مملوكة فعليًا)

انظر جدول القسم 2 في مستند الجذر.  
19 فئة ورقة بلا أسئلة خاصة.

## Per-type

OPEN 483 · TRUE_FALSE 2 · MULTIPLE_CHOICE 2 · COMPLETE_TERM 1 · ORDER_ITEMS 1 · MATCH_ITEMS 1

## ملاحظة عدّاد المنصة

`content-counts.json` → `quizQuestions: 8573` يخص حزم `public/data/quiz` التعليمية، **لا** بركة لعبة سين جيم.
