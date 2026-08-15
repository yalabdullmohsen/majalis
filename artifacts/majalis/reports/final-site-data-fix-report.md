# التقرير النهائي — تدقيق بيانات الموقع (STRICT_EVIDENCE_ONLY)

تاريخ: 2026-08-15  
الفرع: `cursor/final-evidence-audit-20260815`  
سجل الأدلة: `reports/evidence-register.md`  
تقرير dist: `reports/strict-evidence-audit.md`

## قاعدة الجولة

لا تعديل إلا إذا ثبت في **الكود الحالي** أو **dist بعد build**.  
نتائج Google = إشارة فحص فقط.

---

## جدول STRICT_EVIDENCE

| الادعاء | الدليل من الفهرسة | الدليل من الكود | الدليل من dist | القرار | التعديل | هل أضيف اختبار؟ | هل يحتاج مراجعة شرعية؟ |
|---|---|---|---|---|---|---|---|
| `info@majlisilm.com` | إشارة Google سابقة | لا مطابقات في src/public/prerender | لا في dist | اترك | لا | نعم (`audit:strict-evidence` + spec) | لا |
| `yalabdullmohsen1@gmail.com` | إشارة Google سابقة | لا | لا | اترك | لا | نعم | لا |
| «رابط القراءة» كمصدر | curl إنتاج قديم | لا في المولّد/prerender الحالي | لا؛ book-qurtubi = فتح المصدر + URL | اترك (إصلاح سابق كافٍ) | لا جديد | نعم | لا |
| «قراءة المصدر ←» في الفوائد | — | زر CTA مع `original_url` | حزم JS إن وُجدت | اترك | لا | — | لا |
| قيد مراجعة مفهرس على كتب | إشارة | فقط `/methodology` كتوثيق | methodology فقط | اترك | لا | نعم (يفشل إن ظهر بلا noindex خارج methodology) | لا |
| كتب بلا مصدر في sitemap | sitemap قديم | منطق noindex مطبّق | noindex + خارج sitemap | noindex مؤكَّد | لا جديد | نعم | نعم عند إضافة مصادر |
| KG: قيد إعداد + توثيق كامل | إنتاج حي كان index | قيد إعداد بلا دعوى توثيق كامل | noindex في dist | اترك / noindex مؤكَّد | لا جديد | نعم | نعم قبل رفع الفهرسة |
| «غير المنازع» / «فيلسوف الإسلام الأكبر» | قوائم فحص | لا للصيغ المطلقة المحظورة | لا | اترك | لا | نعم | لا |
| ألقاب تراجم (حجة الإسلام بتحفّظ، شيخ الإسلام…) | — | سياق تاريخي | مطابق | اترك | لا | جزئي | لا |

**ظهر في الفهرسة ولم يثبت في الكود/dist:** البريدان القديمان، و«رابط القراءة» على الإنتاج الحي القديم — تُرك كما هو، وينتظر إعادة زحف محركات البحث بعد نشر الفرع.

---

## تعديلات هذه الجولة (أدوات فقط — 0 تعديلات محتوى)

| ملف | الغرض |
|---|---|
| `reports/evidence-register.md` | سجل أدلة إلزامي E-001…E-012 |
| `scripts/audit-strict-evidence.ts` | فحص dist + sitemap → JSON/MD |
| `test/strict-evidence.spec.ts` | منع رجوع نصوص محظورة في dist |
| `package.json` | `audit:strict-evidence` |
| `scripts/audit-site-data.ts` | استثناء سكربتات/اختبارات التدقيق من C4 |

---

## نتائج الأوامر

| الأمر | النتيجة |
|---|---|
| `build` | OK |
| `audit:strict-evidence` | OK (0 أخطاء، 1821 HTML، 734 أصل) |
| `audit:final-content` | OK |
| `typecheck` | OK |
| `lint` | OK |
| `test:strict-evidence` | OK |

---

## الخلاصة

- لا بريد قديم في dist.
- لا placeholder مصدر «رابط القراءة» في dist.
- صفحات قيد الإعداد / كتب بلا مصدر: noindex وخارج sitemap.
- لا تزكيات مطلقة محظورة بلا سياق في dist.
- **لا إصلاح محتوى جديد** لأن STRICT_EVIDENCE لم يثبت خطأً جديداً في الكود/dist الحالي.
