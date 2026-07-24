# نتائج تقنية آلية — سجل تراكمي

كل بند هنا نتيجة أمر فعلي مُشغَّل، لا افتراض. أضف بندًا جديدًا عند كل
دفعة تكتشف شيئًا حقيقيًا؛ لا تكرر تشغيل فحص لم يتغيّر سببه.

## 2026-07-24 — الدفعة 1: تشخيص أولي + إصلاحان جذريان في البنية التحتية

| الأمر | النتيجة الكاملة |
|---|---|
| `pnpm run typecheck` | نظيف، بلا مخرجات أخطاء |
| `pnpm run lint` | نظيف (`--max-warnings 50`، لم يُلمَس الحد) |
| `node scripts/test-seo.mjs` | 736 صفحة مفحوصة، 0 مشكلة P0، 35 تحذير (كلها وصف meta قصير تحت `/admin/**`) |
| `node scripts/test-no-homepage-leak.mjs` | 4 نجح / 0 فشل — 232 صفحة كتب/علماء داخلية فُحصت لتسرّب محتوى الرئيسية |
| `node scripts/verify-color-contrast-gate.mjs` | نظيف — 25 إصلاح تباين سابق (جلسات ماضية) لا تزال ثابتة، لا انحدار |
| `rg -o --no-filename '#[0-9a-fA-F]{6}\b' src/styles src/components src/views \| wc -l` | 7220 تكرارًا حرفيًا لقيم hex |
| نفس الأمر + `sort -u \| wc -l` | 674 قيمة فريدة |
| `git ls-files seo-prerender \| wc -l` | 736 — مُتتبَّع بالكامل في git (مخرج build يُعاد توليده بالكامل من `generate-seo.mjs` عند كل build، فكونه متتبَّعًا ليس خطأً بحد ذاته طالما `pnpm run build` يُشغَّل قبل كل نشر — مُطبَّق فعليًا في `release-majlisilm.yml`) |

**تشخيص شكاوى الطلب الأصلي (نص/تنقّل قديم في SEO، تسرّب محتوى الرئيسية):**
كل الفحوصات أعلاه نظيفة على شجرة المصدر الحالية. الأرجح: هذه أعراض
نُسخة إنتاجية منشورة قديمة (قبل إصلاحات جلسات لاحقة)، ستُحل تلقائيًا
عند تشغيل `release-majlisilm.yml` القادم. لم يُسجَّل كبند إصلاح كودي —
فقط كبند مراقبة بعد النشر القادم.

**اكتُشف وأُصلح:** تعارض ثلاثي بين `docs/design-tokens.md` (`#0E6E52`)،
`docs/design-system.md` (`#1F6E54`)، والقيمة الحقيقية في `modern-2026.css`
(`#173D35`). التفاصيل والإصلاح في `progress.md`.

**اكتُشف وأُصلح (P1 — يمنع البناء في أي worktree جديد):** خمسة ملفات
`tsconfig.tsbuildinfo` (`lib/api-client-react`, `lib/api-zod`, `lib/db`,
`scripts`، وجذر المستودع) كانت مُتتبَّعة في git رغم أن `.gitignore`
يستثنيها صراحةً (`**/*.tsbuildinfo`). الأثر: أي `git worktree add` جديد
(بما فيها `automation/content` و`automation/tasks` نفسيهما) يستنسخ cache
بناء "مُحدَّث" كذبًا يخبر `tsc --build` أن `lib/api-zod` مبني فعلًا رغم
عدم وجود `dist/` أصلًا — فيفشل `pnpm run build` الجذري بخطأ TS6305 في
`artifacts/api-server`. **مُؤكَّد فعليًا:** هذا بالضبط ما حدث عند أول
`pnpm run build` في هذه الدفعة. الإصلاح: `git rm --cached` للملفات
الخمسة. تحقّق بعد الإصلاح: `pnpm run typecheck:libs` و`pnpm --filter
@workspace/api-server run typecheck` كلاهما نظيف. (commit `c23bc94f`)

**اكتُشف وأُصلح (P1 — بوابة `commit-and-push-branch.sh` كانت مكسورة
فعليًا):** السكربت كان يستخدم `pnpm run build` الجذري، الذي يُشغّل build
لكل حزم monorepo بما فيها حزمتا تسويق Replit هامشيتان (`majalis-pitch`,
`majalis-promo`) تتطلبان `PORT`/`BASE_PATH` غير مُعرَّفين، غير مرتبطتين
بعمل النافذتين إطلاقًا. أفشل هذا البوابة فعليًا بلا علاقة بأي تعديل
حقيقي. أُعيد تقييد البوابة لـ`pnpm --filter @workspace/majalis run
build`، مطابقًا لنطاق pre-commit hook المحلي و`.github/workflows/auto-merge-to-main.yml`
الموجودين فعلًا. **⚠️ نفس الخلل لا يزال قائمًا في نسخة `automation/content`
من نفس السكربت** — لم يُصلَح هناك (هذه النافذة ممنوعة من تعديل فرعها).
(commit `4e3ce08a`)

## 2026-07-24 — الدفعة 2: مراجعة docs/design-system.md + اكتشاف بنية CSS

راجعت `docs/design-system.md` (Design System v2، 180 سطرًا) قسمًا قسمًا
مقابل الكود الحي عبر `rg` فعلي — التفاصيل الكاملة والدليل لكل قسم في
الملف نفسه (كل قسم موسوم ✅ حي / ⚠️ جزئي / ❌ ميت). ملخص: الألوان/الخط
الأساسي (Cairo/Tajawal)/تباعد v2/تدرجات/`IslamicOrnament` ميتة؛
`.ds-btn`/`.ds-card`/`.ds-input`/`IslamicDivider`/نقاط الانكسار حية.

**اكتشاف غير مخطَّط له أثناء هذا التحقق:** الموقع يحمّل **9 ملفات CSS
متتالية** في `src/main.tsx` (`index.css` 18879 سطرًا ← `design-system.css`
5420 ← `patterns.css` ← `highlighted-content.css` ← `majalis-v2.css`
3169 ← `modern-2026.css` 1787 ← `elite-2026.css` **33306** [الأكبر
والأخير تحميلًا] ← `sins-rights.css` ← `final-release.css`) — **+60 ألف
سطر CSS إجمالًا**، بأنظمة توكِن متوازية (`--ds-*`, `--m26-*`, `--elite-*`,
`--txt-*`, `--msk-*`, `--majalis-*`) متراكمة من عدة جلسات إعادة تصميم لم
تُوحَّد. القيم الفعلية متسقة (كلها v3 `#173D35`)، فقط التسمية/البنية
مبعثرة. **تغيير عالي المخاطر — سُجِّل في `backlog.json` بحالة
`pending-owner-decision`، لم يُنفَّذ أي توحيد أو حذف ملف.**

**ملاحظة تشغيلية:** كل push يُعيد توليد `feed.xml` وموسوعة الأحكام
الفقهية (`manifest.json` + chunks) و`*.generated.ts` بطابع زمني فقط عبر
hooks البناء — تحقّقت diff فعليًا مرتين، لا محتوى مُعدَّل. نُظِّفت بـ
`git checkout --` قبل كل commit، لم تُضَف لأي commit. (commit `5fe96498`)

## 2026-07-24 — الدفعة 3: فحص أمني آلي (بلا تعديل كود — كل شيء نظيف)

اتّبعت ترتيب الأولوية الأصلي في الميثاق (بناء → **أمان** → iOS/RTL → ...)
بدل الانتقال المباشر لبند backlog التالي (تفويض hex، متوسط الخطورة
فقط، أجّلته). كل الفحوصات التالية سلبية (لا مشكلة) — لا تعديل كود لزم:

| الفحص | الأمر | النتيجة |
|---|---|---|
| أسرار مكتوبة حرفيًا (API keys, service_role) | `rg 'sk-[a-zA-Z0-9]{20,}\|AIza...\|service_role'` | لا نتائج |
| XSS عبر `dangerouslySetInnerHTML` | `rg -l dangerouslySetInnerHTML src` | ملفان فقط: `HomeInterestingTopics.tsx` (أيقونة SVG من مصفوفة `TOPICS` محلية ثابتة، لا مدخل مستخدم) و`chart.tsx` (قالب shadcn/ui قياسي، `THEMES` ثابت `{light:"", dark:".dark"}`) — كلاهما آمن، تتبّعت مصدر البيانات فعليًا لكل واحد |
| `eval` / `new Function` | `rg '\beval\(\|new Function\('` | لا نتائج |
| `innerHTML =` خارج React | `rg '\.innerHTML\s*='` | لا نتائج |
| حماية مسارات `/admin` | قراءة `AdminRouteGuard.tsx` | حارس فعلي: يستدعي `refreshUser()` الذي يتحول لتحقق خادم حقيقي (`getUser()`) على مسارات `/admin` تحديدًا، لا يكتفي بجلسة محلية مخبّأة |
| Open redirect عبر query params | `rg 'window.location...searchParams'` | لا نتائج (نمط بحث ضيّق، لم يُعمَّم على كل أنماط التوجيه) |

**لم يُفحَص:** سياسات RLS الفعلية على قاعدة البيانات الحية (يحتاج اتصال
Supabase مباشر عبر `supabase db query --linked`، خارج نطاق هذا الفحص
الساكن للكود). `AdminRouteGuard` حارس واجهة فقط؛ RLS هو الحد الحقيقي —
إن احتجت طمأنة كاملة استخدم منهجية `project_majalis_profile_escalation_fix`
من الذاكرة (تحقّق حي، لا ثقة بملفات migration وحدها).
