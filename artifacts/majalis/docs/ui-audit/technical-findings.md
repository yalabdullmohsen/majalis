# نتائج تقنية آلية — سجل تراكمي

كل بند هنا نتيجة أمر فعلي مُشغَّل، لا افتراض. أضف بندًا جديدًا عند كل
دفعة تكتشف شيئًا حقيقيًا؛ لا تكرر تشغيل فحص لم يتغيّر سببه.

## 2026-07-24 — الدفعة 1

| الأمر | النتيجة الكاملة |
|---|---|
| `pnpm run typecheck` | نظيف، بلا مخرجات أخطاء |
| `pnpm run lint` | نظيف (`--max-warnings 50`، لم يُلمَس الحد) |
| `node scripts/test-seo.mjs` | 736 صفحة مفحوصة، 0 مشكلة P0، 35 تحذير (كلها وصف meta قصير تحت `/admin/**`) |
| `node scripts/test-no-homepage-leak.mjs` | 4 نجح / 0 فشل — 232 صفحة كتب/علماء داخلية فُحصت لتسرّب محتوى الرئيسية |
| `node scripts/verify-color-contrast-gate.mjs` | نظيف — 25 إصلاح تباين سابق (جلسات ماضية) لا تزال ثابتة، لا انحدار |
| `rg -o --no-filename '#[0-9a-fA-F]{6}\b' src/styles src/components src/views \| wc -l` | 7220 تكرارًا حرفيًا لقيم hex |
| نفس الأمر + `sort -u \| wc -l` | 674 قيمة فريدة |
| `git ls-files seo-prerender \| wc -l` | 736 — مُتتبَّع بالكامل في git (ملاحظة: مخرج build يُعاد توليده بالكامل من `generate-seo.mjs` عند كل build، فكونه متتبَّعًا ليس خطأً بحد ذاته طالما `pnpm run build` يُشغَّل قبل كل نشر — تحقّق هذا مُطبَّق في `release-majlisilm.yml`) |

**تشخيص شكاوى الطلب الأصلي (نص/تنقّل قديم في SEO، تسرّب محتوى الرئيسية):**
كل الفحوصات أعلاه نظيفة على شجرة المصدر الحالية. الأرجح: هذه أعراض
نُسخة إنتاجية منشورة قديمة (قبل إصلاحات جلسات لاحقة)، ستُحل تلقائيًا
عند تشغيل `release-majlisilm.yml` القادم. لم يُسجَّل كبند إصلاح كودي —
فقط كبند مراقبة بعد النشر القادم.

**اكتُشف وأُصلح هذه الدفعة:** تعارض ثلاثي بين `docs/design-tokens.md`
(`#0E6E52`)، `docs/design-system.md` (`#1F6E54`)، والقيمة الحقيقية في
`modern-2026.css` (`#173D35`). التفاصيل والإصلاح في `progress.md`.

**اكتُشف وأُصلح هذه الدفعة (P1 — يمنع البناء في أي worktree جديد):**
خمسة ملفات `tsconfig.tsbuildinfo` (`lib/api-client-react`, `lib/api-zod`,
`lib/db`, `scripts`, وجذر المستودع) كانت مُتتبَّعة في git رغم أن
`.gitignore` يستثنيها صراحةً (`**/*.tsbuildinfo`) — على الأرجح أُضيفت
قبل قاعدة gitignore هذه. الأثر: أي `git worktree add` جديد (بما فيها
`automation/content` و`automation/tasks` نفسيهما) يستنسخ cache بناء
"مُحدَّث" كذبًا يخبر `tsc --build` أن `lib/api-zod` مبني فعلًا رغم عدم
وجود `dist/` أصلًا — فيفشل `pnpm run build` الجذري بخطأ TS6305 في
`artifacts/api-server` (وربما مستهلكين آخرين لاحقًا). **مُؤكَّد فعليًا:**
هذا بالضبط ما حدث عند أول `pnpm run build` في هذه الدفعة. الإصلاح:
`git rm --cached` للملفات الخمسة (البناء المحلي يبقى يعمل، فقط تتوقف عن
التتبّع في git من الآن). تحقّق بعد الإصلاح: `pnpm run typecheck:libs`
و`pnpm --filter @workspace/api-server run typecheck` كلاهما نظيف.
