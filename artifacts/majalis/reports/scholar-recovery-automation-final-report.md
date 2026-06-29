# تقرير استعادة المشايخ وربط الأتمتة — نهائي

**التاريخ:** 2026-06-26  
**الفرع:** `cursor/scholar-recovery-automation-92e6`  
**النطاق:** استعادة جميع مشايخ الكويت المفقودين (بما فيهم الشيخ سالم بن سعد الطويل)، ملفات علمية مستقلة، ربط الأتمتة، منع التكرار، وتحسين البحث.

---

## 1. ملخص تنفيذي

تم تشخيص سبب اختفاء عدد من المشايخ ودروسهم من Production، وتنفيذ طبقة **سجل موحّد (Registry)** تُدمَج دائماً مع Supabase حتى عندما يكون `allowSeedFallback()` معطّلاً في الإنتاج. أُعيدت مسارات `/sheikhs` و`/sheikhs/:id`، وُسّعت بيانات الاستيراد، وربطت منظومة الأتمتة بجميع المشايخ عبر `scholar-automation-registry.mjs`.

---

## 2. الأسباب الجذرية

| # | السبب | الأثر |
|---|--------|-------|
| 1 | `allowSeedFallback() = false` في Production | دروس الكatalog (منها `sci-tawheed-saltaweel` لسالم الطويل) **لا تُدمَج** عندما يحتوي Supabase على أي صف درس |
| 2 | إعادة توجيه `/sheikhs` → `/lessons` (Vision 2.0) | تعطّل صفحة المشايخ والملف العلمي في SPA |
| 3 | `01-sheikhs.json` كان يضم 4 مشايخ فقط | نقص بيانات الملفات العلمية |
| 4 | `kuwait-sheikh-profiles.ts` كان يضم شيخاً واحداً | عدم تغطية بقية المشايخ |
| 5 | `fetchSheikhByIdForServer` يطابق بالاسم الحرفي | فشل ربط الدروس عند اختلاف صيغة الاسم |
| 6 | `sheikh-matcher.mjs` يعتمد على Supabase فقط | الأتمتة لا تتعرّف على مشايخ غير موجودين في الجدول |

---

## 3. الأرقام: قبل / بعد

| المؤشر | قبل الاستعادة | بعد الاستعادة |
|--------|---------------|---------------|
| **المشايخ في `01-sheikhs.json`** | 4 | **14** |
| **المشايخ في السجل الموحّد (Registry)** | 1 (`kuwait-sheikh-profiles`) + 8 تاريخيين (`DEMO_SHEIKHS`) | **14** مشايخ كويتيين معتمدين |
| **الدروس في catalog seed** | 17 (13 متحدثاً فريداً) — **مخفية** في Production عند وجود صفوف DB | **17** — **تُدمَج دائماً** بـ `external_key` |
| **درس سالم (`sci-tawheed-saltaweel`)** | موجود في seed/SEO لكن **غير ظاهر** في قائمة الدروس | **مستعاد** ومرتبط بـ `/sheikhs/salem-bin-saad-altaweel` |
| **ملفات علمية مستقلة (SEO slugs)** | غير متوفرة (إعادة توجيه) | **14** رابطاً دائماً `/sheikhs/{slug}` |
| **مصادر أتمتة مربوطة بكل شيخ** | جزئية / DB فقط | **14** سجل في `scholar-automation-sources.json` |
| **دروس أُعيد ربطها** | — | **17** (catalog) + جميع دروس DB عبر `sheikhNameKey` |

### المشايخ المستعادون (14)

د. عثمان بن محمد الخميس · د. راشد صليهم فهد الصليهم · د. منصور بن ناصر الخالدي · الشيخ أسامة الشطي · **سالم بن سعد الطويل** · الشيخ حسين بن مبارك المويزري · د. دهام أبو خشبة · د. محمد ضاوي العصيمي · د. مطلق جاسر مطلق الجاسر · نصار خالد نصار العجمي · حامد علي المسعد · فيصل زويد · سعد هزاع العتيبي · بندر محمد الميموني

---

## 4. ما تم تنفيذه

### أ) استعادة المشايخ والدروس

- **`kuwait-sheikhs-registry.ts`**: سجل موحّد من lesson-ads + scientific announcements + LESSONS_SEED + import JSON
- **`mergeRegistrySheikhs()`**: يُكمّل صفوف Supabase بمشايخ السجل دون تكرار
- **`lessons-service.ts` + `server-data.ts`**: دمج catalog seed **دائماً** (حتى في Production) عبر `external_key`
- **`01-sheikhs.json`**: توسعة إلى 14 مشيخاً كاملين (صورة، نبذة، مدينة، تخصصات)

### ب) الملف العلمي لكل شيخ

- **`/sheikhs`**: `SheikhsPage.tsx` + `SheikhsPageClient.tsx`
- **`/sheikhs/:id`**: `SheikhDetailPage.tsx` + `SheikhDetailClient.tsx` — صورة، نبذة، روابط، مواد، متون، دروس، دورات، RelatedKnowledge
- **SEO slug لسالم:** `/sheikhs/salem-bin-saad-altaweel`
- **Prerender موجود:** `seo-prerender/lessons/sci-tawheed-saltaweel/`

### ج) ربط الأتمتة

- **`lib/scholar-automation-registry.mjs`**: سجل Node للأتمتة + مصادر رسمية لكل شيخ
- **`data/import/scholar-automation-sources.json`**: 14 مشيخاً مع slugs ومصادر
- **`sheikh-matcher.mjs`**: يطابق السجل **قبل** Supabase — الأتمتة تغطي جميع المشايخ
- **منع التكرار:** محركات موجودة (`external_key`, `duplicate_source_url`, `content_hash`, `findDuplicateLesson`) — catalog merge يستخدم `external_key` كمعرّف ثابت

### د) البحث والربط

- **`search-suggestions.ts`**: مجموعة `sheikhs` من السجل
- **`corpus-search.mjs`**: fallback للسجل + autocomplete للمشايخ
- **`navigation.ts`**: رابط «المشايخ» → `/sheikhs`
- **`fetchSheikhByIdForServer`**: مطابقة `sheikhNameKey` + `lessonsForScholar`

### هـ) الحماية من التراجع

- **`scripts/verify-sheikh-recovery.mjs`**: 20 فحصاً
- **CI:** خطوة `verify:sheikh-recovery` في `.github/workflows/ci.yml`

---

## 5. الملفات والجداول المعدّلة

### ملفات جديدة

| الملف |
|-------|
| `src/lib/kuwait-sheikhs-registry.ts` |
| `src/views/SheikhsPage.tsx` |
| `src/views/SheikhDetailPage.tsx` |
| `lib/scholar-automation-registry.mjs` |
| `data/import/scholar-automation-sources.json` |
| `scripts/verify-sheikh-recovery.mjs` |
| `reports/scholar-recovery-automation-final-report.md` |

### ملفات معدّلة

| الملف | التغيير |
|-------|---------|
| `src/App.tsx` | استعادة `/sheikhs` و`/sheikhs/:id` |
| `src/lib/lessons-service.ts` | دمج catalog دائماً + `fetchLessonById` من seed |
| `lib/supabase/server-data.ts` | دمج registry + lessons + إحصائيات |
| `data/import/01-sheikhs.json` | 4 → 14 مشيخاً |
| `src/components/seo/SheikhDetailClient.tsx` | ملف علمي كامل |
| `src/components/seo/SheikhsPageClient.tsx` | بطاقات بصور |
| `src/lib/kuwait-sheikh-profiles.ts` | re-export من السجل |
| `src/lib/navigation.ts` | `/sheikhs` في القائمة |
| `src/lib/search-suggestions.ts` | اقتراحات المشايخ |
| `lib/cms/sheikh-matcher.mjs` | registry-first matching |
| `lib/scholarly-intelligence/corpus-search.mjs` | registry fallback + autocomplete |
| `src/styles/design-system.css` | أنماط `.sheikh-*` |
| `package.json` | `verify:sheikh-recovery` |
| `.github/workflows/ci.yml` | guard في CI |

### جداول Supabase (بدون migration جديد)

- `sheikhs` — يُكمّل من السجل عند القراءة
- `lessons` — يُكمّل من catalog seed عبر `external_key`

---

## 6. التحقق

| الفحص | النتيجة |
|-------|---------|
| `pnpm --filter @workspace/majalis run typecheck` | ✅ |
| `pnpm run verify:sheikh-recovery` | ✅ 20/20 |
| `pnpm run build` | ✅ |
| Production HTTP `/lessons/sci-tawheed-saltaweel` | 200 (قبل merge PR — shell فقط) |
| Production HTTP `/sheikhs/salem-bin-saad-altaweel` | 200 (قبل merge PR — shell فقط) |

> **ملاحظة Production:** المحتوى الكامل (قائمة الدروس + ملف سالم) يظهر بعد **دمج هذا PR** في `main` ونشر Vercel. آلية الدمج الدائم للـ catalog تمنع تكرار الفقدان في أي تحديث مستقبلي حتى لو بقي Supabase ناقصاً.

---

## 7. منع فقدان البيانات مستقبلاً

1. **Catalog merge إلزامي** — لا يعتمد على `allowSeedFallback()`
2. **Registry merge للمشايخ** — يُكمّل DB دائماً
3. **CI regression guard** — `verify:sheikh-recovery`
4. **Automation registry** — كل شيخ له slug ومصادر؛ `sheikh-matcher` يطابق السجل أولاً
5. **Dedup بـ `external_key`** — إعادة الاستيراد تحدّث السجل ولا تنشئ تكراراً

---

## 8. الخطوة التالية

1. مراجعة ودمج PR في `main`
2. بعد النشر: التحقق من ظهور سالم في `/lessons` و`/sheikhs/salem-bin-saad-altaweel`
3. (اختياري) مزامنة صفوف `sheikhs` في Supabase من السجل عبر bootstrap script

---

*تم إعداد هذا التقرير آلياً ضمن عملية Emergency Scholar Recovery & Automation Integration.*
