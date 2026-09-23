# مسار الحفظ + البحوث الشرعية — فهرس البرنامج

**الحالة الحالية:** PR-0…PR-4 · عقود الحفظ خلف Flags OFF · فهرس البحوث على `/academic-research` · لا `SUNNAH_MEMORIZATION_AND_RESEARCH_READY`

| وثيقة | دور |
|---|---|
| [`PR0_CONTRACTS.md`](./PR0_CONTRACTS.md) | تحليل · عقود بيانات · مصادر/حقوق · جرد موجود · خطة PR |
| [`OWNER_ACTIONS.md`](./OWNER_ACTIONS.md) | قرارات مالك الحقوق فقط (لا ينفّذها الوكيل) |
| [`path-templates.json`](./path-templates.json) | قوالب مسارات حفظ — كلها غير منشورة |
| [`research-inventory.json`](./research-inventory.json) | جرد البحوث المفهرسة (عقد scholarly = 0) |

## كود العقود (خلف العلم)

| مسار | دور |
|---|---|
| `artifacts/majalis/src/lib/memorization-path/*` | أعلام · أنواع · تقدم محلي · كتالوج فارغ للعامة |
| `artifacts/majalis/src/pages/hifz-path/*` | Hub · محفوظاتي · تصنيف · مسار · وحدة/ممارسة |
| `artifacts/majalis/src/lib/scholarly-research/*` | حوكمة مراجعات + بحث كتالوج فارغ فوق `/academic-research` |
| `artifacts/majalis/src/lib/researches/*` + `AcademicResearchPage` | السطح الحي للفهرس/الفلاتر |
| `test:memorization-research-pr0` … `pr4` | بوابات نصية |

## مبادئ ثابتة

1. لا نص شرعي مخترع · لا PDF معاد الاستضافة بلا إذن.
2. القرآن من المصدر المعتمد في المشروع فقط — لا قاعدة نص موازية.
3. البحوث = فهرس ورابط أصلي · ليست ناشراً للملف.
4. المراجعة المنهجية بشرية فقط · لا اعتماد آلي للمنهج.
5. الصياغة للمستخدم: «مسارات مقترحة للحفظ بحسب المستوى والهدف» — لا حكم مطلق.
