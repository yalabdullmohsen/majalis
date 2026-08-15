# التقرير النهائي — تدقيق بيانات الموقع (Evidence-Gated)

تاريخ: 2026-08-15  
الأساس: دمج #1138 + تقرير ما قبل الإصلاح `reports/pre-fix-evidence-audit.md`

## 1) ملخص القرار

| السؤال | الجواب |
|---|---|
| هل الموقع صالح للنشر من جهة ادعاءات هذا التدقيق؟ | **نعم** — على فرع الكود الحالي بعد نجاح البوابات المحلية |
| صفحات غير صالحة للفهرسة؟ | `knowledge-graph` (قيد إعداد + noindex) — مقصود |
| يحتاج مراجعة شرعية بشرية؟ | مسائل `general_reasoning` في المجمع؛ كتب `needs_source`؛ أي توسع قصصي خارج النص القرآني |

**قاعدة هذه الجولة:** لم يثبت ادعاء يستوجب تعديل محتوى شرعي إضافي؛ التعديلات اقتصرت على أدوات التدقيق والتقارير.

---

## 2) الادعاءات التي ثبتت

| الادعاء | الدليل | الملف/الصفحة | الإجراء |
|---|---|---|---|
| البريد الرسمي موجود | `contactEmail` | `site.config.json` | تُرك كما هو (صحيح) |
| تنبيهات كتب/علماء حساسة موجودة | caution + contentStatus | `library-catalog.ts` / `scholars-data.ts` | تُرك كما هو |
| بنية أنبياء سليمة | `<dl>` + nav تنقل خارج article | `ProphetStoriesPage.tsx` | تُرك كما هو |
| knowledge-graph قيد إعداد | نص + robots noindex | `seo-prerender/knowledge-graph` | تُرك كما هو (محجوب عن الفهرسة) |

لا بند «ثبت كخطأ إنتاجي ويلزم إصلاحاً» في هذه الجولة.

---

## 3) الادعاءات التي لم تثبت

| الادعاء | أين تم البحث | سبب الترك |
|---|---|---|
| حشو الأنبياء الآلي | `prophets-data.ts` + `seo-prerender/prophets/*` | لم يثبت الادعاء، تُرك كما هو |
| واجهة داخل article/meta/JSON-LD | prerender الأنبياء + المصدر | لم يثبت الادعاء، تُرك كما هو |
| التصاق حقول/قيم حرفياً | أمثلة المستخدم + `<dl>` | لم يثبت؛ الفاصل `:` موجود |
| بريد قديم في production | src + data + seo-prerender | لم يثبت الادعاء، تُرك كما هو |
| صفحات ناقصة داخل sitemap مفهرسة | prerender + sitemap | لم يثبت (ما عدا noindex المقصود) |
| تزكيات مطلقة ممنوعة | `src/lib` | لم يثبت بالصيغ المحظورة |
| اعتماد أزهري/مآذن | `src` | لم يثبت؛ ذكر مؤسسي/تاريخي فقط |
| Home fallback | 909 صفحة prerender | العدد 0 |

---

## 4) التعديلات في هذه الجولة

### نصوص محذوفة / معدّلة (محتوى شرعي)
لا شيء — لم يثبت ما يستوجب ذلك.

### صفحات noindex / 404 جديدة
لا تغيير جديد؛ `knowledge-graph` يبقى noindex كما هو.

### ملفات أُضيفت/حُدّثت (أدوات)
- `reports/pre-fix-evidence-audit.md` (مرحلة 1)
- `reports/final-site-data-fix-report.md` (هذا الملف)
- `scripts/audit-seo-indexing.ts`
- `scripts/audit-islamic-content.ts`
- `package.json` → `audit:seo` / `audit:islamic-content` / `audit:final-content`

(السكربتات السابقة `audit-site-data` / `audit-rendered-content` بقيت من الدمج.)

---

## 5) نتائج الأوامر

| الأمر | النتيجة |
|---|---|
| `audit:final-content` | OK (site-data + rendered + seo + islamic) |
| `typecheck` | OK |
| `lint` | OK |
| `build` | OK |
| `test:site-data-evidence` | OK |

---

## 6) قائمة أخيرة

### محتوى آمن للنشر (ضمن نطاق الفحص)
- قصص الأنبياء الـ25 (بلا حشو مثبت، meta من الملخص، حقائق بـ dl)
- المكتبة/العلماء الحساسون مع caution
- البريد الرسمي فقط

### محتوى يحتاج مراجعة بشرية
- مسائل فقهية `general_reasoning` / unreviewed
- كتب بلا `external_url` (`needs_source`)
- أي زيادة على قصص الأنبياء خارج الوحي الثابت

### محجوب عن الفهرسة
- `/knowledge-graph` (قيد الإعداد + noindex)
