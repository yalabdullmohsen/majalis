# تقرير إصلاح المحتوى — سُنّة

> **تحديث الدمج (2026-07-27):** المرحلتان 2–9 أُعيد تطبيقهما على `main` الحالي في PR واحد> (`cursor/content-fix-phases-2-through-9-1f54`) بدل سلسلة Draft #340–#347، مع الحفاظ على> إثراءات `main` الأحدث في بذور quiz/qa/fawaid. المرحلة 1 كانت مدموجة سابقًا عبر #339.


تاريخ البدء: 2026-07-26  
الفرع الأساسي لكل مرحلة: `cursor/content-fix-phaseN-*-1f54`

---

## المرحلة 1 — عزل عاجل (curriculum)

**الفرع:** `cursor/content-fix-phase1-isolate-curriculum-1f54`  
**PR:** https://github.com/yalabdullmohsen/majalis/pull/339

### ما نُفّذ
- راية `CONTENT_CURRICULUM_ENABLED=false` في:
  - `artifacts/majalis/lib/content-flags.mjs`
  - `artifacts/majalis/src/lib/content-flags.ts`
- عزل التوليد: `scripts/generate-rulings-encyclopedia.mjs` يتخطى `fromCurriculumRegistry()` عند الراية false.
- عزل البذر: `lib/rulings-db-seed.mjs` يصفّي سجلات curriculum.
- عزل الواجهة: `rulings-data-loader.ts` و`rulings-service.ts` يخفيان سجلات curriculum.
- إعادة توليد الموسوعة (بدون `build-curriculum`) → **507** حكماً، **0** سجل curriculum في الـ chunks.
- الملف المصدر `data/rulings-encyclopedia/curriculum-topics.json` **لم يُحذف** (36 سجلًا باقية).
- طابور المراجعة: `docs/curriculum-review-queue.md`.

### الملفات المعدّلة
| ملف | نوع التغيير |
|---|---|
| `artifacts/majalis/lib/content-flags.mjs` | جديد |
| `artifacts/majalis/src/lib/content-flags.ts` | جديد |
| `artifacts/majalis/scripts/generate-rulings-encyclopedia.mjs` | عزل |
| `artifacts/majalis/lib/rulings-db-seed.mjs` | عزل |
| `artifacts/majalis/src/lib/rulings-data-loader.ts` | عزل |
| `artifacts/majalis/src/lib/rulings-service.ts` | عزل |
| `artifacts/majalis/public/data/rulings-encyclopedia/**` | إعادة توليد بدون curriculum |
| `artifacts/majalis/src/lib/rulings-encyclopedia-seed.generated.ts` | إعادة توليد |
| `docs/curriculum-review-queue.md` | جديد |
| `docs/content-fix-report.md` | هذا التقرير |

### رصد بشري (بلا تصحيح نص قرآني/حديثي)
- `curriculum-1`: summary مبتور؛ منسوب للقرآن والحديث
- `curriculum-4`: نص منسوب للحديث — مراجعة تحريف محتمل
- `curriculum-5`: مراجعة صياغة الوجوب/الاستحباب
- `curriculum-10`: نص منسوب للحديث — راقب إنجليزي إن وُجد

### ما لم يُصلَح ولماذا
- لم تُصحَّح نصوص القرآن/الحديث في المنهج (قيد المرحلة: عزل ورصد فقط).
- صفوف curriculum الموجودة مسبقاً في Supabase الحي تُخفى من واجهة القراءة عبر الراية؛ لا حذف من قاعدة البيانات في هذه المرحلة.

### حالة البناء
`PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build` — **نجاح** (f95d2b11)

### إحصاء المرحلة 1
| التعديلات | الموسوم | البناء |
|---|---|---|
| عزل + إعادة توليد موسوعة + طابور 36 | 36 سجل منهج معزول | نجاح |

---

## المرحلة 2 — ادّعاء التوثيق (fiqh-issues)

**الفرع:** `cursor/content-fix-phase2-fiqh-documentation-1f54`
**PR:** https://github.com/yalabdullmohsen/majalis/pull/340

### القاعدة

- يسمّي مصدراً محدداً ← أُبقي `official_verified`

- قاعدة عامة فقط ← خُفّض إلى `general_reasoning`

- بلا `evidence_summary` ← خُفّض + `evidence_summary: "UNVERIFIED"`

### الجدول

| المعرّف | قبل | بعد | السبب |
|---|---|---|---|
| `seed-issue-crypto` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-organ-donation` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-minorities` | official_verified | general_reasoning | لا evidence_summary |
| `seed-issue-zakat-stocks` | official_verified | general_reasoning | لا evidence_summary |
| `seed-issue-hajj` | official_verified | general_reasoning | لا evidence_summary |
| `seed-issue-general-anesthesia` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-artificial-organ-transplant` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-human-cloning` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-abortion-rape-cases` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-misyar-marriage` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-electronic-divorce` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-artificial-breastfeeding` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-fasting-elderly-disabled` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-astronaut-prayer` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-zakat-crypto` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-health-insurance-ruling` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-stock-market-trading` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-organ-donation-will` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-milk-bank-breastfeeding` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-minorities-kitabiyya-marriage` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-stem-cells` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-digital-waqf` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-zakat-real-estate` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-gender-reassignment` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-surrogacy` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-euthanasia` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-covid-vaccine` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-nft-metaverse` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-social-media-dawah` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-hair-transplant` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-crowdfunding` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-polar-fasting` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-deception-marriage-annulment` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-medicinal-cannabis` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-bank-employment` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-life-insurance` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-cosmetic-surgery` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-etf-index-funds` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-hajj-bank-money` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-repeated-umrah` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-quran-phone-prayer` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-online-prayer-congregation` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-online-lectures-women` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-ai-content-dawah` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-minorities-liquor-license` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-minorities-citizenship` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-zakat-real-estate-rentals` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-streaming-music` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-nft-blockchain` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-waqf-digital` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-remote-work-prayer` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-genetic-testing-ancestry` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-ai-fatwa` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-online-nikah` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-electric-vehicle-zakat` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-metaverse-prayer` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-biometric-auth-banking` | official_verified | general_reasoning | قاعدة عامة فقط بلا مصدر مسمّى |
| `seed-issue-carbon-credits-trading` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-cultured-meat` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-edible-insects` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-encrypted-digital-currencies` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-gmo-animal-foods` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-pre-slaughter-stunning` | official_verified | official_verified | evidence_summary يسمّي مصدراً |
| `seed-issue-smart-contracts` | official_verified | official_verified | evidence_summary يسمّي مصدراً |

- أُبقي official_verified: **33**
- خُفّض إلى general_reasoning (قاعدة عامة): **28**
- خُفّض + UNVERIFIED: **3**

### الملفات المعدّلة

- `artifacts/majalis/src/lib/fiqh-issues-seed.ts`

- `artifacts/majalis/src/lib/fiqh-council-types.ts` (إضافة قيمة النوع)

- `artifacts/majalis/src/lib/fiqh-council-trust.ts` (تسمية الواجهة)

### ما لم يُصلَح

- لم تُختَرع مصادر لرفع أي مسألة إلى official_verified.

### حالة البناء

نجاح

---

## المرحلة 3 — الأرقام والتقاويم

**الفرع:** `cursor/content-fix-phase3-numbers-calendars-1f54`
**PR:** https://github.com/yalabdullmohsen/majalis/pull/341

### التعديلات
| موضع | التغيير |
|---|---|
| quiz-seed (~1968) | تسمية «88 سنة ميلادية (91 سنة هجرية)» |
| quiz-seed (~3657) | تسمية «إحدى وتسعين سنة هجرية (88 سنة ميلادية)» |
| quiz-seed (~5329) | تسمية «91 سنة هجرية (88 سنة ميلادية)» |
| qa-seed (~2259) | 7563 = ترقيم فؤاد عبد الباقي شاملاً المعلقات والمتابعات |
| islamic-stories-seed (~1121) | 7397 دون المعلقات/المتابعات، مع ذكر 7563 للمقارنة |
| qa-seed + islamicQuizData | مولد النبي: «عام الفيل، نحو 570–571م» |
| qa-seed | توحيد الأرقام الإفرنجية داخل الملف (الغالب) |

### ما لم يُغيَّر (قرار معلن)
- لم يُوحَّد 88 مع 91
- لم يُوحَّد 7397 مع 7563
- لم يُحسم 570 مقابل 571 بترجيح واحد

### حالة البناء
نجاح

---

## المرحلة 4 — نصوص مبتورة وإملاء

**الفرع:** `cursor/content-fix-phase4-truncation-spelling-1f54`
**PR:** https://github.com/yalabdullmohsen/majalis/pull/342

### من المولّد
- `scripts/generate-rulings-encyclopedia.mjs`: دالة `summarizeText` تقتطع عند حدود كلمة + «…»
- أُعيد توليد `rulings-encyclopedia-seed.generated.ts` والـ chunks

### إملاء وصياغة
| موضع | التغيير |
|---|---|
| qa-seed «256ه.» | → «256هـ.» |
| islamic-stories-seed:32 | «سيرة أبي بكر» |
| islamic-occasions-seed:50–51 | «الأرجح ليلة السابع والعشرين، ولم تُعيَّن بيقين» مع بقاء hijriDay: 27 |
| scholars-data + scholars-seo (fawzan) | `died: "حي (معاصر)"` |
| qa «تضيققاً» | غائبة في النسخة الحالية — لا تعديل |
| quiz explanation مبتور | غائب في النسخة الحالية — لا تعديل |

### المسح الشامل
- كيانات HTML / ترميز تالف: لا شيء
- مواضع لاتينية في نص عربي: رُصدت في `docs/curriculum-review-queue.md` بلا تعديل نصّي

### حالة البناء
نجاح

---

## المرحلة 5 — توحيد الأسماء والألقاب

**الفرع:** `cursor/content-fix-phase5-names-honorifics-1f54`
**PR:** https://github.com/yalabdullmohsen/majalis/pull/343

### الصيغة المعتمدة
`ابن قيم الجوزية` — استُبدلت كل مواضع `ابن القيم الجوزية` في src (ما عدا جملة تعليمية في quiz تُبقي «ابن القيم» كمثال للخطأ مقابل «ابن قيِّم»).

### حقول name / author / fullName
- نزع ألقاب: الإمام، الشيخ، شيخ الإسلام، الحافظ، القاضي
- خرائط صريحة: مالك، الشافعي، أحمد، البخاري، مسلم، النووي، ابن تيمية، ابن قيم الجوزية، ابن عثيمين، ابن باز، الألباني، الفوزان، الغزالي، ابن حجر

### الملفات
scholars-data.ts، scholars-seo.json، library-catalog.ts/.json، library-authors.json، وملفات عروض/بذور حملت الصيغة القديمة.

### استثناء
- quiz-seed جملة «الصواب… ابن قيِّم… لا ابن القيم» أُبقيت للتمييز التعليمي.

### حالة البناء
نجاح

---

## المرحلة 6 — حقول مكررة (وسم فقط)

**الفرع:** `cursor/content-fix-phase6-duplicate-fields-1f54`
**PR:** https://github.com/yalabdullmohsen/majalis/pull/344

### curriculum-topics.json
- وُسم `_duplicate_summary: true` لـ **33**/36 سجلًا (summary===body)
- بلا وسم: curriculum-1, curriculum-29, curriculum-32

### quiz-seed.ts
- قالب «بيان موجز للإجابة»: **غير موجود** في النسخة الحالية (0 موضع)
- لم يُضف `_templated_explanation` لأن الشرط غير متحقق

### scientific-announcements-seed.ts
- `sci-rawdat-alafham-muwaiziri`: lessonTitle ← «شرح » + bookTitle
- `sci-tawheed-saltaweel`: lessonTitle كان يبدأ بـ«شرح» ومطابقاً لـ bookTitle → وُسم `_duplicate_lesson_book: true`

### حالة البناء
نجاح (مع إلحاق curriculum في المرحلة 7 إن نقص من commit المرحلة 6)

---

## المرحلة 7 — حقول ناقصة

**الفرع:** `cursor/content-fix-phase7-missing-fields-1f54`
**PR:** https://github.com/yalabdullmohsen/majalis/pull/345

### miracles-seed.ts
- أُضيف `slug` لكل عنصر من الـ60 (نقحرة لاتينية، فريد)

### fiqh-issues-seed.ts
- 11 سجلًا بلا description ← `description: ""` + `_needs_description: true`

### fawaid-seed.ts
- `author_name: null` بقي null
- وُسم `_needs_author: true` لـ **527** سجلًا

### ملحق المرحلة 6
- إعادة وسم `_duplicate_summary` في curriculum-topics.json (فات الـcommit السابق)

### حالة البناء
نجاح

---

## المرحلة 8 — سياسة غير الموثّق (وسم ظاهر)

**الفرع:** `cursor/content-fix-phase8-unsourced-policy-1f54`  
**PR:** https://github.com/yalabdullmohsen/majalis/pull/346

### الأعداد الدقيقة
| المصدر | العدد |
|---|---|
| qa `evidence: null` | 155 |
| qa `reference: null` | 142 |
| quiz «مستند إلى مضمون الإجابة المعتمدة» | **0** في الشجرة الحالية (النمط غير موجود؛ لو وُجد لاستُبدل بـ `null`) |
| asma مرجع حديث الـ99 فقط | 13 |
| fawaid بلا `author_name` | 527 |

### documentation_status
| ملف | sourced | unsourced |
|---|---|---|
| qa-seed.ts | 218 | 142 |
| quiz-seed.ts | حسب وجود مرجع مسمّى | البقية |
| asma-husna-data.ts | غير حديث الـ99 وحده | 13 (+ما بلا مرجع مسمّى) |
| fawaid-seed.ts | له مصدر مسمّى | بلا مصدر / بلا مؤلف موثّق |

### الواجهة
- راية `SHOW_UNSOURCED_BADGE=true` في `content-flags.ts` / `.mjs`
- مكوّن `UnsourcedBadge` («بلا تخريج») في QaCard و FaidahCard و AsmaaHusnaPage
- لا إخفاء لمحتوى

### حالة البناء
نجاح (3483ce43)

---

## المرحلة 9 — توحيد أسماء المسارات من SEO

**الفرع:** `cursor/content-fix-phase9-nav-seo-titles-1f54`  
**PR:** https://github.com/yalabdullmohsen/majalis/pull/347

### ما نُفّذ
- مصدر وحيد: `seo-routes.json` عبر `artifacts/majalis/src/lib/seo-nav-labels.ts` (`seoNavLabel` + `SEO_NAV_EXCEPTIONS`).
- اشتقاق تسميات الروابط في:
  - `navigation.ts`
  - `SideNavDrawer.tsx`
  - `MoreBottomSheet.tsx`
  - `home-feature-catalog.ts`
- عناوين **مجموعات** القائمة (group/subgroup) بقيت نصاً ثابتاً — ليست أسماء مسارات.
- مرساة `/my-learning#…` تحتفظ بـ«شهاداتي» ولا ترث «حسابي».

### استثناءات (>25 حرفاً — اسم التنقّل الحالي)
| المسار | عنوان SEO (مرفوض للتنقّل) | الاسم المعتمد |
|---|---|---|
| `/fiqh-council` | الهيئات والمنظمات الإسلامية (27) | المجمع الفقهي |
| `/knowledge-graph` | الرسم البياني المعرفي الإسلامي (30) | استكشف المعرفة |

### ملاحظات خارج النطاق (ذكراً فقط)
- `recent-pages.ts` ما زال يحمل تسميات محلية لبعض المسارات (مثل `/knowledge-map`).
- `/knowledge-map` يُعاد توجيهه إلى `/knowledge-graph`؛ عنوان SEO له «ترابط العلوم الإسلامية» ولم يُعرض في القوائم الأربع أعلاه كعنصر مستقل.

### حالة البناء
نجاح (`PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build`)

---

## جدول ختامي

| المرحلة | عدد التعديلات (تقريبي) | الموسوم / الاستثناء | البناء | PR |
|---|---|---|---|---|
| 1 عزل curriculum | عزل + إعادة توليد موسوعة + طابور 36 | 36 منهج معزول | نجاح | #339 |
| 2 توثيق الفقه | 31 خفضاً + 3 UNVERIFIED | 28 general_reasoning + 3 UNVERIFIED | نجاح | #340 |
| 3 أرقام وتقاويم | quiz/qa/stories/islamicQuiz | لا توحيد 88/91 ولا 7397/7563 | نجاح | #341 |
| 4 بتر وإملاء | مولّد + إملاء + فوزان + ليلة القدر | مواضع مشبوهة في طابور المراجعة | نجاح | #342 |
| 5 أسماء وألقاب | ابن قيم الجوزية + نزع ألقاب | استثناء جملة quiz تعليمية | نجاح | #343 |
| 6 حقول مكررة | وسم فقط | 33 `_duplicate_summary`؛ 1 `_duplicate_lesson_book` | نجاح | #344 |
| 7 حقول ناقصة | 60 slug؛ 11 وصف؛ 527 مؤلف | `_needs_description` / `_needs_author` | نجاح | #345 |
| 8 غير الموثّق | documentation_status + شارة | unsourced ظاهر بلا إخفاء | نجاح | #346 |
| 9 أسماء المسارات | seoNavLabel في 4 ملفات + وحدة اشتقاق | استثناءان >25 حرفاً | نجاح | #347 |
