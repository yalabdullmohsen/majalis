# PR-0 — عقود مسار الحفظ + البحوث الشرعية

**الحالة:** `PARTIAL` (عقود وتحليل جاهزة · بلا منتج عام · Flags OFF)  
**التاريخ:** 2026-09-24  
**القاعدة:** `origin/main` · لا Design System جديدة · هوية سُنّة الحالية  
**ممنوع إعلان:** `SUNNAH_MEMORIZATION_AND_RESEARCH_READY`

---

## 1) الحالة

| بند | قيمة |
|---|---|
| نتيجة PR-0 | **PARTIAL** |
| Routes عامة | غير مسجّلة |
| Feature Flags | كلها **OFF** |
| مسارات حفظ منشورة | **0** |
| بحوث مفهرسة منشورة | **0** |
| Screenshots | NOT CAPTURED (لا UI في PR-0) |
| CI/إنتاج لهذا البرنامج | بعد بوابات PR-0 فقط |

---

## 2) Architecture القسمين

```
[Feature Flags OFF]
        │
        ├─ memorization-path/     ← عقود + قوالب DRAFT
        │     flags · types · publication · progress · catalog(empty public)
        │
        └─ scholarly-research/    ← عقود + جرد فارغ
              flags · types · reviews · roles · url-policy · catalog(empty)

UI (لاحقًا PR-1+):
  AppPage / PageHeaderV2 / ContentRow / FeatureCard / ReadingPage / FilterBar
  لا Card-in-Card · لا DS جديدة

مصادر حقيقة موجودة يُعاد استخدامها:
  · قرآن: api.alquran.cloud عبر quran-api / قارئ المصحف — بلا تكرار نص
  · أدوات حفظ قائمة: /memorization · /quran-memorization · /quran/hifz-loop · /arbaeen-nawawi
  · بحوث قائمة: /academic-research + lib/researches (لا مسار موازٍ)
  · مراجعة محتوى: نمط islamic-sects (حالات نشر + حراسة PUBLISHED)
  · أعلام: نمط lessons-guide / quran-journey (افتراضي OFF)
  · Admin: /admin/v3 centers (CRUD كامل لاحقًا PR-7/8)
  · فلاتر: FilterSheet / ResearchFilters في lib/researches
```

**فصل عن الموجود:** `/memorization` الحالي = «الحفظ والمراجعة» (أدوات قرآن/اختبارات). القسم الجديد **مسار الحفظ** = مسارات متدرجة + محفوظاتي + مراجعة. لا حذف للمسارات القديمة في PR-0؛ الربط/الدمج قرار لاحق بعد Flags ON.

**شعار واجهة مسموح:** «مسارات مقترحة للحفظ بحسب المستوى والهدف»  
**ممنوع:** «كل ما يجب على المسلم حفظه» كحكم مطلق.

---

## 3) Routes المخططة (غير مفعّلة)

| Route | قسم | ملاحظة |
|---|---|---|
| `/hifz-path` | مسار الحفظ | فهرس + متابعة + مراجعات اليوم (جديد) |
| `/hifz-path/my` | محفوظاتي | |
| `/hifz-path/c/:category` | تصنيفات | |
| `/hifz-path/p/:slug` | صفحة مسار | |
| `/hifz-path/p/:slug/u/:unitId` | وحدة حفظ | خارج قارئ المصحف |
| `/academic-research` | البحوث الشرعية | **المسار الحي الحالي** (`AcademicResearchPage` + `lib/researches`) — يُطوَّر ولا يُستبدل بمسار موازٍ |
| `/academic-research/submit` | اقترح/أرسل | موجود؛ يُقيَّد بسياسة «اقترح بحثًا» + لا PDF في موجات لاحقة |
| `/academic-research/:id` | تفاصيل | موجود |
| `/researches` `/research` `/sharia-research` | aliases | Redirect → `/academic-research` |
| `/scholarly-research` | معطّل | Redirect→`/quiz` اليوم · في PR-1 يُحوَّل إلى `/academic-research` (لا منتج موازٍ) |
| `/admin/v3/hifz-path/*` | Admin | PR-7 |
| `/admin/v3/academic-research/*` | Admin | PR-8 — يعزّز المراجعات الأربع فوق `lib/researches` |

لا تُسجَّل في `AppRoutes` / sitemap / search index حتى PR-1+ والعلم ON + حالات قبول.

---

## 4) نماذج البيانات

### 4.1 مسار الحفظ — انظر `memorization-path/types.ts`

حقول المسار: `id · slug · title · shortDescription · category · level · estimatedUnits · sourceId · sourceReference · edition · licenseStatus · reviewStatus · publicationStatus · coverAsset · prerequisites · learningObjectives · units[] · revisionPlan · searchVisibility · seoVisibility`

حقول الوحدة: `unitId · title · sequence · verifiedTextReference · audioReference? · sourceReference · repetitionTarget · revisionIntervals · completionCriteria · reviewStatus · publicationStatus`

مرجع النص القرآني: `{ kind: "quran", surah, ayahFrom, ayahTo }` — **لا** تخزين نص الآية في كتالوج المسار.

### 4.2 البحوث — انظر `scholarly-research/types.ts`

حقول البحث كما في المتطلبات (عنوان · باحث · جامعة · درجة · DOI · ملخص مسموح · رابط أصلي · أوضاع الاستضافة · حالات المراجعات الأربع · إلخ).

`fileHostingMode`: `NONE | EXTERNAL_LINK_ONLY | LICENSED_HOSTED` — الافتراضي والوحيد في v1: `EXTERNAL_LINK_ONLY` أو `NONE`.

---

## 5) مسارات الحفظ المنشورة

**العدد: 0**

لا مسار بـ `publicationStatus = PUBLISHED` في الكتالوج العام.

---

## 6) المواد المؤجلة وأسبابها

| قالب | سبب التأجيل |
|---|---|
| سورة الفاتحة / قصار / جزء عم / تبارك / قد سمع / أجزاء / كامل | وحدات تشير لمرجع قرآن فقط؛ النشر يحتاج مراجعة منتج + عدم خلط مع قارئ المصحف |
| الأربعون النووية كمسار حفظ | يوجد `/arbaeen-nawawi`؛ يلزم بطاقة طبعة (مؤلف/ناشر/طبعة/صفحات) + `licenseStatus` قبل PUBLISHED كمسار |
| عمدة الأحكام | مصدر وترخيص غير مؤكدين في المستودع → مؤجّل |
| أحاديث مختارة | بلا مراجع محددة في القوالب → مؤجّل |
| أذكار صباح/مساء/نوم/صلاة | ربط بمصادر الأذكار الموجودة بعد تحقق الترخيص |
| متون عقيدة/فقه/لغة | بلا نص/ترخيص معتمد في المستودع → قوالب DRAFT فقط |
| مختارات لطالب العلم | بلا محتوى → مؤجّل |

القوالب: [`path-templates.json`](./path-templates.json) — كلها `DRAFT` / `licenseStatus: UNKNOWN`.

---

## 7) نظام التقدم والمراجعة

حالات تقنية (لا تُعرض للمستخدم):

`NOT_STARTED · IN_PROGRESS · MEMORIZED_SELF_REPORTED · DUE_FOR_REVIEW · REVIEWED · NEEDS_REINFORCEMENT`

صياغة مستخدم:

| تقنية | عربي |
|---|---|
| NOT_STARTED | لم تبدأ |
| IN_PROGRESS | قيد الحفظ |
| MEMORIZED_SELF_REPORTED | سجلتها ضمن محفوظاتي |
| DUE_FOR_REVIEW | مستحقة للمراجعة |
| REVIEWED | روجعت |
| NEEDS_REINFORCEMENT | تحتاج تثبيتًا |

أزرار مسموحة: «أتممت هذه الوحدة» / «سجلتها ضمن محفوظاتي»  
ممنوع: شهادة حفظ · ادعاء تحقق آلي من زر واحد.

التخزين لاحقًا: محلي + مزامنة (نمط daily-progress / native-storage) — PR-3/10.

---

## 8) مصادر النصوص والتراخيص

| مصدر | استخدام | ترخيص / ملاحظة |
|---|---|---|
| `quran-api` / مصحف المشروع | وحدات قرآن | مصدر القرآن المعتمد — لا تعديل رسم/تشكيل |
| `/arbaeen-nawawi` + seed | مرشّح مسار أحاديث | يلزم بطاقة طبعة قبل مسار PUBLISHED |
| أذكار التطبيق الحالية | مرشّح وحدات أذكار | ربط بعد تحقق |
| متون خارجية | — | **OWNER** — لا استيراد بلا ترخيص |
| مستودعات جامعية / DOI | بيانات وصفية + رابط | فهرسة فقط · لا إعادة استضافة PDF |

---

## 9) عدد البحوث المفهرسة فعليًا

| طبقة | العدد | ملاحظة |
|---|---|---|
| عقد `scholarly-research/catalog` (جديد) | **0** | لا سجلات تحت حالات المراجعات الأربع الجديدة |
| سطح حي `lib/researches` + `/academic-research` | موجود (بذور/demo) | **إرث** — يحتاج تدقيق حقوق/مصدر قبل اعتباره مطابقًا لمعايير هذا البرنامج |

انظر [`research-inventory.json`](./research-inventory.json).

**قرار PR-0:** لا بناء UI موازٍ. الموجات اللاحقة تُهاجر/تُشدّد `lib/researches` نحو عقد المراجعات الأربع + منع PDF + «اقترح بحثًا».

---

## 10) مصادر البحوث الأصلية

لا سجلات منشورة. مصادر مسموحة **مبدئيًا للسياسة** (لا استيراد جماعي في PR-0):

1. مستودع جامعي رسمي  
2. مكتبة الجامعة  
3. DOI / صفحة مجلة  
4. قاعدة مرخّصة  
5. موقع باحث مؤسسي  
6. مستودع وطني رسمي  
7. مصدر آخر بعد مراجعة بشرية + قرار حقوق مالك

---

## 11) البحوث المحجوبة

لا يوجد. السياسة: كل غير `APPROVED_METADATA_ONLY` / `APPROVED_EXTERNAL_LINK` محجوب عن العامة والـSearch/SEO.

---

## 12) المراجعات الأربع

| نوع | من ينفّذ | نتيجة PUBLISH |
|---|---|---|
| Source | CONTENT_EDITOR / ACADEMIC_REVIEWER | رابط رسمي + تطابق بيانات |
| Academic | ACADEMIC_REVIEWER | جامعة/درجة/تخصص |
| Rights | RIGHTS_REVIEWER | ملخص؟ رابط؟ استضافة؟ |
| Methodology | METHODOLOGY_REVIEWER بشري فقط | لا AI وحده · لا حكم «موافق للمنهج» بلا سجل |

صياغة عامة إلزامية في واجهة التفاصيل (لاحقًا):  
«إدراج البحث لأغراض الفهرسة والاستفادة العلمية، ولا يعني اعتماد جميع نتائجه أو آراء مؤلفه.»

---

## 13) نموذج الاقتراح والحماية (عقد فقط)

- زر: **اقترح بحثًا** (ليس انشر)  
- لا رفع PDF في v1  
- Validation URL · منع javascript: · open redirect · sanitization · rate limit · لا عرض بريد/IP  
- CSRF عند وجود API لاحقًا  
- Audit log للمراجعات — PR-6/12

---

## 14) Search / Filters / SEO

- فهرس بحث منفصل إلى اكتمال PR-9  
- العامة: منشور فقط  
- Sitemap: منشور + `seoVisibility` فقط  
- Canonical داخلي للبحوث · لا ادّعاء أن سُنّة ناشر الملف  
- Filter Sheet (لا عشرات chips): تخصص · درجة · جامعة · دولة · لغة · سنة · وصول نص · مصدر · تحقق عام

---

## 15) Admin v3

مراكز مخططة تحت `/admin/v3` (PR-7/8):  
مسارات/وحدات/مصادر حفظ · طوابير اقتراحات البحوث · المراجعات الأربع · روابط مكسورة · مصادر مسموحة/محظورة · سجل قرارات.

أدوار: `ADMIN · CONTENT_EDITOR · ACADEMIC_REVIEWER · METHODOLOGY_REVIEWER · RIGHTS_REVIEWER · VIEWER`  
لا دور واحد يعتمد كل الجوانب تلقائيًا.

---

## 16–18) Offline / Security / a11y

عقود مذكورة في المتطلبات؛ التنفيذ PR-10/11/12. لا قياس جهاز في PR-0.

---

## 19) Screenshots

NOT CAPTURED — لا سطح منتج في PR-0.

---

## 20) CI / إنتاج

بوابة `test:memorization-research-pr0` + `verify:ci` لهذا الـPR. لا نشر Routes للعامة.

---

## 21) Owner Actions

انظر [`OWNER_ACTIONS.md`](./OWNER_ACTIONS.md).

---

## 22–23) PRs / diff

| PR | فرع | ملاحظة |
|---|---|---|
| PR-0 (هذا) | `cursor/memorization-research-pr0-contracts` | عقود + أعلام OFF + بوابة |

`git diff --stat` يُحدَّث عند الـcommit.

---

## جرد ما فُحص قبل التعديل

| سطح | نتيجة مختصرة |
|---|---|
| Router | `AppRoutes.tsx` + `app/router/routes.ts` — موجود `/memorization*` و`/arbaeen-nawawi` |
| AppPage / PageHeader | `PageHeader` / `PageHeaderV2` · `UtilityScreen` · lobbies |
| Tokens / DS | brand-v4 / m2030 / SVL — **KEEP** · لا DS جديدة |
| Cards / Rows | `FeatureCard` · `ContentRow` |
| Search/Filter | `FilterBar` · فهارس `public/data/search` |
| Progress | `daily-progress` · `quran-memorization` SM-2 · native-storage |
| Auth / Roles | Admin shell + Admin v3 centers · CRUD جزئي BLOCKED |
| Publishing | نمط `islamic-sects` publication states |
| SEO | prerender/sitemap عبر build — إدخالات لاحقة فقط للمنشور |
| DB | لا Migration في PR-0 · اقتراح لاحق عند الحاجة |
| Empty/Error/Offline | أنماط موجودة في design-system / OfflineCenter |

---

## خطة PR (لا تُنفَّذ هنا)

PR-1 Routes+Nav خلف علم · PR-2 صفحة الحفظ · PR-3 وحدة/تقدم · PR-4 فهرس بحوث · PR-5 تفاصيل · PR-6 اقتراح · PR-7 Admin حفظ · PR-8 Admin بحوث · PR-9 Search/SEO · PR-10 Offline · PR-11 a11y · PR-12 Security · PR-13 Smoke/Release.

كل PR من أحدث `origin/main` بعد دمج السابق.
