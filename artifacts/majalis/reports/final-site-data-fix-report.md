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

## تدقيق جودة البيانات

تقرير مفصل: `reports/data-quality-audit.md` + `reports/data-quality-audit.json`  
الأمر: `pnpm run audit:data-quality`

### السجلات المفحوصة

| النوع | العدد |
|---|---|
| prophets | 25 |
| books | 173 |
| scholars | 135 |
| sins-and-rights | 26 |
| surah stories | 114 |
| fiqh issues | 64 |
| adhkar | 329 |
| lessons | 39 |

### الأخطاء المؤكدة في مصدر البيانات

| الشدة | العدد | ملاحظات |
|---|---|---|
| critical | 0 | بعد إصلاح slug الشمائل |
| high | 0 | — |
| medium | 162 | كلها `source_pending` لكتب بلا `external_url` — **auto_fix_allowed=false** |
| schema_gap | 100 | حقول مثالية غير موجودة في النموذج الحالي — لا اختراع قيم |

### ما أُصلح (مثبت في البيانات)

| السجل | الخطأ | التعديل |
|---|---|---|
| `book-shamaild-tirmidhi` | typo في الـid مقابل عنوان «الشمائل» | أُعيد إلى `book-shamaail-tirmidhi` + alias + redirect 301 في `vercel.json` |

### ما تُرك — لم يثبت في مصدر البيانات الحالي

| الادعاء | السبب |
|---|---|
| عناوين «كتاب شرعي» / «قصة سورة» كعناوين سجلات | موجودة فقط كاحتياطي SPA في `seo.ts` — ليست حقول title في بيانات الكتب/القصص |
| boilerplate أنبياء | لا مطابقات في `prophets-data.ts` |
| بريد قديم داخل data records | لا |
| «رابط القراءة» كـ source_title | لا |
| duplicate slugs كتب/علماء | لا |
| ذو الكفل كنبوة قطعية بلا خلاف | البيانات تعترف بالخلاف صراحة |

### noindex / sitemap (بيانات → فهرسة)

- 162 كتاباً `source_pending` تبقى noindex وخارج sitemap (منطق المولّد السابق).
- `book-shamaail-tirmidhi` بلا مصدر → noindex أيضاً.

### يحتاج مراجعة شرعية / إكمال مصادر

- إضافة `external_url` موثوق لكتب `source_pending` ثم إعادة فهرستها.
- توسيع مخطط الأنبياء (`status` / `reviewStatus` / `sources`) لاحقاً بمراجعة بشرية — لا auto-fix.

### اختبارات

- `test/data-quality.spec.ts` — يمنع رجوع العنوان العام، الـslug المكرر، shamaild، المصدر الوهمي، boilerplate الأنبياء، البريد القديم في السير.

---

## نتائج الأوامر

| الأمر | النتيجة |
|---|---|
| `build` | OK |
| `audit:data-quality` | OK (بعد إصلاح الشمائل) |
| `audit:strict-evidence` | OK |
| `audit:final-content` | OK |
| `typecheck` | OK |
| `lint` | OK |
| `test:data-quality` | OK |

---

## الخلاصة

- لا بريد قديم في dist.
- لا placeholder مصدر «رابط القراءة» في dist.
- صفحات قيد الإعداد / كتب بلا مصدر: noindex وخارج sitemap.
- لا تزكيات مطلقة محظورة بلا سياق في dist.
- إصلاح بيانات مثبت واحد: slug الشمائل + redirect.
- **162** كتاباً بانتظار مصدر حقيقي (medium، بلا تعديل تلقائي).
