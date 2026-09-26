# سين جيم — جرد السبب الجذري ومحتوى البنك (PR-0)

**تاريخ الجرد:** 2026-09-26  
**فرع الأساس:** `origin/main` @ `0726b1196`  
**طريقة العد:** تشغيل حيّ عبر `buildFullQuizBank()` / `ALL_QUESTIONS` / `pickQuestion` — بلا أرقام تقديرية.

---

## 1) Routes والمكونات الفعلية

| العنصر | المسار / الملف |
|--------|----------------|
| Route اللعب | `/quiz` → `artifacts/majalis/src/pages/account/QuizPage.tsx` |
| Redirects | `/qa`, `/qa/:rest*`, `/learning/quiz`, `/learning/quiz/:slug` → `/quiz` |
| عنوان السجل | `routes.ts`: `"/quiz": "المسابقة"` |
| مكوّن الإعداد+اللعب+النتائج | `components/quiz-game/IslamicQuizGame.tsx` (phases: `setup` · `board` · `question` · `winner`) |
| تحدي يومي | `components/quiz-game/DailyChallengeQuiz.tsx` (يُفعَّل من نفس الصفحة) |
| بطاقة رئيسية | `components/home/HomeQuizCard.tsx` |
| بنك legacy | `data/islamicQuizData.ts` (`ALL_QUESTIONS`, `pickQuestion`, `mergeSupabaseQuestions`) |
| عقد البنك + النشر | `data/quiz-bank/{types,index,publication,legacy-adapter,playable-pools,categories}.ts` |
| سجل فئات UI | `data/quiz-categories.ts` → يعيد تصدير أوراق البنك |
| CSS | `styles/components/islamic-quiz-game.css` + `styles/pages/quiz.css` |
| Persistence استخدام | `lib/supabase` (`getLocalUsedQuizIds`, `markQuizQuestionUsed`) + `lib/quiz-performance-service` |
| Admin | `views/admin/QuizSection.tsx` |
| بوابات حالية | `quiz-bank-review-gate`, `quiz-challenge-rebuild-gate`, `quiz-game-integrity`, `quiz-soft-card-gate` |

**لا يوجد** مسار منفصل لـ results أو store مستقل — كل الحالات داخل `useReducer` في `IslamicQuizGame`.

---

## 2) أعداد البنك المحلي (مصدر لعب `/quiz`)

مصدر الحقيقة للعب المحلي بعد عقد المراجعة:

| المقياس | العدد الفعلي |
|---------|--------------|
| إجمالي أسئلة `buildFullQuizBank()` | **490** |
| `QUIZ_BATCH1_DRAFT_QUESTIONS` | **0** |
| `publicationStatus === PUBLISHED` (محلي) | **0** |
| `getPublishedQuestionCount()` | **0** |
| `DRAFT` | **490** |
| بلا مصدر (`sourceTitle`/`sourceReference`) | **490** |
| بمصدر | **0** |
| بلا جواب (`explanation` / `acceptedAnswers` / `correctIndex`) | **0** |
| مجموعات معرّف مكرر داخل البنك المبني | **0** |
| مجموعات نص سؤال مكرر | **0** |

### حسب النوع (`QuizQuestionType`)

| النوع | العدد |
|-------|------:|
| OPEN | 483 |
| TRUE_FALSE | 2 |
| MULTIPLE_CHOICE | 2 |
| COMPLETE_TERM | 1 |
| ORDER_ITEMS | 1 |
| MATCH_ITEMS | 1 |

### حسب الفئة الأساسية التي تملك بركة خاصة (مجموع 490)

| categoryId | العنوان | العدد |
|------------|---------|------:|
| quran | القرآن الكريم | 60 |
| hadith | الحديث الشريف | 60 |
| aqeeda | العقيدة | 63 |
| tawhid | التوحيد | 1 |
| fiqh | الفقه | 60 |
| sira | السيرة النبوية | 60 |
| anbiya | قصص الأنبياء | 60 |
| tarikh | التاريخ الإسلامي | 60 |
| nahw | النحو | 4 |
| balagha | البلاغة | 2 |
| akhlaq | الأخلاق والآداب | 60 |

### فئات أوراق مفعّلة بلا أسئلة خاصة (19)

`ulum_quran`, `tafsir`, `tajweed`, `mustalah`, `usul_fiqh`, `fiqh_tahara`, `fiqh_salah`, `fiqh_zakah`, `fiqh_siyam`, `hajj`, `sira_makkah`, `sira_madinah`, `sahaba`, `ummahat`, `arabic`, `sarf`, `maani`, `adhkar`, `glossary`

---

## 3) الفئات (Taxonomy الحالية)

| الطبقة | العدد |
|--------|------:|
| أوراق لعب (`QUIZ_LEAF_CATEGORIES`, كلها `enabled`) | **30** |
| آباء تنظيم (`QUIZ_PARENT_CATEGORIES`, كلها `enabled: false`) | **7** |
| المجموع في السجل | **37** |
| المعروض في UI (`GAME_CATEGORIES`) | **30** |

الآباء موجودة للتجميع فقط (غير قابلة للاختيار في UI الحالي) — لكن **لا يوجد عقد تشغيل صريح** يُطبَّق عند اختيار الأب لأن الآباء غير معروضة.

---

## 4) التداخل والفallback (سبب جذري لعزل الفئات)

`QUIZ_CATEGORY_FALLBACKS` يربط 23 فئة فرعية ببركة أب.  
`pickQuestion()` يجرّب بالترتيب: `[categoryId, resolveQuizCategoryPoolId(categoryId)]`.

**إعادة إنتاج موثّقة (2026-09-26):**

```text
pickQuestion("tafsir", 200, …, ALL_QUESTIONS)
  → id=q200_01 «كم عدد آيات سورة الفاتحة؟»  (بركة quran)

pickQuestion("fiqh_salah", 200, …, ALL_QUESTIONS)
  → id=f200_08 من بركة fiqh العامة
```

مجموعات البركة المشتركة (أوراق تشير لنفس الـpool):

| pool | الأوراق |
|------|---------|
| quran | quran, ulum_quran, tafsir, tajweed |
| hadith | hadith, mustalah |
| aqeeda | aqeeda, tawhid |
| fiqh | fiqh, usul_fiqh, fiqh_tahara, fiqh_salah, fiqh_zakah, fiqh_siyam, hajj, glossary |
| sira | sira, sira_makkah, sira_madinah, anbiya*, tarikh*, sahaba, ummahat |
| nahw | arabic, nahw, sarf, balagha*, maani |
| akhlaq | akhlaq, adhkar |

\* `anbiya` / `tarikh` / `balagha` / `tawhid` لها أسئلة خاصة، لكن عند نفادها أو فراغ المستوى يسقط السحب إلى الـfallback.

**النتيجة:** اختيار «التفسير» أو «فقه الصلاة» أو «السيرة المكية» **لا يضمن** أسئلة من تلك الفئة وحدها.

---

## 5) مسار النشر مقابل ما يظهر في اللعب

عقد المنتج (`canPublishQuestion` + `isPubliclyVisible`):

- للعامة محليًا: `publicationStatus === "PUBLISHED"` فقط.
- محوّل legacy (`legacy-adapter.ts`): كل سؤال بلا مصدر → `DRAFT`؛ مع مصدر نصي → `NEEDS_SOURCE` — **لا يُنشر تلقائيًا**.
- البوابة `quiz-bank-review-gate` تفرض: `getPublishedQuestionCount() === 0` على المحتوى المحلي الحالي.

مسار التشغيل الفعلي في `IslamicQuizGame`:

1. `poolRef = buildPublishedLocalPools()` → برك فارغة محليًا (0 منشور).
2. ثم `getQuizQuestions()` من Supabase و`mergeSupabaseQuestions(data, base)`.
3. إن فشل/فراغ الخادم → اللوحة بلا أسئلة صالحة رغم وجود 490 مسودة محلية.

نص الواجهة: «البنك المحلي قيد التوثيق…» يظهر عند `publishedCount === 0`، **لكنه لا يمنع** دمج أسئلة الخادم دون المرور بنفس عقد `PUBLISHED` المحلي على كل صف (الدمج يعتمد على صفوف Supabase كما تُرجع).

---

## 6) منطق الإعداد الحالي (قابل لإعادة الإنتاج)

| السلوك | التنفيذ الحالي | المشكلة |
|--------|----------------|---------|
| عدد اللاعبين | أزرار `1 لاعب` … `4 لاعبين` | خلط لاعب/فريق؛ لا تسمية «فرق» |
| أسماء | فردي: حقل «اسمك (اختياري)»؛ جماعي: حقول تُملأ افتراضيًا بأسماء الفرق | لا منع أسماء مكررة؛ لا ملخص قبل البدء |
| الفئات | شبكة 30 بطاقة؛ العداد `{selected} · {total}` بلا تسمية | غير واضح؛ لا عدد أسئلة لكل فئة |
| اختيار اختياري | في الوضع `solo`: `canStart` يتطلب `selected.length >= 1` | **لا يمكن البدء بلا فئة** في الفردي الكلاسيكي |
| quick | إن لم تُختر فئات → كل الفئات ثم يُقطع بعدد | سلوك ضمني غير موثَّق في UI |
| random | يتجاهل الاختيار ويخلط بـ`Math.random()` | غير قابل للاختبار بـseed |
| أنواع الأسئلة | شريط عرض فقط (`qzg-kinds-bar`) | **لا فلتر اختيار نوع** |
| ملخص البدء | زر «ابدأ التحدي» فقط | بلا عدد فرق/أسماء/فئات/أسئلة صالحة |

---

## 7) الأدوار والنقاط والنتائج

- `nextTeamId`: دوران دائري على مصفوفة الفرق (1–4).
- `MARK_CORRECT`: يضيف نقاط الخلية لـ`passedToTeamId ?? activeTeamId` ثم يدوّر الدور.
- `usedIds` يمنع إعادة نفس `question id` داخل الجلسة (مع دمج used محلي من supabase إن وُجد).
- لا يوجد قفل صريح ضد double-submit في الواجهة (الاعتماد على انتقال الـphase).
- شاشة النتائج (`winner`): ترتيب حسب النقاط + حالة تعادل عبر أيقونة Handshake عند تساوي الأول.
- لا إحصاء منفصل: صحيح/خطأ/متجاوز لكل فريق في النتائج.

---

## 8) عناصر عائمة / طول الصفحة

- الصفحة تستخدم `SectionTemplatePage` + إعداد طويل (Hero + أنماط + لاعبين + شبكة فئات).
- أزرار الرجوع/أعلى عامة من `App` (`FloatingBackButton` / `ScrollToTop`) — ليست داخل مكوّن اللعبة؛ تتداخل بصريًا مع إعداد طويل على الجوال (مشكلة UX مؤكدة بالصور؛ المعالجة في PR لاحق).

---

## 9) تمييز مهم عن عدّاد `content-counts.json`

| المصدر | `quizQuestions` |
|--------|----------------:|
| `content-counts.json` (مولَّد) | **8573** — من `public/data/quiz` / demo seed لبطاقات التعلّم، **ليس** بركة سين جيم |
| بركة سين جيم المحلية | **490** مسودة |
| منشور محلي للعب | **0** |

يُمنع خلط العددين في تقارير المنتج.

---

## 10) أخطاء قابلة لإعادة الإنتاج (PR-0)

1. **عزل فئة مكسور:** اختيار `tafsir` مع بركة `ALL_QUESTIONS` يعيد سؤال قرآن (`q200_01`).
2. **فئة فرعية بلا أسئلة خاصة:** 19 فئة تظهر في UI وتسقط إلى بركة أب عبر fallback.
3. **منشور محلي = 0:** بدون Supabase، `buildPublishedLocalPools` فارغ → خلايا بلا سؤال.
4. **لا بدء بلا فئة** في النمط الفردي الكلاسيكي رغم طلب المنتج أن الاختيار اختياري.
5. **عداد `5 · 30` بلا تسمية.**
6. **تسمية «لاعبين»** بينما المنطق فرق (`team1`…).
7. **أسماء مكررة مسموحة.**
8. **`Math.random` في Domain** (`resolveCats` / `pickQuestion`).
9. **أنواع الأسئلة غير قابلة للاختيار** رغم عرضها.
10. **لا primaryCategoryId منفصل عن Tags** في عقد اللعب الحالي — الاعتماد على `categoryId` + fallback.

---

## 11) نطاق PR-0 / خارج النطاق

**داخل PR-0:** هذا المستند + بوابة جرد تثبت الأعداد والمسارات وإعادة إنتاج عزل الفئة.

**خارج PR-0 (PRs لاحقة حسب الخطة):** أسماء الفرق، Wizard، Taxonomy تشغيلية، Session builder، عزل صارم، UI ليلي، TestFlight.

---

## 12) أوامر إعادة توليد الأعداد

من `artifacts/majalis`:

```bash
node --import tsx -e 'import { buildFullQuizBank, getPublishedQuestionCount } from "./src/data/quiz-bank/index.ts"; const b=buildFullQuizBank(); console.log(b.length, getPublishedQuestionCount());'
node --import tsx src/lib/__tests__/sin-jeem-pr0-audit-gate.test.ts
```
