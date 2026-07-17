# خطة استئناف — تدقيق محتوى "المجلس العلمي" (فرع majalis-content-fill)

> اقرأ هذا الملف أولاً قبل أي استئناف. ثم اقرأ `AUDIT_INVENTORY.md` بجذر
> المستودع للسياق الكامل. التكليف الأصلي الكامل (16 مرحلة) موجود في تعليمات
> النظام لهذه الجلسة — لم يُنسخ هنا لتجنّب التكرار، فقط الحالة والخطوة التالية.

## قاعدة تشغيل حرجة (لا تتجاهلها)

- اعمل فقط داخل `artifacts/majalis/` (التطبيق الحقيقي). `src/` بجذر المستودع
  **ميت مكرر لا يُبنى أبدًا أبدًا** — أي تعديل هناك ضائع فعليًا. تحقّق أولاً:
  إن كان أي commit سابق قريب لمس `src/` بجذر المستودع (ابحث بـ`git log --stat`)
  تحقّق فورًا هل نفس الإصلاح وصل `artifacts/majalis/src/` أيضًا.
- **بيئة العمل**: الـcwd الافتراضي لأداة Bash هو
  `/Users/alabdullmohsen/majalis-content-fill/artifacts/majalis` (وليس جذر
  المستودع) — استخدم `cd /Users/alabdullmohsen/majalis-content-fill && ...`
  صراحةً لأي أمر git.
- `pnpm install` قد يلزم عند بداية أي جلسة جديدة (node_modules غير مثبت
  افتراضيًا في worktree جديد).
- كل commit يمرّ عبر pre-commit hook يشغّل typecheck+lint+فحص خط+build تلقائيًا
  (يستغرق ~30-40 ثانية) — هذا مطمئن لكن لا يغني عن فحصك اليدوي قبل commit.
- ادفع بـ`git push -u origin majalis-content-fill` دوريًا (نجح مرة في هذه
  الجلسة، فرع موجود على GitHub الآن ويتتبّع origin).

## ماذا أُنجز فعليًا في هذه الجلسة (2026-07-18)

جميعها مُختبرة (typecheck + lint + build + سكربتات تدقيق ذات صلة) ومدفوعة
لـ`origin/majalis-content-fill` (commits `8d39b72d` ثم `eb47e7fa`):

1. **فخ src/ الميت مُصلَح لـ/hadith**: `artifacts/majalis/src/App.tsx` كان
   يعرض `HadithIndexPage` (قديمة) بدل `HadithPage` (المدمجة، جاهزة أصلاً على
   `/hadith/sahih`) — الإصلاح الأصلي في commit `48d083f2` وقع خطأً بـ`src/`
   الجذري الميت فقط. أُعيد تطبيقه بشكل صحيح + أُزيل استيراد
   `HadithIndexPage` غير المستخدم بعدها.
2. **114 سؤال مكرر في `src/lib/qa-seed.ts` (صفحة /qa)**: أُزيلت بالكامل
   (474→360 سؤالاً). `node scripts/audit-data-quality.mjs` الآن يُظهر 0 مشكلة
   (كان 114). أثر جانبي صحيح: موسوعة الأحكام المولَّدة تلقائيًا
   (`rulings-encyclopedia-seed.generated.ts`) انخفضت من 629→515 لأنها تستهلك
   qa-seed.ts كمصدر — هذا **صحيح ومتوقع**، ليس خطأً.
3. **36 سؤال مكرر في `src/lib/quiz-seed.ts` (بنك أسئلة اللعبة، 950 أصلاً)**:
   أُزيلت (950→914). خلاف واقعي حقيقي أُصلح ضمنها: سؤال "ما أول غزوة في
   الإسلام؟" كان له إجابتان متضاربتان (بدر — خطأ شائع لأنها أول *معركة* قتال
   لا أول *غزوة*، مقابل الأبواء/ودّان — الإجابة الدقيقة في كتب السيرة، أول
   غزوة فعلية بلا قتال بالسنة الأولى للهجرة). أُبقيت إجابة الأبواء/ودّان.
   `src/data/content-counts.json` أُعيد توليده آليًا (`quizQuestions: 914`)
   عبر `npx tsx scripts/generate-content-counts.ts` — لا رقم يدوي.
4. **تكراران حرفيان في `src/lib/fawaid-seed.ts`**: أُزيلا (510→508).
5. **صفحات SEO شبح لقسم /fatwa المحذوف**: `scripts/generate-seo.mjs` كان لا
   يزال يولّد 5 صفحات ثابتة (`seo-prerender/fatwa/*`) + JSON-LD + عنصر RSS
   لمسار `/fatwa/:id` المحذوف بالكامل من التطبيق (commit `3a995462`، المسار
   الآن `Redirect` فقط). أُزيلت كل حلقات/مراجع التوليد ذات الصلة، وحُذفت
   الصفحات الثابتة اليتيمة الخمس. **لم يُمَس** `/fiqh-council/fatwas`
   (المؤسسي) ولا أي صفحة `fiqh-council/*` أخرى — تحقّقت من ذلك صراحةً بعد كل
   تعديل. `scripts/test-no-regressions.mjs` (يعمل ضمن `pnpm build`) يتحقق
   الآن صراحةً من "لا بقايا فتاوى أو أزهر محذوفة".
6. **`AUDIT_INVENTORY.md`** كُتب بجذر المستودع (جرد حقيقي، تحقّق مباشر لا
   افتراض) — اقرأه، فيه تفاصيل كل رقم أعلاه ومصدره.

**آخر نتيجة اختبار كاملة**: `pnpm run build` من `artifacts/majalis/` نجح
بالكامل (typecheck ✓، lint ✓ 0 تحذيرات، build ✓، 722 صفحة seo-prerender،
`test-dynamic-404-safety.mjs` ✓، `test-no-regressions.mjs` ✓ بما فيها فحص
"لا بقايا فتاوى" الصريح).

## آخر الملفات المعدَّلة (بالترتيب الزمني)

```
artifacts/majalis/src/App.tsx
artifacts/majalis/src/lib/qa-seed.ts
artifacts/majalis/src/lib/quiz-seed.ts
artifacts/majalis/src/lib/fawaid-seed.ts
artifacts/majalis/src/data/content-counts.json          (مولَّد آليًا)
artifacts/majalis/scripts/generate-seo.mjs
artifacts/majalis/seo-prerender/**                       (مولَّد آليًا، فتاوى محذوفة)
artifacts/majalis/src/lib/rulings-encyclopedia-seed.generated.ts  (مولَّد آليًا)
artifacts/majalis/public/data/rulings-encyclopedia/**    (مولَّد آليًا)
artifacts/majalis/public/feed.xml, sitemap.xml           (مولَّد آليًا)
artifacts/majalis/data/data-quality-audit.json           (تقرير سكربت تدقيق)
artifacts/majalis/data/qa-category-audit.log.json        (تقرير سكربت تدقيق)
```

## أكبر فجوة متبقية الآن (نفّذها أولاً في الجلسة التالية)

بالترتيب المقترح — كل بند مستقل يمكن أخذه منفردًا:

1. **تخريج الأحاديث الشامل** (Phase 0 من التكليف الأصلي، أعلى أولوية دينية):
   لم يبدأ فعليًا بعد. ابنِ سكربت `scripts/audit/hadith-citations.mjs` يمسح
   كل ملفات `src/lib/*-seed.ts` و`src/views/*.tsx` بحثًا عن أي نص يُنسب صراحة
   للنبي ﷺ (أنماط: `قال ﷺ`, `صلى الله عليه وسلم:`, حقول `hadith`, `evidence`
   تحتوي علامات اقتباس عربية «»)، ويتحقق أن كل واحد له حقل `source`/`reference`
   يتضمن **مصدر + رقم على الأقل** (الدرجة مرغوبة لا إلزامية إن كان المصدر
   صحيحين معروفين كالبخاري ومسلم). لاحظت في `qa-seed.ts` أمثلة فيها
   `evidence: "رواه البخاري ومسلم"` بلا رقم حديث — هذه منطقة رمادية يجب أن
   يقرر السكربت معيارًا واضحًا لها (اقترح: البخاري/مسلم بلا رقم = قبول لأنها
   مصادر أولية موثوقة معروفة الباب غالبًا؛ مصادر أضعف بلا رقم = "بحاجة لتحقق").
2. **فحص `content-audit.mjs`**: لم يُشغَّل هذه الجلسة. شغّله وطبّق نفس منهجية
   الإصلاح الفوري (لا تسجيل فقط) المستخدمة أعلاه.
3. **DB**: هذا الـworktree غير مربوط بـ`supabase link`. اربطه
   (`npx supabase db query --linked` فشل بـ`LegacyProjectNotLinkedError`)
   ثم افحص جدول `fatwas` و`supabase/create_fatwas_v1.sql` تحديدًا (سؤال
   معلَّق من التكليف الأصلي: هل له علاقة بلوحة إدارة fiqh-council؟ لم يُفحص).
4. **`grep` شامل عن "قريبًا"/Placeholder** (Phase 2 من التكليف): لم يُنفَّذ
   بعد كسكربت منهجي. نمط مقترح:
   `grep -rn "قريبًا\|سيتم إضافت\|تحت الإنشاء\|غير متوفر حالياً\|lorem ipsum" artifacts/majalis/src`.
5. **توسيع `audit-data-quality.mjs`** ليشمل `quiz-seed.ts` و`fawaid-seed.ts`
   رسميًا (فُحصا يدويًا بسكربتات scratchpad مؤقتة غير محفوظة في هذه الجلسة —
   أعد كتابتها كإضافة دائمة للسكربت الموجود بدل تكرار العمل يدويًا كل مرة).
6. **المسارات التعليمية / الجامعات / المصطلحات** (Phases 4, 8): لم تُفحص
   بنيتها الحالية بعد. ابدأ بـ`grep -n "LEARNING_PATHS" artifacts/majalis/src -r`
   و`UniversitiesPage.tsx`/`universities-service.ts` لفهم الوضع الحقيقي قبل
   افتراض أنها ناقصة.
7. **`seed-fawaid` بقية الملف**: لم يُفحص محتوى `source`/`author_name` لبقية
   508 فائدة بحثًا عن أحاديث بلا تخريج كافٍ (فُحص فقط عيّنة التكرار).
8. **`scripts/audit-all-routes.mjs`**: يحتاج خادم Vite محلي + Playwright +
   ملف نصي بقائمة مسارات كوسيط CLI — أثقل إعدادًا، أجِّله لدفعة مخصصة.

## عوائق مسجَّلة (سطر واحد لكل بند، للرجوع لاحقًا)

- `src/data/library-catalog.json` و`src/data/scholars-list.json` يتيمان تمامًا
  (غير مستوردَين من أي كود) — لا خطر عرض، لكن مصدر ارتباك مستقبلي؛ حذفهما أو
  توثيق عدم استخدامهما قرار يحتاج تأكيدًا (قد يكونان مرجعًا لسكربت آخر لم أجده).
- `scripts/platform-seed.snapshot.json` لا يزال يحتفظ بمفتاح `"fatwas"` (5
  سجلات) رغم توقف استهلاكه — تُرك عمدًا (بيانات خاملة غير مُستهلَكة، إزالته
  اختيارية فقط).
- تصنيفان متبقيان من `audit-qa-categories.mjs` بعد إصلاح التكرار (إيجابيات
  كاذبة للـregex على الأرجح) — لم يُصلحا، مخاطرة منخفضة، راجع
  `AUDIT_INVENTORY.md` §6.

## المهمة التالية بدقة (ابدأ هنا مباشرة)

ابنِ `scripts/audit/hadith-citations.mjs` (بند 1 أعلاه) وشغّله، ثم أصلح فورًا
كل حديث بلا تخريج كافٍ (إما إضافة مصدر+رقم من مصدر موثوق حقيقي عبر WebSearch،
أو تحويل الصياغة لـ"ورد في الأثر"/إخفاء الجزم، أو حذف الادعاء إن تعذّر التحقق) —
لا تكتفِ بتسجيله في تقرير. بعد كل دفعة (~30-50 حديثًا): typecheck، ثم commit.
