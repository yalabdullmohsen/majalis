# تقرير إصلاح المحتوى — مجالس العلم

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
**PR:** (يُحدَّث)

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
(تُحدَّث)
