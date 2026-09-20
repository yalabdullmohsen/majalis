# SCHOLAR_REVIEW_QUEUE

قائمة مراجعة بشرية شرعية — **ليست** اعتمادًا للنشر.  
لا تُعرض للعامة. لا يُعتبر الإدراج هنا `VERIFIED`.

**قاعدة:** الذكاء الاصطناعي ليس مراجعًا شرعيًا نهائيًا.  
يُسمح بالنشر العام فقط بعد `APPROVED` أو `APPROVED_WITH_CORRECTION`.

| معرف داخلي | Route / سطح | نوع المادة | الادعاء المختصر | سبب المراجعة | المصدر الحالي | المصدر الناقص | خطورة | القرار المطلوب | المراجع | تاريخ | نتيجة | ملاحظات |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SRQ-LIB-001 | `/search` (مكتبة) | كتب بلا رابط ناشر | 172 كتابًا ببليوغرافيًا بلا `external_url` | NEEDS_SOURCE / BLOCKED_SOURCE | فهرس المكتبة الداخلي | رابط ناشر أو ترخيص واضح لكل كتاب | P0 | OWNER يزوّد الروابط أو يبقيها ببليوغرافية بلا ادّعاء توفر | | | | لا تختلق روابط |
| SRQ-FIQH-SQL-001 | Hosted Supabase | صفوف `fiqh_council` | بقايا جداول المجمع بعد إلغاء المنتج | EXCLUDED منتجًا؛ تنظيف SQL معلّق | تحويلات الواجهة إلى `/fiqh` | موافقة مالك على purge | P0 | OWNER_ACTION: purge SQL | | | | لا تعيد المنتج |
| SRQ-RUL-ARCH-001 | أرشيف rulings | pending_review | ~119 سجل أرشيف غير منشور | DRAFT / NEEDS_SCHOLAR_REVIEW | seeds أرشيفية | مراجعة عالم + مصدر خارجي | P1 | لا تنشر قبل المراجعة | | | | |
| SRQ-BOOK-UMDA | `/fiqh` stubs | متن عمدة / بلوغ | stubs كتب بلا أصل منشور كافٍ | BLOCKED_SOURCE | واجهة معطّلة | أصل مرخّص + متن موثّق | P1 | إبقاء محجوب | | | | |
| SRQ-ALIAS-001 | علماء / aliases | أسماء بلا ملف عالم | aliases بلا `SCHOLAR_PROFILES` | BLOCKED_SOURCE | قائمة aliases | ترجمة موثّقة أو إبقاء بلا رابط | P2 | لا تختلق تراجم | | | | |
| SRQ-QUIZ-BANK-001 | `/quiz` تحدي الأسئلة | بنك أسئلة محلي | ~490 سؤالًا بلا مسار SOURCE/HUMAN | DRAFT / NEEDS_SOURCE — محجوب عن PUBLISHED | `islamicQuizData` + `quiz-bank` | مصادر قابلة للتتبع + مراجعة شرعية/لغوية منفصلة | P0 | لا تنشر قبل SOURCE_VERIFIED ثم HUMAN_REVIEWED؛ Batch1: قرآن/حديث/عقيدة/فقه/سيرة/نحو/بلاغة | | | | الذكاء الاصطناعي لا يضع PUBLISHED |


## قرارات المراجع (لاحقاً)

`APPROVED` · `APPROVED_WITH_CORRECTION` · `REJECTED` · `NEEDS_MORE_EVIDENCE`

فقط الأولان ينتقلان إلى `VERIFIED` ثم النشر العام.
