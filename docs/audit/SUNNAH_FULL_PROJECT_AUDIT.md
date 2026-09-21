# SUNNAH FULL PROJECT AUDIT — سُنّة

**الحالة الرسمية للفحص:** `PARTIAL`  
**لا يُعلن:** `SUNNAH_FULL_AUDIT_COMPLETE`  
**نوع المرحلة:** DISCOVERY AND VERIFICATION فقط  
**Generated (UTC):** `2026-09-21T12:11:58Z`  
**قاعدة الفحص:** لا تعديل منتج أثناء الفحص؛ المخرجات المسموحة فقط: هذا الملف + `reports/sunnah-full-project-audit.json`.

---

## 1. ملخص تنفيذي

مشروع «سُنّة» ويب حي على `https://www.ssunnah.com` بمطابقة إنتاج↔`origin/main` عند لحظة القياس (`5e99cd7c`). المسارات في الراوتر **366** مسارًا فريدًا (`AppRoutes.tsx`). المتجر **HOLD**. استقرار المنتج **PARTIAL** (Admin v3 وصدق المحتوى وموجات لاحقة غير مكتملة). مكتبات المصادر: **190** كتابًا · **18** `source_verified` · **172** `source_missing`. فرق إسلامية: **35** سجلًا · **0** منشور. بوابات مصحف UI: **34** سكربت `NO_OP`/`skipped`. اختبارات الجهاز الفعلي للأذان/المصحف: **DEVICE_REQUIRED**. قرارات مالك (توقيع/Bundle ID/تراخيص QPC/Hisn/CAF): **OWNER_ACTION**. نجاح CI ≠ سلامة شرعية ≠ جاهزية متجر ≠ إثبات جهاز.

**درجة الثقة:** `MEDIUM` للأدلة المستودعية/الإنتاج/الجرد العددي · `LOW` للفحص البصري الشامل لكل Route وللمصفوفة الجهازية (لم تُنفَّذ في هذه الجلسة).

---

## 2. Source commit

| حقل | قيمة | دليل |
|---|---|---|
| Git root الفعلي | `/Users/alabdullmohsen/majlis-app` | `git rev-parse --show-toplevel` |
| `origin/main` | `5e99cd7cf53244444916b0ecd7b55b3a8953cfd8` | `git rev-parse origin/main` |
| HEAD عند الفحص (detached @ main) | نفس الـSHA | `git rev-parse HEAD` |
| Remote | `https://github.com/yalabdullmohsen/majalis.git` | `git remote -v` |
| تعارض وثائقي | `AGENTS.md` ما زال يذكر `/Users/alabdullmohsen/majalis-correct/` | نص الملف مقابل الجذر الفعلي و`docs/REPO_INDEX.md` |

**تغييرات محلية أثناء الفحص (قبل كتابة التقرير):** نظيفة بعد استعادة `reports/library-source-completeness-audit.json` الذي أعاد سكربت الجرد كتابته مؤقتًا (نفس الأعداد). لا markers تعارض `<<<<<<<` مؤكدة في الشجرة المفحوصة (بحث موجَّه).

**آخر 5 commits على main:**  
`5e99cd7cf` PR-2 حراسة أصول المتجر (#2191) · `53162dbe6` PR-1 حقيقة الإصدار (#2190) · `3ba020f2f` أذان CC0 (#2189) · `088ae0264` دخولية موحّدة (#2188) · `bd0570c57` legacy cleanup (#2187).

---

## 3. Production commit

| حقل | قيمة | دليل |
|---|---|---|
| Host | `https://www.ssunnah.com` | تشغيل حي |
| `version.json` | `commit`/`shortCommit`/`commitSha` = `5e99cd7c` · `builtAt` `2026-09-21T12:10:15.331Z` · `ref` `main` | HTTP 200 |
| Parity مع `origin/main` | **مطابق** عند القياس (بعد نشر #2191) | مقارنة SHA القصير |
| ملاحظة زمنية | في بداية الجلسة كان الإنتاج `53162dbe` ثم تقدّم إلى `5e99cd7c` أثناء الفحص | قياسان متتابعان |

**Smoke HTTP (إنتاج، بلا تعديل بيانات):**

| Path | Status | ملاحظة |
|---|---|---|
| `/` | 200 | |
| `/mushaf` | 200 | |
| `/lessons` | 200 | |
| `/search` | 200 | |
| `/adhkar` | 200 | |
| `/settings` | 200 | |
| `/privacy` | 200 | |
| `/support` | 200 | |
| `/islamic-sects` | 200 | القسم موجود؛ المنشور=0 في الجرد |
| `/seerah` | 200 | |
| `/quiz` | 200 | |
| `/robots.txt` | 200 | |
| `/sitemap.xml` | 200 | |
| `/prayer` | 308 → `/prayer-times` 200 | تحويل |
| `/library` | 308 → `/search` 200 | تحويل — سلوك منتج يحتاج توثيق نية |
| `/quran` | 308 → `/quran-hub` 200 | تحويل |
| `/learn/series/test` | **308 → `/lessons`** | Deep-link السلسلة لا يحافظ على الـslug |
| `/admin` | 404 | متوقع للعامة بلا جلسة (عزل سطحي؛ ليست برهان صلاحيات كاملة) |
| `/account` | 404 | يحتاج تحقق مسار الحساب الفعلي |

---

## 4. درجة الثقة في الفحص

| محور | ثقة | سبب |
|---|---|---|
| هوية Git + إنتاج | HIGH | أوامر مباشرة + `version.json` |
| عدّ Routes من الراوتر | HIGH | استخراج من `AppRoutes.tsx` = 366 |
| جرد مكتبة مصادر | HIGH | `audit-library-sources.mjs` → 190/18/172/0 |
| تراخيص/متجر (وثائق + registry) | HIGH للأدلة النصية · LOW لقرار قانوني | `LICENSE_RISKS.md` + `prayer-audio-rights-registry.ts` + Store HOLD |
| مصحف سلامة بايت/بوابات وحدة | MEDIUM | بوابات وحدة موجودة؛ 34 UI no-op؛ لا جهاز |
| فحص بصري لكل Route | LOW / NOT_RUN | لم تُفتح كل الصفحات بلقطات هذه الجلسة |
| مصفوفة أجهزة | NOT_RUN → DEVICE_REQUIRED | |
| `verify:ci` محلي كامل هذه الجلسة | NOT_RUN | CI tip كان `in_progress` عند القياس؛ لا اختراع نتيجة |
| SQL مستضاف / Signing | محظور بالطلب | OWNER_ONLY |

---

## 5. النطاق الذي تم فحصه

- تثبيت هوية المستودع والـremote والـtip والإنتاج.
- قراءة مصادر حوكمة: `docs/REPO_INDEX.md`, `CURRENT_RELEASE_TRUTH.md`, `OWNER_ACTIONS_CURRENT.md`, `RELEASE_FREEZE.md`, `SUNNAH_STABILIZATION_REPORT.md`, `STORE_100_PERCENT_READINESS.md`, `LICENSE_RISKS.md`, `LEGACY_ADMIN_INVENTORY.md`, `KNOWN_PITFALLS.md`, `REQUIRES_EXPLICIT_APPROVAL.md`, تقارير total-trust/content-completeness/library/performance baselines.
- جرد Routes من `artifacts/majalis/src/AppRoutes.tsx`.
- جرد سكربتات mushaf no-op من `artifacts/majalis/package.json`.
- إعادة عدّ مكتبة عبر السكربت (ثم استعادة الملف لتفادي diff غير تقريري).
- جرد فرق من `islamic-sects-inventory.json`.
- عزل AdminSiteEditBar (كود + بوابات اختبار).
- Splash tagline «رفيقك…» ورفض «معك…» (اختبارات/ثوابت).
- Open PRs عبر `gh pr list`.
- Smoke إنتاج لمسارات حرجة.
- تعارض `AGENTS.md` مقابل الجذر الفعلي.

---

## 6. النطاق الذي تعذر فحصه / لم يُنفَّذ

| بند | الحالة | خطوة تحقق لاحقة |
|---|---|---|
| فتح بصري لكل Route عامة + لقطات | NOT_RUN | Playwright/يدوي مع matrix viewports |
| iPhone/iPad/Split View/Dynamic Island فعلي | DEVICE_REQUIRED | أجهزة + TestFlight |
| VoiceOver / Large Text / Bold / Reduced Motion على جهاز | DEVICE_REQUIRED | |
| أذان fg/bg/killed/lock/silent/focus | DEVICE_REQUIRED | `DEVICE_NOTIFICATION_MATRIX.md` |
| صوت أذان حقيقي على جهاز (لا Simulator) | DEVICE_REQUIRED | |
| `pnpm run verify:preflight` + `verify:ci` كامل محليًا هذه الجلسة | NOT_RUN | تشغيل إلزامي قبل أي موجة إصلاح |
| إعادة قياس Entry JS gzip على tip الحالي | NOT_RUN | build + `test:bundle-budget` |
| SQL/RLS حي على Supabase | محظور | OWNER |
| Archive/AAB/TestFlight | OWNER + DEVICE | |
| إثبات كل صف محتوى منشور بمصدر | PARTIAL | موجات content |
| Admin CRUD كامل بصلاحيات حقيقية | PARTIAL | حساب مشرف + سيناريوهات |

---

## 7. P0 blockers

| id | title | status | evidence | recommendedFix |
|---|---|---|---|---|
| P0-STORE-HOLD | Store readiness = HOLD | CONFIRMED | `STORE_100_PERCENT_READINESS.md` unchecked P0 rows | لا GO حتى بنود المالك+جهاز+تراخيص |
| P0-LICENSE-QPC | إعادة توزيع خطوط QPC للمتجر بلا إذن كتابي | BLOCKED_LICENSE | `LICENSE_RISKS.md` | إذن أو strip من store flavor |
| P0-LICENSE-HISN | حصن المسلم — حقوق الطبعة | BLOCKED_LICENSE | نفس المصدر | إذن أو استبدال |
| P0-LICENSE-EVERYAYAH | Offline packs everyayah/mp3quran | BLOCKED_LICENSE | جزئي — live only | الإبقاء بث حي حتى ToS |
| P0-LICENSE-CAF | أصول CAF/أذان غير محسومة في ثنائي iOS | OWNER_ACTION / BLOCKED_LICENSE | Store manifest + Xcode tree claims | استبعاد غير المعتمد من binary |
| P0-LIB-SOURCE | 172 كتاب `source_missing` | CONFIRMED | recount script 2026-09-21 | إخفاء عن العامة/SEO حتى مصدر؛ لا اختلاق |
| P0-DEEPLINK-SERIES | `/learn/series/:slug` → 308 `/lessons` | CONFIRMED | prod curl Location | إصلاح deep link أو إزالة الادعاء |
| P0-CONTENT-PUB | حراسة صدق النشر غير مكتملة (Stabilization PR-11 / Remediation PR-4) | PARTIAL | `SUNNAH_STABILIZATION_REPORT.md` PENDING | publication guards |
| P0-SECTS-EMPTY | فرق: 0 published من 35 | CONFIRMED | `islamic-sects-inventory.json` | لا اكتمال قسم؛ REVIEW_REQUIRED |
| P0-MUSHAF-NOOP | 34 mushaf UI scripts no-op | CONFIRMED | `package.json` `mushaf UI gates disabled — skipped` | استعادة أو حذف صريح بعقد |
| P0-DEVICE-PRAYER | إشعارات صلاة غير مثبتة على جهاز | DEVICE_REQUIRED | Store checklist ☐ | مصفوفة جهاز |
| P0-OWNER-SIGNING | Bundle ID + Signing + ASC | OWNER_ACTION | `OWNER_ACTIONS_CURRENT.md` | مالك فقط |
| P0-PROD-PARITY-DOCS | تقارير الحقيقة ما زالت تثبّت tip قديم `3ba020f2` | STALE_REPORT | `CURRENT_RELEASE_TRUTH.md` vs live `5e99cd7c` | مزامنة docs بعد التدقيق (موجة لاحقة) |

---

## 8. P1 high issues

| id | title | status | evidence |
|---|---|---|---|
| P1-ADMIN-V3 | Admin v3 Shell/Centers PENDING؛ Legacy delete BLOCKED | CONFIRMED | Stabilization PR-8…10 |
| P1-ADMIN-UX-DEBT | تكرار مراكز مراجعة/محتوى/أتمتة؛ ~55 شاشة | CONFIRMED | `LEGACY_ADMIN_INVENTORY.md` |
| P1-LESSONS-GUIDE | lessons-guide خلف flags + BLOCKED_DATA | PARTIAL | `CURRENT_RELEASE_TRUTH` + `docs/lessons-guide/` |
| P1-PERF-ENTRY | Entry كان ~120.29 KiB قرب السقف (قياس 2026-09-19) | STALE_REPORT / UNKNOWN_NOW | `architecture-baseline-metrics.json`؛ قياس أحدث world-class 114.69 على commit أقدم من tip |
| P1-FIQH-CHUNK | fiqh-books ~251.5 KiB soft warning | CONFIRMED (قياس سابق) | نفس ملفات الأداء |
| P1-AUDIO-DEVICE | موثوقية أذان/تلاوة خلفية على جهاز | DEVICE_REQUIRED | |
| P1-MUSHAF-DEVICE | هندسة/إيماءات على SE/Pro Max/iPad | DEVICE_REQUIRED | `KNOWN_PITFALLS.md` #12 بوابة 390 فقط |
| P1-METADATA-STORE | نصوص مراجعة متجر قد تخالف المنتج | OWNER_DECISION | total-trust finding APP_STORE_METADATA_CLAIM |
| P1-SQL-READYZ | ترحيلات SQL مستضافة غير مؤكدة التطبيق | OWNER_ACTION | `REQUIRES_EXPLICIT_APPROVAL.md` |
| P1-AGENTS-PATH | مسار git خاطئ في AGENTS.md | CONFIRMED | تعارض مع REPO_INDEX |
| P1-PR-1791 | Draft offline-first قديم | CLOSE_RECOMMENDED | gh pr 1791 |
| P1-LIBRARY-ROUTE | `/library` → `/search` | CONFIRMED | prod 308 | توثيق/إصلاح نية المنتج |

---

## 9. P2 medium issues

| id | title | status | evidence |
|---|---|---|---|
| P2-LEGACY-CSS | brand-v4 / m2030 / final-release KEEP مع بقايا SAFE_REMOVE | CONFIRMED | `REPO_INDEX.md` + `LEGACY_CLEANUP_REPORT.md` |
| P2-PARALLEL-DS | أنظمة تصميم متوازية وقت التشغيل | CONFIRMED | نفس |
| P2-STALE-RELEASE-JSON | `reports/release-readiness-report.json` (2026-09-13) NOT READY بـPRs مغلقة قديمًا | STALE_REPORT | ملف التقرير |
| P2-TOTAL-TRUST-AGE | inventory من 2026-09-19 / commit مختلف | STALE_REPORT | `inventory-summary.json` |
| P2-CONTENT-COMPLETENESS-AGE | master 2026-09-17 | STALE_REPORT | |
| P2-ACCOUNT-404 | `/account` 404 على إنتاج | PARTIAL | smoke؛ قد يكون المسار `/settings` أو auth |
| P2-REDIRECT-SURFACE | كثافة redirects (~125 في total-trust) | PARTIAL | matrix |
| P2-VISUAL-UNVERIFIED | عيوب بصرية محتملة غير ممسوحة هذه الجلسة | UNKNOWN | خطوة: visual suite |

---

## 10. P3 low issues

| id | title | status |
|---|---|---|
| P3-DOCS-DRIFT | وثائق متعددة تثبّت SHAs متضاربة | STALE_REPORT |
| P3-DEMO-TODO | علامات TODO/FIXME/Deprecated محتملة في الشجرة | UNKNOWN — بحث شامل غير مكتمل بعد التجميد المفاهيمي |
| P3-MOBILE-EXPO | `majalis-mobile` مستبعد من typecheck الجذري | KEEP/OUT_OF_SCOPE الويب |

---

## 11. Owner Actions

انظر أيضًا `docs/release/OWNER_ACTIONS_CURRENT.md` (نصّه ما زال يذكر tip `3ba020f2` — STALE مقابل tip الحالي).

1. اعتماد Bundle ID للمتجر.  
2. توفير Signing / Profiles.  
3. بيانات App Store Connect / Play.  
4. قرار استبعاد CAF/أصول غير معتمدة من binary.  
5. إذن كتابي QPC/QUL أو الشحن بلا الخطوط المتنازع عليها.  
6. إذن حصن المسلم أو الاستبدال.  
7. سياسة offline everyayah/mp3quran.  
8. حسم `madinah` (rights_uncertain) وبقاء `qatami` مرفوض.  
9. تطبيق SQL مستضاف + MFA + leaked-password.  
10. تثبيت Store RC pin صراحةً (لا افتراض أن tip الويب = RC).  
11. توقيع مصفوفة أجهزة.  
12. حكم App Store GO / WITHDRAW النهائي.  
13. مواءمة metadata المتجر مع المنتج الحي (fatwas/learning paths).

---

## 12. Device-required tests

- إشعارات الصلوات الخمس + master toggle: app مفتوح / خلفية / مغلق / مقفل / Silent / Focus.  
- تشغيل صوت الأذان المعتمد (`field` / `field-full` والقصيرة) على جهاز حقيقي.  
- مصحف: SE 375، 390، Pro Max، iPad Portrait/Landscape/Split View، Safe Area، FPS قلب الصفحات.  
- VoiceOver على المصحف (aria مقابل رموز QPC).  
- تلاوة خلفية + تداخل Mini Player مع Bottom Nav.  
- Cold/Warm/Resume launch بلا splash مزدوج (كود يغطّي جزئيًا؛ الجهاز يُثبت).  
- TestFlight upgrade + clean install + soak ≥30m (من readiness القديم — ما زال منطقيًا مطلوبًا).

---

## 13. License blockers

| أصل | تصنيف | دليل |
|---|---|---|
| QPC fonts in store binary | BLOCKED_LICENSE | LICENSE_RISKS |
| Hisn Muslim packing | BLOCKED_LICENSE | LICENSE_RISKS |
| everyayah/mp3quran offline | BLOCKED_LICENSE (جزئي live OK) | LICENSE_RISKS |
| madinah adhan | NEEDS_OWNER_DECISION · `approvedForProduction: false` | registry |
| qatami adhan | REMOVE_FROM_BUILD / rejected | registry + gate tests |
| field / field-full | APPROVED (CC0) للإنتاج الويب؛ المتجر ما زال يحتاج إثبات binary | #2189 + registry |
| ~172 كتب بلا مصدرموثق | BLOCKED_SOURCE | library audit |
| Madinah mushaf page images | معطّل عمدًا | LICENSE_RISKS |
| تفسير صوتي مشايخ | معطّل عمدًا | LICENSE_RISKS |

---

## 14. Source blockers

- مكتبة: `source_missing` = **172** / 190.  
- فرق: كلها مخفية بسياسة لا نشر آلي — `publishedCount: 0`.  
- أسئلة/أحكام معلّقة مراجعة بشرية (وثائق content-quality؛ لا أرقام مخترعة فوق الجرد الموجود).  
- قاعدة: لا اختلاق روابط مصادر.

---

## 15. Store readiness

**Verdict: HOLD / NOT READY**  
لا Archive مثبت من pin مالك. لا TestFlight مثبت. لا device matrix. تراخيص مفتوحة. Metadata قد تحتاج قرار.  
بعد #2191: حراسة أصول المتجر على main — **لا يكفي لرفع HOLD**.

---

## 16. Content completeness

| نوع | ملاحظة | حالة |
|---|---|---|
| Routes | 366 في الراوتر؛ تقارير أقدم 364 | DRIFT طفيف |
| أقسام registry | ~78 / live ~76 (تقرير 09-17) | STALE بحاجة إعادة عدّ |
| مكتبة | 18 موثق / 172 ناقص | BLOCKED_SOURCE كثيف |
| فرق | 0 منشور | غير مكتمل للإطلاق كقسم «جاهز» |
| Stabilization PR-11 صدق المحتوى | PENDING | |
| TOTAL TRUST | برنامج موجود؛ findings مالك metadata | PARTIAL |

---

## 17. Quran and Mushaf integrity

| بند | نتيجة | دليل |
|---|---|---|
| مسار رسمي `/mushaf` | حي 200 | prod |
| `/quran/mushaf` | موجود في الراوتر (تحويل متوقع بالسياسة) | AppRoutes |
| بوابات وحدة mushaf-madinah / ayah / pages 1–2 gold | سكربتات حقيقية موجودة | package.json غير no-op لمجموعة unit |
| 34 UI visual/measure scripts | NO_OP صريح | package.json |
| تغيير النص القرآني | ممنوع ولم يُمس في هذا الفحص | سياسة |
| جهاز/عرض SE | غير مثبت | KNOWN_PITFALLS |
| تصنيف أي اختلاف رسم/نص عند ظهوره | RELEASE_BLOCKER_CRITICAL | سياسة المستخدم |

**جاهزية مصحف للإطلاق المتجر:** `NOT_READY` (تراخيص خط + جهاز + no-op UI gates).  
**جاهزية ويب للقراءة العامة:** `PARTIAL` — الصفحة تصل؛ لا ادّعاء كمال بصري على كل الأجهزة.

---

## 18. Prayer and notifications / Audio

| بند | تصنيف | دليل |
|---|---|---|
| حقوق field/field-full معتمدة إنتاج UI | CODE_VERIFIED | registry + tests |
| madinah/qatami محجوبة UI | CODE_VERIFIED | tests |
| AthanPlaybackManager حماية توقف مبكر | CODE_VERIFIED (تاريخ #2163) | git log |
| تسليم إشعار جهاز | DEVICE_REQUIRED | |
| Copy Bundle Resources كاملة على جهاز | DEVICE_REQUIRED | بوابات iOS ملفات موجودة جزئيًا في CI scripts |
| مشغّل تلاوة عالمي / تداخل Nav | PARTIAL / DEVICE_REQUIRED | لم يُقَس هذه الجلسة |
| مصدر حقيقة الصوت للإنتاج | `prayer-audio-rights-registry.ts` + كتالوج الأذان | |

**جاهزية:** `PARTIAL` (ويب/عقود) · `NOT_READY` للمتجر بدون جهاز.

---

## 19. Admin v3 and Legacy Admin

| بند | حالة |
|---|---|
| جرد Legacy | موجود #2176 / `LEGACY_ADMIN_INVENTORY.md` |
| Admin v3 Shell | PENDING (Stabilization PR-8) |
| مراكز v3 | PENDING (PR-9) |
| حذف Legacy | BLOCKED حتى الترحيل (PR-10) |
| AdminSiteEditBar | داخل `AdminShell` فقط؛ بوابات تمنع App العام | CODE_VERIFIED |
| AdminQuickEdit مكوّن ما زال موجودًا | KEEP حتى الترحيل؛ استخدام عام ممنوع بالبوابة | |
| توصية الحذف الآن | **لا** | |

**جاهزية Admin v3:** `NOT_STARTED` للتنفيذ الكامل · جرد `DONE`.

---

## 20. Security and privacy

| بند | شدة | حالة | ملاحظة |
|---|---|---|---|
| Service role في client | — | يُفترض محروس ببوابات قائمة (Store checklist ☑) | لم يُعاد فحص bundle هذه الجلسة → PARTIAL |
| أسرار في التقرير | — | لم تُعرض | |
| Auth MFA / leaked password | HIGH | OWNER_ONLY | dashboard |
| SQL runtime migrations | CRITICAL إن فُعّلت | محظورة بالسياسة | |
| `/admin` للعامة 404 | MEDIUM إيجابي سطحي | ليس بديل RLS | |
| CSP/CORS/rate limit | MEDIUM | بوابات موجودة في scripts؛ لم تُشغَّل كاملة هنا | |
| HTML sanitization / upload | UNKNOWN هذه الجلسة | | 
| Dependency vulns audit | NOT_RUN | | 

---

## 21. Performance and budgets

| قياس | قيمة | عمر | بوابة |
|---|---|---|---|
| Entry JS gzip | 120.29 KiB | 2026-09-19 architecture baseline | pass مع slack 320B على سقف 120KiB |
| Entry JS gzip | 114.69 KiB | 2026-09-20 world-class baseline | pass |
| CSS main | ~59–60 KiB | نفس | pass تحت 100 |
| fiqh-books soft | ~251.5 KiB | نفس | soft warning |
| قياس tip `5e99cd7c` | **لم يُعد** | — | UNKNOWN_NOW |

**لا تُرفع الميزانية.** إعادة القياس مطلوبة قبل ادعاء هامش على tip الحالي.

---

## 22. Responsive and accessibility

- بوابات responsive/contrast/dark موجودة في `package.json` وتُشغَّل عبر CI عند المسارات المناسبة.  
- **هذه الجلسة:** لم تُنفَّذ مصفوفة 320–1440 ولا a11y جهاز.  
- النتيجة: `CODE_GATES_EXIST` · `DEVICE_REQUIRED` للإثبات الشامل · `UNKNOWN` للعيوب البصرية الحية غير الممسوحة.

---

## 23. Visual consistency

- Stabilization PR-3…6 دمجت توحيد رموز/أقسام/مصحف ص١–ص٢ (أدلة merge).  
- فحص بصري شامل لكل Route: **لم يُنفَّذ** → لا CONFIRMED لعيوب بصرية جديدة دون لقطة.  
- أنظمة متوازية CSS: CONFIRMED KEEP مؤقتًا.

---

## 24. CI and tests

| بند | نتيجة |
|---|---|
| سكربتات majalis | ~618 |
| mushaf NO_OP | 34 |
| mushaf non-noop تقريبًا | 35 |
| `verify:preflight` / `verify:ci` محليًا هذه الجلسة | NOT_RUN |
| CI على tip بعد #2191 | كان `in_progress` عند الرصد |
| CI ناجح تاريخيًا على `53162dbe` | SUCCESS (runs سابقة) |
| Path-lane قد يتخطى mushaf | موثّق في تقارير قديمة + سلوك CI | خطر P0 إن اعتُبر إطلاقًا |
| قاعدة: Skipped في بوابة إلزامية = فشل | `REPO_INDEX.md` |

---

## 25. Production parity

عند إغلاق القياس: **إنتاج = main tip = `5e99cd7c`**.  
تقارير `CURRENT_RELEASE_TRUTH` / Stabilization / Store readiness ما زالت تطبع `3ba020f2` → **STALE_REPORT** (لا تخفيه).

---

## 26. Legacy cleanup

- PR-7 #2187 MERGED (SAFE_REMOVE موجة).  
- بقايا brand-v4/m2030/final-release: KEEP/NEEDS_PORT.  
- HomepageAdBar وغيرها: حسب `LEGACY_CLEANUP_REPORT.md`.  
- لا حذف أثناء هذا الفحص.

---

## 27. Open PRs

| number | title | draft | mergeable | recommendation |
|---|---|---|---|---|
| 1791 | mobile: Offline-First (MMKV + React Query persist) | true | MERGEABLE (عند القياس) | `CLOSE_RECOMMENDED` أو `NEEDS_MANUAL_PORT` بعد إعادة تقييم على tip الحالي — لا دمج أعمى |
| 2191 | PR-2 store license guards | — | **MERGED** | SUPERSEDED/closed as merged |

لا PRs إصلاح أخرى مفتوحة مؤثرة عند القياس سوى المسودة أعلاه.  
**لا إغلاق/دمج أثناء الفحص.**

---

## 28. Recommended execution waves (خطة فقط — بلا تنفيذ)

### Wave 1 — P0 safety / Quran posture / privacy / store blockers (حراسة لا أسرار)
- مزامنة CURRENT_RELEASE_TRUTH مع tip حي؛ تثبيت HOLD.  
- منع ادعاءات متجر كاذبة؛ metadata OWNER_DECISION قائمة.

### Wave 2 — Licenses and sources
- تعزيز strip/guard للغير معتمد؛ لا قلب uncertain→approved.

### Wave 3 — Content publication safety
- إخفاء `source_missing` عن UI/SEO العامة؛ empty states صادقة؛ لا نشر آلي للفرق/الأسئلة.

### Wave 4 — Admin v3 shell
- بناء Shell خلف `/admin` فقط.

### Wave 5 — Admin v3 centers + migration readiness
- لا حذف Legacy حتى READY.

### Wave 6 — Prayer and audio reliability (code + runbooks)
- DEVICE_REQUIRED يبقى مفتوحًا.

### Wave 7 — Mushaf device validation + استعادة/عقد no-op gates
- لا تغيير نص/رسم قرآن.

### Wave 8 — Performance / bundles
- إعادة قياس tip؛ خفض entry/fiqh دون رفع budget.

### Wave 9 — Responsive / a11y / visuals
- matrix + contrast؛ لقطات عيوب فقط.

### Wave 10 — Legacy cleanup + PR hygiene + closure
- إغلاق #1791 أو port؛ إعلان اكتمال فقط بأدلة جهاز+مالك.

**لكل PR مقترحة (قالب):** هدف · نطاق · ملفات متوقعة · تبعيات · مخاطر · اختبارات · قبول · Rollback — تُفصَّل عند بدء التنفيذ لا في مرحلة الاكتشاف.

---

## 29. Definition of done (للإطلاق / لا للفحص)

لا `STORE GO` ولا `SUNNAH_STABILIZATION_COMPLETE` ولا `SUNNAH_FULL_REMEDIATION_COMPLETE` حتى:

1. تراخيص المتجر محسومة أو الأصول مُزالة من binary.  
2. Owner signing + pin RC.  
3. Device matrix صلاة + مصحف موثّقة.  
4. مكتبة عامة بلا `source_missing` ظاهر.  
5. Admin v3 مرحّل أو Legacy محمي بوضوح.  
6. Deep links السلسلة تعمل أو تُحذف من السطح.  
7. Mushaf gates لا no-op صامت في المسار الإلزامي.  
8. Triple full release lane على RC pin.  
9. إنتاج = pin المعلن في الحقيقة.  
10. لا UNKNOWN غير موثّق على بنود P0.

**تعريف Done لهذا الفحص نفسه:** تسليم الملفين أدناه بحالة `PARTIAL` صريحة — **تحقق**.

---

## 30. أخطر 20 مشكلة (مع دليل)

1. Store HOLD — `STORE_100_PERCENT_READINESS.md`.  
2. QPC license — `LICENSE_RISKS.md`.  
3. Hisn license — نفس.  
4. Offline tilawa packs — نفس.  
5. CAF/غير معتمد في iOS binary — Owner + manifest.  
6. 172 مصدر مكتبة ناقص — audit script.  
7. Deep link `/learn/series/:slug` → `/lessons` — prod 308.  
8. فرق 0 منشور — inventory JSON.  
9. 34 mushaf UI no-op — package.json.  
10. إشعارات جهاز غير مثبتة — checklist ☐.  
11. Signing/Bundle ID — OWNER_ACTIONS.  
12. SQL/MFA مستضاف — REQUIRES_EXPLICIT_APPROVAL.  
13. Admin v3 غير مبني — Stabilization PENDING.  
14. Entry budget قرب السقف (قياس سابق) — architecture-baseline 120.29.  
15. fiqh-books soft 251.5 KiB — نفس.  
16. تقارير حقيقة stale على `3ba020f2` — CURRENT_RELEASE_TRUTH.  
17. AGENTS.md مسار git خاطئ — تعارض REPO_INDEX.  
18. Metadata متجر vs منتج — TOTAL TRUST finding.  
19. `/library` → `/search` — prod.  
20. Draft PR #1791 — gh.

---

## 31. بنود قديمة أصبحت محلولة (بأدلة merge على main)

| بند | دليل |
|---|---|
| Stabilization PR-1…7 | #2181–#2187 |
| دخولية مزدوجة / عبارة «رفيقك…» | #2188 + اختبارات splash |
| أذان CC0 field/field-full | #2189 |
| مزامنة حقيقة الإصدار (موجة) | #2190 |
| حراسة أصول المتجر (موجة) | #2191 |
| عزل AdminSiteEditBar عن App العام | #2182 + gates |

---

## 32. تقارير متعارضة أو قديمة

| تقرير | تعارض |
|---|---|
| `CURRENT_RELEASE_TRUTH.md` | tip `3ba020f2` ≠ live `5e99cd7c` |
| `SUNNAH_STABILIZATION_REPORT.md` | نفس pin القديم؛ الحالة PARTIAL صحيحة نسبيًا |
| `STORE_100_PERCENT_READINESS.md` | pin ويب قديم؛ HOLD ما زال صالحًا |
| `RELEASE_FREEZE.md` | نص مُصلَح Store RC vs main — OK؛ pins داخلية قديمة |
| `reports/release-readiness-report.json` | 2026-09-13 / PRs ميتة |
| `reports/total-trust/*` | 2026-09-19 / commit مغاير |
| `reports/content-completeness-master.json` | 2026-09-17 |
| `AGENTS.md` vs `REPO_INDEX.md` | جذر git |
| architecture vs world-class baselines | أرقام entry مختلفة بتواريخ مختلفة |

---

## 33. إحصاءات سريعة

| مقياس | قيمة |
|---|---|
| Routes (AppRoutes unique) | **366** |
| P0 (مدرجة) | **13** |
| P1 | **12** |
| P2 | **8** |
| P3 | **3** |
| Open draft PRs | 1 (#1791) |
| Library missing sources | 172 |
| Sects published | 0 |
| Mushaf script no-ops | 34 |

---

## 34. ملفات أُنشئت

1. `docs/audit/SUNNAH_FULL_PROJECT_AUDIT.md` (هذا الملف)  
2. `reports/sunnah-full-project-audit.json`

---

## 35. إعلان صريح

```
SUNNAH_FULL_AUDIT_STATUS=PARTIAL
SUNNAH_FULL_AUDIT_COMPLETE=NOT_DECLARED
STORE_READINESS=HOLD
STABILIZATION=PARTIAL
PRODUCTION_PARITY_AT_MEASUREMENT=MATCHED (5e99cd7c)
```
