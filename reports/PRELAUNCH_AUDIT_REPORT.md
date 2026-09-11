# تقرير ما قبل الإطلاق — سُنّة (Ssunnah)

**التاريخ:** 2026-09-11  
**الفرع:** `cursor/ssunnah-prelaunch-audit`  
**أساس المقارنة:** `origin/main` @ `ac351c90` (بعد دمج #1916)  
**أداة الأرقام:** `pnpm --filter @workspace/majalis run audit:prelaunch-readiness` → `reports/prelaunch-readiness.json`

---

## Release Verdict

# NOT READY FOR RELEASE

**السبب المختصر:** ما زالت أدلة عامة تُعرض دون اكتمال تحقق بشري مؤرّخ، وطابور معرفة `needs_review` كبير، وتنقية بنك الاختبارات/مصادر المكتبة غير مكتملة، ولم يُغلق قبول الجهاز (مصحف TestFlight) ولا `verify:release` الكامل في هذه الجولة.

مسار أقرب: **READY WITH CONDITIONS** بعد إغلاق الشروط في قسم Blockers أدناه.

---

## Blockers

| الدرجة | القسم | السبب | الإصلاح المطلوب |
|---|---|---|---|
| Critical | معرفة / تفسير | 1218 عنصرًا `needs_review` مقابل 2404 verified (توثيق الجولة 2) | الإبقاء محجوبًا عن العامة؛ مراجعة بشرية قبل `verified` |
| Critical | مؤسسات | 45/45 `contentStatus=needs_review` مع استمرار العرض في الدليل | مراجعة بشرية + `verifiedAt` أو إخفاء/شارة «غير مكتمل التحقق» صريحة في UI |
| Critical | مكتبة | ~162/173 كتابًا بلا رابط مصدر موثّق (وثيقة missing-or-unverified) | إخفاء أو إكمال المصدر قبل النشر |
| Critical | اختبارات | بنك أسئلة ≈8573 مع بقايا demo/`unreviewed` موثّقة تاريخيًا | تنقية Production من demo |
| Major | UI إعدادات | PR #1920 (soft-card للإعدادات) لم يُدمَج بعد لحظة التقرير | دمج بعد CI أخضر |
| Major | مصحف / جهاز | بوابة قبول TestFlight على جهاز حقيقي ما زالت معلّقة | إكمال قائمة قبول المصحف على iPhone |
| Major | إطلاق | لم يُشغَّل `verify:release` / رحلات الجهاز الكاملة في هذه الجلسة | تشغيل بوابة الإصدار + اختبار الرحلات على جهاز |
| Minor | جامعات | 37 جامعة `is_verified=true` مع `last_updated_at` حديث نسبيًا — لا يُعاد التحقق الخارجي في هذه الجولة | إعادة تحقق دوري للقبول/البرامج من المواقع الرسمية فقط |

**لم يُكتشف في هذه الجولة:** اختراع بيانات لملء الحقول، تعديل قرآن/حديث، أو تعطيل بوابات CI.

---

## Content Audit

| المؤشر | القيمة | المصدر |
|---|---:|---|
| كتب | 173 | `content-counts.json` |
| تاريخ إسلامي | 217 | نفس المصدر |
| فوائد | 641 | نفس المصدر |
| أسئلة اختبار | 8573 | نفس المصدر |
| خرائط ذهنية | 23 | نفس المصدر |
| أحكام (عداد) | 0 في counts — مسار فقه منفصل | نفس المصدر |
| دورات | 63 | نفس المصدر |
| أذكار | 325 | نفس المصدر |
| سؤال وجواب | 2295 | نفس المصدر |
| أمم | 21 | نفس المصدر |
| معالم | 34 | نفس المصدر |
| مؤسسات | 45 | كتالوج + counts |
| جامعات | 37 | كتالوج + counts |
| معرفة verified (جولة 2) | 2404 | `CONTENT_FILL_REPORT_ROUND2.md` |
| معرفة needs_review (جولة 2) | 1218 | نفس المصدر |
| بوابات محتوى `test:content-gates` | 7/7 ناجحة | تشغيل 2026-09-11 |
| اكتمال بيانات حرجة `audit:data-completeness` | P0/P1=0 | تشغيل 2026-09-11 |
| `ui-card` عام متبقّي | 0 ملف tsx عام | مسح آلي |
| Placeholders خطرة (lorem/localhost) في صفحات عامة | لا إصابات مؤكدة بعد التصفية | مسح آلي |

---

## Islamic Institutions

| | |
|---|---:|
| الإجمالي | 45 |
| بأنواع (mosque/university/library/center) | 12 / 7 / 10 / 16 |
| لديها website | 45 |
| أُضيف `sourceUrl` ← الموقع الرسمي (بدون ادّعاء verified) | 45 |
| `contentStatus=needs_review` | 45 |
| مكررات مُدمجة في هذه الجولة | 0 (لم يُنفَّذ دمج) |

---

## Mosques and Places

| | |
|---|---:|
| مساجد داخل كتالوج المؤسسات | 12 |
| معالم (`islamic-landmarks-data`) | 34 فريد |
| إحداثيات مدققة ميدانيًا في هذه الجولة | 0 (لم تُعاد زيارتها) |
| صور مرخّصة أُضيفت | 0 |

المساجد/المعالم الحالية تبقى على حالتها؛ أي توسعة تتطلّب مصدرًا رسميًا وتتبعًا.

---

## Universities Directory

| | |
|---|---:|
| الجامعات | 37 |
| لديها `website_url` | 37 |
| `is_verified=true` في الملف | 37 |
| بلا برامج | 0 |
| أقدم من 180 يومًا حسب `last_updated_at` | 0 (حسب القياس الآلي) |
| إعادة تحقق قبول 2026 من المواقع | **لم تُنفَّذ في هذه الجولة** (ممنوع الاختراع) |

---

## Design System

| البند | الحالة |
|---|---|
| توحيد soft-card (عبادة/فقه/تقويم/حساب/قصص…) | مدموج تدريجيًا عبر #1913–#1919 و#1916 |
| إعدادات/إشعارات/أذان soft-card | PR **#1920** قيد CI |
| `ui-card` عام | 0 |
| RTL | مفروض في المنتج؛ لا تقرير انحدار جديد هنا |
| Dynamic Type / تباين / Snapshots | بوابات المستودع موجودة؛ #1920 ما زال ينتظر بعض الفحوص |
| مصحف P0 | إصلاحات سابقة مدموجة؛ قبول الجهاز معلّق |

---

## Performance

| القياس | الحالة في هذه الجولة |
|---|---|
| Cold/Warm start أرقام جهاز | **غير مقاس** |
| LHCI / PSI | بوابات موجودة في CI؛ لم تُعدَّل عتباتها |
| طلبات مكررة / إلغاء | بوابات `verify:no-infinite-loading` + keep-previous للبحث/المحاور |
| سرعة الأدلة | غير مقاسة رقميًا هنا |

---

## Tests (تشغيل هذه الجولة)

| الفحص | النتيجة |
|---|---|
| `test:content-gates` | نجاح 7/7 |
| `audit:data-completeness` | نجاح (0 P0/P1) |
| `audit:feature-readiness` | نجاح |
| `test:soft-cards-system` / polish | نجاح على main |
| `test:loading-ux-gates` | نجاح |
| `directory-catalogs-quality-gate` | نجاح بعد إضافة حقول provenance |
| `audit:prelaunch-readiness` | نجاح تقني — حكم الإطلاق: READY WITH CONDITIONS داخليًا / **NOT READY** للإطلاق العام (انظر أعلاه) |
| `verify:release` كامل | **لم يُشغَّل** |
| اختبار جهاز TestFlight | **لم يُغلق** |

---

## Modified Files (هذه الدفعة)

| ملف | السبب |
|---|---|
| `artifacts/majalis/src/data/institutions-catalog.json` | إضافة `sourceUrl`/`sourceType`/`contentStatus=needs_review` دون اختراع verifiedAt |
| `artifacts/majalis/src/data/institutions-catalog.ts` | توسيع النوع للحقول الجديدة |
| `artifacts/majalis/scripts/audit-prelaunch-readiness.mjs` | بوابة أرقام ما قبل الإطلاق |
| `artifacts/majalis/package.json` | سكربت `audit:prelaunch-readiness` |
| `reports/prelaunch-directory-inventory.json` | جرد آلي |
| `reports/prelaunch-readiness.json` | ناتج البوابة |
| `reports/PRELAUNCH_AUDIT_REPORT.md` | هذا التقرير |

---

## External Actions (يدوي — مالك المشروع)

1. مراجعة بشرية لـ 45 مؤسسة ثم ضبط `contentStatus=verified` + `verifiedAt` أو إخفاؤها.
2. طابور 1218 معرفة `needs_review` (خصوصًا التفسير المنسوب).
3. مصادر المكتبة (~162) أو إخفاء السجلات.
4. تنقية بنك الاختبارات من demo.
5. إعادة تحقق روابط القبول الجامعية من المواقع الرسمية قبل المواسم.
6. App Store Connect: الخصوصية، الدعم، لقطات، ملاحظات المراجعة، حقوق الشعارات.
7. إكمال قبول المصحف على iPhone TestFlight.
8. دمج #1920 بعد اخضرار CI.

---

## First 72 Hours (بعد أي إطلاق مشروط لاحقًا)

- أعطال Crashlytics / Sentry.
- أخطاء API ونسب 5xx.
- بحث الأدلة (مؤسسات/جامعات/مساجد).
- تشغيل الوسائط والتنزيلات.
- إشعارات الأذان ومواقيت الصلاة.
- بلاغات تصحيح بيانات الأدلة.
- جاهزية rollback إلى commit `main` السابق.

---

## قواعد التزم بها التنفيذ

- لا بيانات مُختلقة لملء الحقول.
- لا تعديل قرآن/حديث/تخريج.
- لا تعطيل بوابات CI ولا `continue-on-error`.
- `sourceUrl` للمؤسسات = الموقع الرسمي الموجود أصلًا؛ **ليس** شهادة تحقق بشري.
