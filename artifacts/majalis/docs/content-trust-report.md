# تقرير سد فجوة التوثيق والثقة

تاريخ الجلسة: 2026-07-25  
الفرع الرئيسي للعمل: `content/citation-trust-pipeline`  
فرع مؤجّل للواجهة: `content/deferred-ui-trust` (PR منفصل — لا يُدمج الآن)

## ملخص تنفيذي

أُنشئت سياسة تحريرية ومخطط اقتباس ودرجات توثيق، وجُردت البذور بأرقام محسوبة، ودُقّقت نسبة الأحاديث، وخُفضت ادّعاءات التوثيق عبر `trust_level` دون كسر بوابة عرض الفقه، وأُزيلت/أُكّدت إزالة المراجع الدائرية، وبُنيت قائمة مراجعة أسبوعية، وسكربت انحدار `verify-citations.mjs` (ناجح عند الإغلاق)، ونص منهجية للقارئ، وPR واجهة مؤجّل.

---

## المراحل

| المرحلة | المنجز | الملفات |
|---|---|---|
| 0 | سياسة تحريرية (ضمن #357) | `docs/editorial-policy.md` |
| 1 | مخطط Citation + TrustLevel + توافق | `src/lib/citation-schema.ts` |
| 2 | جرد دقيق | `docs/documentation-inventory.md` |
| 3 | تدقيق نبوي + تأكيد عزل curriculum | `docs/hadith-audit.md` + حقول curriculum |
| 4 | خفض الادّعاء عبر `trust_level` | `fiqh-issues-seed.ts` + `docs/trust-level-changes.md` |
| 5 | دائري/قوالب/أسماء الـ99 | quiz=0 دائري؛ asma 13→unsourced |
| 6 | backlog أسبوعي | `docs/citation-backlog.md` (424 بنداً / 17 دفعة) |
| 7 | حقول مراجعة | `editorial_review_status` + `last_updated_at` (بلا أسماء مراجعين مخترعة) |
| 8 | بوابة انحدار | `scripts/verify-citations.mjs` — **OK**؛ `package.json` مؤجّل |
| 9 | نص المنهجية | `docs/methodology-page-content.md` |
| 10 | PR واجهة مؤجّل **#356** | مكوّنات جديدة تحت `content-trust/` + تعليمات |

أرقام PR:

- المحتوى (مراحل 0–9): https://github.com/yalabdullmohsen/majalis/pull/357
- المؤجّل واجهة (مرحلة 10): https://github.com/yalabdullmohsen/majalis/pull/356 — **لا يُدمج الآن**


---

## جدول الجرد — قبل / بعد

| الملف | العدد | قبل (ملخص تقرير سابق) | بعد (درجات trust/استدلال) |
|---|---:|---|---|
| qa-seed.ts | 360 | 254 بلا evidence / 161 بلا reference | evidence null=155، reference null=142، كلاهما=142؛ unsourced≈149 |
| quiz-seed.ts | 1024 | ~100 مرجع دائري قالبي | circular=**0**، templated=**0**، بلا reference=927 |
| fiqh-issues-seed.ts | 64 | 61 أدلة عامة مع official_verified | `documentation_level` كما هو؛ `trust_level`: general=49، institutional=8، scholarly=4، unsourced=3 |
| fawaid-seed.ts | 616 | 526 بلا author | noAuthor=60، empty/null author_name=527 |
| fawaid-curated-seed.ts | ~210 | — | أُضيف `trust_level` عند التصدير |
| asma-husna-data.ts | 99 | مراجع حديث الـ99 لأسماء | 13→`unsourced`، 86→`primary_text` (آية) |
| islamic-stories-seed.ts | 85 | — | unsourced=85 (لا حقل مرجع مستقل) |
| miracles-seed.ts | 60 | — | primary=15، general=3، unsourced=42 |
| rulings-encyclopedia-seed.generated.ts | 200 | — | primary=15، scholarly=12، general=50، unsourced=123 |
| curriculum-topics.json | 36 | 4 مواضع مشبوهة | primary=19، general=17؛ watched 1/4/5/10 **مفتوحة** بعد تأكيد العزل |

---

## السجلات التي خُفضت درجتها

- **64** مسألة فقهية: لم تُمسّ `documentation_level`؛ أُضيفت `trust_level` الصادقة (49 general_reasoning، 3 unsourced، …). السبب: قاعدة عامة ≠ مصدر.
- **13** اسماً حسناً: من الاعتماد على «الحديث: تسعة وتسعون اسماً» إلى `unsourced`.
- التفاصيل: `docs/trust-level-changes.md`.

---

## NEEDS_HUMAN / SUSPECT_TEXT / publication_gate

| النوع | الحالة |
|---|---|
| NEEDS_HUMAN (تدقيق حديث) | 217 موضعاً في `docs/hadith-audit.md` + 7 حقول `takhrij_status` في QA |
| SUSPECT_TEXT | **0** متبقٍ في نسبة نبوية بعد تنقية الإنذارات الكاذبة |
| curriculum-1/4/5/10 | عُزلت سابقاً؛ لا لاتيني في المتن؛ `publication_gate=open` |
| publication_gate=blocked في البيانات | لا سجلات محجوبة حالياً بعد تصحيح الإنذار الكاذب على مفاتيح JSON |

---

## تعارضات مع نافذة الواجهة

| الموقف | التصرف |
|---|---|
| خفض `documentation_level` كان س يخفي المسائل | تُرك؛ استُخدم `trust_level` |
| `package.json` | لم يُعدَّل؛ طُلب في `deferred-ui-work.md` |
| `src/components/**` و`src/views/**` | لم تُمس؛ فرع مؤجّل بملفات جديدة فقط |
| `review_status` التشغيلي في QA | لم يُستبدل؛ أُضيف `editorial_review_status` |

---

## يحتاج بشراً

1. متون/تخاريج `NEEDS_HUMAN` في تدقيق الحديث والدفعات الأسبوعية.
2. أسماء مراجعين حقيقيين — **ممنوع** ملء `reviewed_by` آلياً.
3. صفحات قانونية `/privacy` `/terms` `/contact` — خارج هذه الجلسة.
4. مراجعة ما إذا كان أي حديث ضعيف ما زال يُعرض استدلالاً في واجهة حيّة (بعد ربط `publication_gate`).

---

## جدول ختامي

| المرحلة | تعديلات تقريباً | البناء | verify-citations |
|---|---:|---|---|
| 0–1 | سياسة + مخطط | لم يُكسر استهلاك الواجهة | — |
| 2–3 | وثائق جرد/تدقيق | — | — |
| 4–5 | 64 فقه + 99 أسماء + منهج | حقول اختيارية | — |
| 6–7 | backlog + حقول مراجعة | — | — |
| 8 | سكربت تحقق | — | **OK** (تحذيرات unreviewed متوقعة) |
| 9–10 | نص منهجية + PR مؤجّل | ملفات جديدة فقط في المؤجّل | — |

تشغيل التحقق:

```bash
node artifacts/majalis/scripts/verify-citations.mjs
```

## إكمال لاحق (2026-07-26)

طُبّق `trust_level` + `editorial_review_status` + `last_updated_at` على:

- QA (360) · Quiz (1024) · Fawaid (616) · Stories (85) · Miracles (60)

`verify-citations`: OK · `tsc --noEmit`: بلا أخطاء جديدة من هذه الحقول.

فروع `content/*` مستثناة من workflow الدمج التلقائي — #356 يبقى غير مدمج كما هو مطلوب.

