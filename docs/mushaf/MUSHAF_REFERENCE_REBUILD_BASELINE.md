# Mushaf Reference Rebuild — Baseline (PR-0)

**Program:** سُنّة Mushaf UI — مطابقة المرجع البصري  
**Stage:** PR-0 — Analysis + inventory only (**لا إصلاح منتج**)  
**Base:** `origin/main` @ `aac7385b6`  
**Branch:** `cursor/mushaf-reference-rebuild-pr0-baseline`  
**Measured at:** `2026-09-24T18:40:00Z` (تقريبي)  
**Environment:** local agent · code inventory + reference image sampling  
**Reference images:** 10 ملفات جلسة (صفحات قراءة + بحث + فهرس) — **تكوين بصري فقط، ليست مصدر نص/أصول**

لا أرقام مخترعة للقياسات على الجهاز.  
لا استخراج نص قرآني من الصور.  
لا إعلان `MUSHAF_REFERENCE_REBUILD_COMPLETE` في PR-0.

---

## 1) قرار النطاق

| مطلوب | غير مطلوب / ممنوع |
|---|---|
| مطابقة الإحساس البصري للمرجع ضمن أصول مرخّصة | تصميم مصحف جديد من الصفر |
| ذهب مائل للأصفر لعلامة الآية + رقم داكن واضح | تغيير حرف/تشكيل/وقف/رقم آية/Page Mapping |
| إعادة استخدام المكونات المركزية | نسخ زخارف من صور المرجع أو PDF غير مرخّص |
| Feature Flag لاحقًا في PR-1+ | تعديل ملفات QPC / JSON الصفحات |

**الاستثناء المقصود الوحيد عن المرجع:** لون علامة الآية = ذهب سُنّة المائل للأصفر (ليس برونزًا باهتًا ولا أخضر).

---

## 2) مصدر القرآن والخط (مثبت)

| بند | قيمة | مسار |
|---|---|---|
| mushafId | **1** | `public/data/quran-v2/SOURCE.json` |
| الرواية | حفص / QCF V2 | provenance + SOURCE |
| صفحات | 604 | `public/data/quran-v2/pages/` |
| خطوط/صفحة عادية | 15 | preset + gates |
| خط العرض | QPC V2 per-page WOFF2 | `public/fonts/qpc-v2/p{1…604}.woff2` (**604 ملفًا**) |
| fontLicenseId | `kfgqpc-qpc-v2-pending-store-signoff` | `sunnah-mushaf-signature-preset.ts` |
| Upstream خط | quran.com CDN hafs v2 woff2 | `provenance.ts` |
| Fingerprint | انظر §8 | `SOURCE.json` |
| displayMode | `qpc-v2-text` | لا صور صفحات في الإنتاج |
| pageImagesInProduction | **false** | provenance |

### حالة الترخيص

| أصل | ترخيص | حالة PR-0 |
|---|---|---|
| QPC V2 fonts | KFGQPC/QUL — **توقيع متجر معلّق** | **RISK / BLOCKED_ASSET_LICENSE للمتاجر حتى التوقيع** · مستخدم حاليًا |
| quran-v2 JSON | نص قرآن + pipeline بيانات | **مقفل** — التعديل ممنوع |
| Amiri Quran | OFL | fallback فقط |
| زخارف سُنّة (CSS) | أصلية `createdForSunnah` | مسجّلة في Asset Registry |
| صور المرجع المرفقة | طرف ثالث / غير مرخّص للتوزيع | **مرفوض كأصل شحن** — قياس بصري فقط |
| QCF_BSML / PDF مدينة | غير موقّع | **غير مشحون** |

مرجع السجل: `artifacts/majalis/docs/mushaf/SUNNAH_MUSHAF_ASSET_REGISTRY.md`  
تدقيق سابق: `artifacts/majalis/docs/mushaf/SUNNAH_AUTHENTIC_MUSHAF_P0_AUDIT.md`

---

## 3) هيكل التنفيذ الحالي (مقابل الهدف)

| هدف المهمة | موجود اليوم؟ | ملاحظة |
|---|---|---|
| `MushafPageLayout` موحّد | جزئيًا عبر `MushafPage.tsx` | إعادة تسمية/تجميع في PR-1 |
| `MushafOpeningSpreadLayout` | ✅ | `MushafOpeningSpreadLayout.tsx` |
| `MushafAyahMarker` | ✅ | مكوّن واحد · `aria-hidden` على الزخرفة |
| `MushafPageNumber` | ✅ | مرتبط بـ `pageNumber` من البيانات |
| `MushafSurahHeader` | ≈ `MushafSurahBanner` | مطابقة زخرفية أدق في PR-3 |
| `MushafPageMetadata` | مضمّن في `MushafPage` | فصل مكوّن في PR-3 |
| `MushafBasmala` | ✅ عبر VerseLayer / madinah | |
| بحث | `MushafSearchSheet` | إعادة محاذاة UI في PR-7 |
| فهرس سور | ضمن أدوات المصحف | PR-8 |
| ذهب وحيد (لا أخضر) | ✅ بعد single-gold | لا Provider مزدوج |

قارئ الإنتاج الأساسي: `NewMushafReader` + `features/mushaf-reader/*`.

---

## 4) قياسات اللون — مرجع (عيّنات صور) vs حالي

عيّنات من صور القراءة النظيفة (بدون لوحة مفاتيح)، **تقريبية من بكسلات الهامش/المتن**:

| سطح | مرجع (عيّنة) | التنفيذ الحالي | فجوة |
|---|---|---|---|
| ورق الصفحة | ≈ `#FFFCF7` / `#FEFBF6` | `#FCF6E3` (`--mushaf-paper-warm-yellow`) | الحالي **أكثر اصفرارًا**؛ المرجع أقرب لعاجي بارد |
| ورق شاشات البحث | ≈ `#F4EFE9` | نفس ورق المصحف + طبقات UI | تفاوت طفيف |
| حبر النص | ≈ `#0B0909`–`#0E0C0C` | `#1C160E` | قريب (دافئ) |
| علامة آية (ذهب عيّنة) | ≈ `#B29575` (برونزي باهت في اللقطات) | `#C9A82E` fill / `#5F4814` رقم | الحالي أقرب لـ«ذهبي مائل للأصفر» المطلوب؛ الرقم موجود داكنًا |
| تدرج خلفية الصفحة | **لا** في المرجع | `radial-gradient` + layers على `.nm-root` | **مخالف لعقد «لا Gradient»** — إصلاح PR-1 |

> ملاحظة: عيّنات الذهب في الصور تميل للبرونز بسبب ضغط JPEG/إضاءة الشاشة؛ عقد المنتج يبقى ذهب سُنّة `#C9A82E` مع رقم داكن واضح — لا نسخ لون JPEG حرفيًا.

---

## 5) Typography / Geometry الحالية (كود)

| Token / عقد | قيمة حالية |
|---|---|
| `--mushaf-font-size` | `24px` (سقف آمن؛ ≥25 يكسر lineOverflow) |
| `--mushaf-line-height` | `1.85` |
| `--mushaf-ayah-mark-size` | `1.15em` (عام) |
| Opening mark size | كان/قد يكون `1.22em` لـ opening — يُراجع في بوابات الصفحات ١–٢ |
| أسطر عادية | 15 |
| ص١–ص٢ | content-driven عبر OpeningSpread |
| letter-spacing على النص | ممنوع (بوابات) |
| scale / transform على النص | ممنوع |

---

## 6) فجوات المطابقة الوظيفية (من المرجع + الكود)

| منطقة | المرجع | الحالي | PR لاحق |
|---|---|---|---|
| ورق بلا تدرج | عاجي مسطّح | تدرجات خفيفة | 1 |
| ترويسة سورة مزخرفة عريضة | شريط ذهبي مزخرف | `MushafSurahBanner` CSS أصلي | 3 |
| بيانات جزء/سورة/حزب | أعلى/أسفل بخط UI خافت | موجود جزئيًا | 3 |
| رقم صفحة بإطار مزخرف | إطار ذهبي سفلي | `MushafPageNumber` | 3 (صقل) |
| علامة آية ذهب مائل أصفر + رقم أوضح | المطلوب | ذهب موجود؛ وضوح الرقم يُراجع | 2 |
| البحث (كلمة/صفحة/سورة + تصنيفات) | شريط علوي + قوائم | `MushafSearchSheet` | 7 |
| فهرس سور (اسم + رقم صفحة) | قائمة رفيعة | موجود ضمن أدوات | 8 |
| إخفاء أدوات → صفحة نظيفة | نعم في المرجع | عقد immersive قائم — يُتحقق جهازًا | 6 / 11 |
| iPad / Split View | مطلوب | عقود جزئية | 9 |
| Dark Mode | هندسة ثابتة | tokens ليلية جزئية | 10 |

---

## 7) سلامة القرآن (خط أساس — لا تغيير في PR-0)

من `SOURCE.json` → `fingerprint` (مُثبَّت قراءة هذه الجلسة):

```
codesSha:      b21f6bdad370b8a6feea12236c844f809b3bdf9c191d312ac216543ed3c3ab7d
textsSha:      d7d6cae756ecb5fafe2885e9ab0f7193e9771864216b93ceb364b80a39a6ae26
verseOrderSha: c7fb16ced00ce9d1cacd0d1405d9ad2958219e1f7bbe89c1ae37899d84fb1264
ayahCount:     6236
wordCount:     83665
mushafId:      1
```

أي انحراف لاحق = **RELEASE_BLOCKER_CRITICAL**.

صفحات عيّنة للمقارنة البصرية لاحقًا (بدون OCR): **1, 2, 3, 99, 102, 105, 284, 300, 604**.

---

## 8) مخاطر مانعة / غير مانعة

| رمز | المعنى | في PR-0 |
|---|---|---|
| `BLOCKED_ASSET_LICENSE` | توقيع KFGQPC/QUL للمتجر معلّق | **مُسجَّل** — لا يوقف جرد PR-0؛ يوقف ادّعاء اكتمال متجر بلا توقيع |
| نسخ زخارف المرجع | ممنوع | ملتزم |
| غياب `MushafPageLayout` بالاسم | دين هيكلي | PR-1 |
| جهاز / TestFlight / CLS ميداني | NOT MEASURED | PR-11 |

---

## 9) خطة PRs (لا تُنفَّذ هنا)

| PR | هدف |
|---|---|
| **0** | هذا التقرير + بوابة جرد |
| 1 | Paper مسطّح + Typography tokens + هيكل Layout |
| 2 | Unified gold Ayah Marker (وضوح الرقم) |
| 3 | Surah Header + Metadata + Page Number |
| 4 | Opening 1–2 |
| 5 | Regular 3–604 |
| 6 | Tap / Swipe / toolbars |
| 7 | Search |
| 8 | Surah index |
| 9 | iPad / Split View |
| 10 | Dark / a11y / perf |
| 11 | Integrity + Visual QA + TestFlight |

كل PR من أحدث `origin/main` بعد دمج السابقة.

---

## 10) قبول PR-0

- [x] مصدر قرآن/خط/ترخيص موثّق  
- [x] مقارنة لونية تقريبية مرجع vs حالي  
- [x] جرد مكوّنات وفجوات  
- [x] Fingerprint مثبت  
- [x] لا تعديل منتج  
- [ ] قياسات جهاز/TestFlight — مؤجّل  

**الحالة:** PARTIAL  
(جرد مكتمل · ترخيص خط المتجر معلّق · بلا إعادة بناء بصرية بعد)
