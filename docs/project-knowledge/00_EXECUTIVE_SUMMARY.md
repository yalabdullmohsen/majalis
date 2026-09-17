# 00 — ملخص تنفيذي لقاعدة معرفة «سُنّة»

**مصدر البناء:** commit `975505911116f6190e2d09fc97ced3dbbb02e37d` (HEAD الفرع الحالي) · `origin/main` عند التوليد: `bad075588ecc66a98a864ab9274e537b0174daf4`  
**الجذر الفعلي:** `/Users/alabdullmohsen/majlis-app`  
**درجة الثقة الافتراضية:** Confirmed ما لم يُذكر خلاف ذلك · المصدر: ملفات المستودع فقط.

---

## 1. تعريف «سُنّة» وهدفه والجمهور

«سُنّة» منصة عربية RTL للعلم الشرعي: قرآن ومصحف، دروس، حديث، عبادة (صلاة/أذكار/قبلة)، أقسام معرفية، بحث، وحساب مستخدم. الجمهور: طلاب علم ومستمعون عرب على الويب وCapacitor (iOS/Android). الهوية في الكود والواجهات: «سُنّة» (Capacitor `appName`). المصدر: `AGENTS.md`, `artifacts/majalis/capacitor.config.ts`, عناوين SEO.

## 2. الحالة الحالية للموقع والتطبيق

- **ويب إنتاجي نشط** عبر Vercel من `artifacts/majalis`؛ النطاق التشغيلي المؤكد في workflows/كود: `https://www.ssunnah.com` (ومرايا majlisilm.com مذكورة في وثائق/Auth). Confirmed: `auto-deploy.yml`, `capacitor.config.ts` server URL, `version.json` على الإنتاج في جلسات سابقة.
- **تطبيق المتجر 1.0.0:** Capacitor حول `artifacts/majalis` فقط — ليس Expo وليس Flutter. Confirmed: `PLATFORMS.md`.
- **Expo** (`majalis-mobile`) و**Flutter** (`majlisilm-flutter`): مجمّدان/مهجوران للمتجر. Confirmed: `PLATFORMS.md`.
- HEAD المحلي قد يختلف عن `origin/main` (فرع عمل + squash merge على main). Confirmed من `git rev-parse`.

## 3. المنتج والمسارات الإنتاجية الفعلية

| مسار | دور | حالة |
|---|---|---|
| `artifacts/majalis` | منتج ويب + مصدر Capacitor | Production |
| `artifacts/api-server` | Express لإشعارات Expo Push | Production مساعد |
| `artifacts/mushafi` | مرجع تسميع قادم — ممنوع الحذف | Reference |
| `artifacts/majalis-mobile` | Expo مجمّد | Frozen |
| `artifacts/majlisilm-flutter` | مهجور خارج workspace | Deprecated |
| `artifacts/majalis-pitch` / `promo` / `mockup-sandbox` | تسويق/تجارب — مستبعد من typecheck/build الجذر | Non-production |

المصدر: `PLATFORMS.md`, `docs/REPO_INDEX.md`, `pnpm-workspace.yaml`, `package.json` filters.

## 4. المعمارية المختصرة

- **عميل:** Vite 7 + React 19 + wouter + Tailwind v4 → متصفح و`webDir=dist` لـCapacitor.
- **بيانات/مصادقة:** مباشرة من العميل إلى **Supabase المستضاف** (لا DB محلية للتشغيل؛ `lib/db` placeholder).
- **API محدود:** دوال Vercel تحت `/api/*` (مساعد، push subscribe، جاهزية) + `api-server` للـExpo push.
- **محتوى ثابت:** JSON تحت `artifacts/majalis/public/data/**` + seeds في `src/lib/*`.
- **إقلاع:** `src/main.tsx` → `App.tsx` (مسار `/` eager-shell) → lazy `AppRoutes` (~364 Route).

## 5. أهم الميزات الموجودة (Active)

مصحف QPC 604، مركز قرآن، تفسير/تجويد (مسارات حية)، دروس/سلاسل/معلمون، صلاة (adhan-js محلي)، قبلة، أذكار، تسبيح، حديث موثّق، أقسام (~78 في registry)، بحث، إعدادات، حساب/تسجيل، إدارة `/admin*`, مساعد علمي (gate)، Discover Islam، تاريخ/سيرة/أنبياء، فوائد، مسارات تعلم/اختبارات متعددة.

## 6. ميزات جزئية / غير منجزة / مخفية

- منتج **المجمع الفقهي** محذوف من الواجهة؛ المسارات تُحوَّل إلى `/fiqh` (redirects + noindex). Confirmed: `AppRoutes.tsx`, بوابات fiqh-council.
- أحكام موسوعية كثيرة `pending_review` (تقارير inventory). Confirmed: `reports/rulings-route-inventory.json` نمط.
- روابط كتب مكتبة بلا تصفية كاملة (~173 في LICENSE_RISKS). Confirmed: `LICENSE_RISKS.md`.
- تسميع/ASR من `mushafi`: مؤجّل لـ1.1. Confirmed: `PLATFORMS.md`.
- OAuth Google/Apple: أعلام `false` في عميل supabase. Confirmed: استكشاف `supabase.ts`.
- بعض مسارات الإدارة/الأتمتة واسعة؛ فعاليتها على المستضاف **Unknown** بدون تحقق لوحة.

## 7. حالة المجالات الحرجة

| مجال | حالة مثبتة |
|---|---|
| المصحف | 604 صفحة QPC V2، بوابات سلامة، تطبيع مرجع آية (`ayah-ref-normalize.ts`) |
| الدروس | صفحات حية + Supabase helpers؛ بوسترات ممنوعة ببوابة |
| الصلاة | حساب محلي adhan-js؛ تفضيلات localStorage؛ تنبيهات محلية Capacitor |
| الإشعارات | محلية للصلاة؛ Push عبر Capacitor + api-server/Expo؛ Web Push جدول `push_subscriptions` |
| الصوت | كتالوجات أذان؛ تراخيص جزئية/معلّقة في LICENSE_RISKS |
| المحتوى | بذور JSON + content-guard في build؛ لا اختراع شرعي (حوكمة) |

## 8. Supabase والمصادقة

- متغيرات العميل العامة: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (أسماء فقط).
- بدونها: بناء يعمل وعميل placeholder؛ القوائم فارغة/تحميل. Confirmed: `AGENTS.md`.
- تأكيد البريد مفعّل على المشروع الحي (موثّق في AGENTS) → تسجيل ناجح بلا جلسة حتى التأكيد.
- RLS: مئات السياسات في SQL المستودع؛ **تطبيقها على المستضاف Unverifiable** من git وحده.
- لا Runtime DDL من التطبيق (بوابة `verify:no-runtime-ddl`).

## 9. CI والنشر

- CI: `.github/workflows/ci.yml` + path-lane + Verify build + ci-required.
- محليًا: `pnpm run verify:preflight` ثم مرة `pnpm run verify:ci`.
- Auto-merge squash إلى `main`؛ `auto-deploy.yml` بعد push على `main`.
- `artifacts/majalis/vercel.json`: `deploymentEnabled.main=true`.

### CONFLICT — سياسة النشر

| مصدر | الادعاء |
|---|---|
| `AGENTS.md` + `auto-deploy.yml` + `vercel.json` | الإنتاج من **`main`** تلقائيًا |
| جذر `DEPLOYMENT.md` | فرع **`production`** + موافقة يدوية؛ `main`=preview فقط |

**لا حسم هنا.** فرع `production` لم يُعثر عليه على remote في فحص سابق (Unknown حاليًا إن أُعيد إنشاؤه). راجع `14_CI_CD_DEPLOYMENT.md`.

### CONFLICT — جذر Git في الوثائق

`AGENTS.md` / `REPO_INDEX.md` يذكران `/Users/alabdullmohsen/majalis-correct` بينما الجذر الفعلي لهذه النسخة `/Users/alabdullmohsen/majlis-app`. Confirmed بالتشغيل.

## 10. أهم 20 مشكلة مثبتة (أدلة في المستودع)

1. تعارض وثيقة النشر `DEPLOYMENT.md` vs workflows/`vercel.json`.  
2. مسار جذر Git قديم في AGENTS/REPO_INDEX.  
3. Hosted Supabase schema drift محتمل (وثائق drift + packs متداخلة).  
4. تراخيص أذان/خطوط QPC/كتب مكتبة معلّقة (`LICENSE_RISKS.md`).  
5. صور مصحف المدينة 604 غير مرخّصة وممنوعة عمدًا.  
6. تعدد مصادر مواقيت قد تتباعد (`docs/PRAYER_TIME_DIAGNOSIS.md`).  
7. تنبيهات صلاة تحتاج تحقق جهاز حقيقي (نفس التشخيص).  
8. ميزانية الحزمة entry JS ضيقة (~120KiB gzip) — حساسة لأي سحب ثقيل.  
9. ازدواج `@types/react` web/Expo معروف (`AGENTS.md`).  
10. بقايا مسارات `/fiqh-council` في التوجيه/SEO رغم حذف المنتج.  
11. محتوى أحكام `pending_review` غير منشور.  
12. مكتبة بلا URL مصدر كامل لكتب كثيرة.  
13. OAuth معطّل رغم وجود دوال.  
14. Email confirmation يكسر توقع «تسجيل = دخول».  
15. IA bottom tabs في `ia-final-structure` تختلف عن bottom الحي (fiqh vs أقسام).  
16. `lib/db` Drizzle فارغ — وهم طبقة ORM.  
17. api-server يخزّن tokens في ملف JSON وليس جدولًا.  
18. ADMIN/SQL على الإنتاج يتطلب موافقة مالك (`REQUIRES_EXPLICIT_APPROVAL.md`).  
19. TestFlight منفصل عن نشر الويب — لا يُحدَّث تلقائيًا من merge ويب.  
20. كثافة routes (~364) مع aliases كثيرة → خطر روابط ميتة/ازدواج مفاهيم.

## 11. أهم 20 تحسينًا حسب الأثر (اقتراح فقط — بلا تنفيذ)

1. توحيد وثيقة النشر مع `vercel.json`/workflows.  
2. تصحيح مسارات الجذر في AGENTS/REPO_INDEX.  
3. جرد drift schema المستضاف + توثيق applied migrations.  
4. حسم تراخيص الصوت/الخطوط قبل متجر.  
5. اختبار جهاز حقيقي للصلاة/الإشعارات.  
6. إبقاء entry bundle تحت الميزانية.  
7. إكمال مصادر المكتبة أو Empty States صريحة.  
8. سياسة واضحة لـpending rulings.  
9. مواءمة IA_BOTTOM_TABS مع التنقل الحي أو إزالة المرجع المضلل.  
10. تضييق سطح `/admin*` وعمليات الأتمتة غير المستخدمة.  
11. توثيق سلوك email confirmation في UI.  
12. تقليل redirects المكررة client+vercel.  
13. مراقبة post-deploy-truth كعقد إنتاج.  
14. فصل أوضح للمحتوى Verified vs Draft.  
15. مسار تسميع 1.1 من mushafi بحدود واضحة.  
16. تقوية بوابات عدم ظهور internal IDs.  
17. تحسين حالات offline الموثّقة.  
18. تنظيف packs SQL المتداخلة.  
19. قياس LHCI/PSI كخط أساس مستمر (من الموجود فقط).  
20. دليل وكيل يشير لهذه القاعدة بدل إعادة الاستكشاف.

## 12. موانع الإطلاق (من الوثائق)

- تراخيص غير محسومة (صوت، خطوط، كتب) — `LICENSE_RISKS.md`.  
- SQL/Auth/Vercel لوحة — موافقة مالك.  
- تحقق إشعارات/صلاة على جهاز حقيقي غير مثبت في هذه المهمة.  
- TestFlight/signing خارج نطاق merge الويب.

## 13. قرارات تحتاج موافقة المالك

انظر `19_OWNER_DECISIONS.md` و`docs/REQUIRES_EXPLICIT_APPROVAL.md`: SQL إنتاج، Auth dashboard، Vercel secrets، Bundle ID، حذف بيانات، تغيير نصوص شرعية، سياسة نشر، analytics جديد، تراخيص أذان، طريقة مواقيت افتراضية.

## 14. ما لا يجوز تعديله دون موافقة

- `artifacts/mushafi` (حذف/تجميد حذف).  
- نص القرآن/ترتيب الآيات/بيانات صفحات المصحف المعتمدة.  
- `artifacts/majalis-mobile`, `majlisilm-flutter` كمسار متجر.  
- Runtime DDL / إضعاف CI gates.  
- أسرار و`.env` قيم.  
- هوية المتجر / Bundle ID `com.yousef.majlisilm`.

## 15. ملفات قاعدة المعرفة ومتى تُستخدم

| ملف | متى |
|---|---|
| `00_EXECUTIVE_SUMMARY.md` | إحاطة سريعة / لصق لوكيل |
| `01_REPOSITORY_MAP.md` | أين تعدّل |
| `02_ARCHITECTURE.md` | تدفق النظام |
| `03_TECH_STACK_AND_DEPENDENCIES.md` | إصدارات وأدوات |
| `04_PRODUCT_AND_FEATURES.md` | جرد ميزات |
| `05_ROUTES_AND_NAVIGATION.md` | مسارات وتنقل |
| `06_DATA_SUPABASE_AND_RLS.md` | بيانات وRLS |
| `07_AUTH_SECURITY_PRIVACY.md` | أمن وخصوصية |
| `08_CONTENT_SYSTEM.md` | محتوى وحوكمة |
| `09_QURAN_MUSHAF_AUDIO.md` | مصحف/تلاوة |
| `10_PRAYER_NOTIFICATIONS_AUDIO.md` | صلاة/إشعارات/صوت |
| `11_DESIGN_SYSTEM_AND_UI.md` | UI/ثيم |
| `12_PERFORMANCE.md` | أداء وميزانيات |
| `13_ADMIN_AND_OPERATIONS.md` | إدارة |
| `14_CI_CD_DEPLOYMENT.md` | CI/نشر |
| `15_TESTING_AND_QUALITY_GATES.md` | اختبارات |
| `16_ENVIRONMENTS_AND_EXTERNAL_SERVICES.md` | env وخدمات |
| `17_RISKS_AND_TECHNICAL_DEBT.md` | مخاطر |
| `18_ROADMAP.md` | خارطة مبنية على أدلة |
| `19_OWNER_DECISIONS.md` | قرارات مالك |
| `20_AI_AGENT_MEMORY.md` | ذاكرة تشغيلية للنسخ |
| `KNOWLEDGE_INDEX.json` | فهرس آلي |

`PROJECT_AUDIT.md`: **غير موجود** في الجذر (يوجد `AUDIT.md` / `AUDIT_REPORT.md`) — Unknown كملف مطلوب بالاسم.
