# جرد بنية "المجلس العلمي" — نقطة انطلاق تدقيق المحتوى

> وُلِّد يدويًا (لا آليًا) بتاريخ 2026-07-18 كمرحلة 1 من تكليف تدقيق شامل.
> المصدر الوحيد المعتمد: `artifacts/majalis/` (التطبيق الحقيقي). جذر المستودع
> يحتوي `src/` ميتًا مكررًا — **تجاهله تمامًا**، راجع `AGENTS.md` سطور 47-59.

## 1. الحقائق التأسيسية (تحقّقت منها فعليًا، لا افتراضًا)

- عدد المسارات المعرَّفة في `src/App.tsx`: **221** `<Route>`.
- عدد سكربتات `scripts/`: **120** ملف (.mjs/.ts)، منها **20** بادئتها `test-`
  (تُشغَّل ضمن `pnpm run build`) و**7** بادئتها `audit-`/`content-audit`
  (غير موصولة بأي CI gate تلقائي — يجب تشغيلها يدويًا).
- `src/data/*.json`: 4 ملفات فقط (`content-counts.json`, `library-catalog.json`
  اليتيم، `library-authors.json`، `scholars-list.json` اليتيم).
- `src/lib/*-seed*.ts`: 23 ملف seed (مصدر المحتوى الفعلي المعروض للزوار في
  الغالبية العظمى من الصفحات — وليس جداول DB الرسمية شبه الفارغة).

## 2. مصدر الحقيقة الفعلي لكل رقم في `content-counts.json` (تحقّق مباشر، بعد إصلاحات هذه الجلسة)

| المفتاح | المصدر (ملف TS حقيقي) | القيمة الحالية | ملاحظة |
|---|---|---|---|
| `books` | `src/lib/library-catalog.ts` → `LIBRARY_CATALOG` | 117 | 0 تكرار id/title. `src/data/library-catalog.json` (1634 سطر) **يتيم غير مستورد من أي مكان** — لا تُصلحه، فقط لا تثق به. |
| `scholars` | `src/lib/scholars-data.ts` → `SCHOLARS` | 96 | 0 تكرار id/name. `src/data/scholars-list.json` **يتيم غير مستورد** كذلك. |
| `fawaid` | `src/lib/fawaid-seed.ts` → `SEED_FAWAID` | **508** (كان 510) | أُزيل تكراران حرفيان هذه الجلسة (نفس النص+المصدر تحت تصنيف مختلف). |
| `quizQuestions` | `src/lib/quiz-seed.ts` → `DEMO_QUIZ_QUESTIONS` | **914** (كان 950) | أُزيل 36 سؤالاً مكرراً هذه الجلسة (28 مجموعة). خلاف واقعي واحد أُصلح: "أول غزوة في الإسلام" (بدر خطأ شائع ≠ الأبواء/ودّان الصحيح). |
| `mindMaps` | `src/lib/mind-maps-data.ts` → `MIND_MAPS` | 23 | لم يُفحص تكرار بعد. |

**غير مُتتبَّع في content-counts.json لكن يستحق نفس الانضباط:**
- `src/lib/qa-seed.ts` → `SEED_QA` (صفحة `/qa`): كان **474** فيه **114 سؤالاً
  مكرراً حرفيًا** بتصنيفات متضاربة (موثَّق سابقًا في الذاكرة) — **أُصلح بالكامل
  هذه الجلسة**، الآن **360** سؤالاً، 0 مشكلة عبر `scripts/audit-data-quality.mjs`.
  هذا الملف مصدر أيضًا لـ`scripts/generate-rulings-encyclopedia.mjs` (أحد 3
  مصادر موسوعة الأحكام) — فانخفض عدد الموسوعة تلقائيًا من 629 إلى 515 حكمًا
  كأثر جانبي صحيح لإزالة التكرار في qa-seed.ts.

## 3. بنية التوليد الآلي (سلسلة `pnpm run build`)

```
generate:counts   → npx tsx scripts/generate-content-counts.ts   (يكتب src/data/content-counts.json)
generate:seo      → node scripts/generate-seo.mjs                (يكتب seo-prerender/**، sitemap.xml، feed.xml)
generate:rulings  → build-curriculum-topics.mjs + generate-rulings-encyclopedia.mjs
vite build
scripts/generate-version.mjs
scripts/prerender.mjs        ← نظام ديناميكي، يُبطَل بواسطة seo-prerender/ الثابت لنفس المسارات (موثّق سابقًا في الذاكرة)
scripts/post-build-seo.mjs   ← يدمج seo-prerender/**/index.html في dist/
scripts/test-dynamic-404-safety.mjs
scripts/test-no-regressions.mjs  ← يتحقق صراحة من "لا بقايا فتاوى أو أزهر محذوفة"
```

`generate-seo.mjs` يقرأ `scripts/platform-seed.snapshot.json` (لقطة ثابتة
لقرارات المجمع الفقهي، الفتاوى [مصدر بيانات ميت الآن]، الأحكام، الدورات،
جلسات الفقه، أسئلة `/qa`) — **ملاحظة**: كان يولّد صفحات SEO شبح لمسار `/fatwa`
المحذوف من التطبيق؛ **أُصلح هذه الجلسة** (راجع القسم 5).

## 4. قسم الفتاوى — الحالة الفعلية بعد التحقق المباشر

- `/fatwa` و`/fatwa/:id`: **لا صفحة فعلية** — `Redirect` إلى `/fiqh` و`/rulings`
  على التوالي (`src/App.tsx` سطر ~578-579). لا `FatwaPage` مستوردة.
- `/fiqh-council/fatwas`: **مؤسسي، قائم فعليًا**، `FiqhCouncilFatwasPage.tsx`،
  مسار حي في `App.tsx` سطر 567. **لا تلمسه.**
- `seo-prerender/fatwa/*` (5 صفحات SEO شبح: zakat-gold, music-voice,
  inheritance-daughter, fasting-travel, prayer-combine) كانت **تُعاد توليدها في
  كل build** من `scripts/platform-seed.snapshot.json` رغم أن المسار محذوف من
  التطبيق — **أُصلحت هذه الجلسة**: أُزيلت حلقات التوليد من `generate-seo.mjs`
  (JSON-LD + linkList + RSS + addPage) وحُذفت الملفات الثابتة اليتيمة. تحقّق
  `scripts/test-no-regressions.mjs` الآن يؤكد ذلك صراحة عند كل build.
- `supabase/create_fatwas_v1.sql` وجدول `fatwas` في DB: **لم يُفحصا بعد** في
  هذه الجلسة — مهمة متبقية (راجع `CONTINUATION_PLAN.md`).

## 5. المسار الحيّ لـ`/hadith` — الفخ المُصلَح هذه الجلسة

كان commit `48d083f2` ("ربط /hadith بصفحة الأقسام الثلاثة المدمجة") قد وقع
بالكامل في فخ `src/` الجذري الميت (لم يمسّ `artifacts/majalis/` قط). التحقق
المباشر أثبت أن `/hadith` في التطبيق الحقيقي كان لا يزال يعرض `HadithIndexPage`
(صفحة روابط منفصلة قديمة) رغم أن `HadithPage.tsx` (المكوّن المدمج الفعلي الذي
يعرض صحيح/ضعيف/موضوع في صفحة واحدة، مع `HadithSection` قابل لإعادة
الاستخدام) كان جاهزًا تمامًا وموصولاً فعلاً بـ`/hadith/sahih`. **أُصلح**: `/hadith`
يعرض الآن `HadithPage` مباشرة.

## 6. سكربتات التدقيق الموجودة — حالتها بعد هذه الجلسة

| السكربت | الحالة | ملاحظة |
|---|---|---|
| `audit-data-quality.mjs` | ✅ يعمل، 0 مشكلة الآن | كان يكتشف 114 مشكلة QA، صُلحت. لا يفحص quiz-seed.ts أو fawaid-seed.ts — فُحصا يدويًا هذه الجلسة بسكربتات مؤقتة في scratchpad (غير محفوظة بالمستودع). **فرصة تحسين**: وسّع هذا السكربت ليشمل quiz-seed.ts وfawaid-seed.ts رسميًا بدل الفحص اليدوي المتكرر. |
| `audit-qa-categories.mjs` | ✅ يعمل | بعد إصلاح التكرار: 2 تصنيف مختلف عليه بالـregex (إيجابيات كاذبة بسيطة — "رياض الصالحين" و"جمع القرآن في عهد أبي بكر" تحتوي كلمات مطابقة للـregex لكنها ليست عن الأنبياء/الصحابة فعليًا). لم تُصلح (مخاطرة منخفضة، حكم القالب الآلي غير دقيق هنا). |
| `content-audit.mjs` | لم يُشغَّل في هذه الجلسة | يحتاج فحص في الجلسة التالية. |
| `audit-all-routes.mjs` | ❌ يحتاج Playwright + خادم Vite محلي شغّال + ملف routes نصي كوسيط CLI — لم يُشغَّل (يحتاج إعداد أثقل من وقت هذه الجلسة). | التشغيل: `node scripts/audit-all-routes.mjs <baseUrl> <routesFile> [outJson]`. |
| `audit-color-contrast.mjs`, `audit-aria-labels.mjs`, `audit-back-navigation.mjs` | خارج نطاقي عمدًا (تصميم/UI — وكيل آخر يعمل عليه على فرع `redesign/unified-ui-v2`) | لا تُشغَّل من هذا الفرع. |

## 7. قائمة أعداد Phase 3-9 المعلنة في التكليف — الحالة الفعلية

- المسارات التعليمية (Phase 4): لم تُفحص بعد بنيتها الحالية في هذه الجلسة.
  ابحث عن `LEARNING_PATHS` (مستورد في `generate-seo.mjs` سطر ~612) كمصدر
  حقيقي محتمل — تحقّق قبل البناء من الصفر.
- الجامعات (Phase 8): لم تُفحص. ابحث عن `UniversitiesPage.tsx` +
  `universities-service.ts` + `UniversitiesAdminPage.tsx` (ظهرت في build output).
- المصطلحات: `IslamicGlossaryPage.tsx` موجودة فعلاً (152KB مبنية) — لم تُدقَّق.

## 8. قاعدة البيانات

لم يُتحقق من عدد جداول DB الحي في هذه الجلسة — الـworktree الحالي
(`majalis-content-fill`) **غير مربوط** بـ`supabase link` (فشلت
`npx supabase db query --linked` بـ`LegacyProjectNotLinkedError`). الجلسة
التالية يجب أن تُشغّل `supabase link --project-ref ngmvmlulzacrlicuagyp` أولاً
(أو تتحقق من وجود رابط عبر متغيرات بيئة/ملف تهيئة) قبل أي استعلام DB.
