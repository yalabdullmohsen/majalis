# مسار الحفظ + البحوث الشرعية — فهرس البرنامج

**الحالة الحالية:** PR-0…PR-2 · **Feature Flags OFF** · Routes مسجّلة لكن مغلقة للعامة · لا `SUNNAH_MEMORIZATION_AND_RESEARCH_READY`

| وثيقة | دور |
|---|---|
| [`PR0_CONTRACTS.md`](./PR0_CONTRACTS.md) | تحليل · عقود بيانات · مصادر/حقوق · جرد موجود · خطة PR |
| [`OWNER_ACTIONS.md`](./OWNER_ACTIONS.md) | قرارات مالك الحقوق فقط (لا ينفّذها الوكيل) |
| [`path-templates.json`](./path-templates.json) | قوالب مسارات حفظ — كلها غير منشورة |
| [`research-inventory.json`](./research-inventory.json) | جرد البحوث المفهرسة (= 0 حالياً) |

## كود العقود (خلف العلم)

| مسار | دور |
|---|---|
| `artifacts/majalis/src/lib/memorization-path/*` | أعلام · أنواع · حالات نشر/تقدم · كتالوج فارغ للعامة |
| `artifacts/majalis/src/pages/hifz-path/*` | Hub · محفوظاتي · تصنيف · مسار · وحدة (هيكل) |
| `artifacts/majalis/src/lib/scholarly-research/*` | عقود حوكمة (مراجعات أربع · أدوار) فوق السطح الحي `/academic-research` + `lib/researches` — بلا UI موازٍ |
| `test:memorization-research-pr0` … `pr2` | بوابات نصية |

## مبادئ ثابتة

1. لا نص شرعي مخترع · لا PDF معاد الاستضافة بلا إذن.
2. القرآن من المصدر المعتمد في المشروع فقط — لا قاعدة نص موازية.
3. البحوث = فهرس ورابط أصلي · ليست ناشراً للملف.
4. المراجعة المنهجية بشرية فقط · لا اعتماد آلي للمنهج.
5. الصياغة للمستخدم: «مسارات مقترحة للحفظ بحسب المستوى والهدف» — لا حكم مطلق.
