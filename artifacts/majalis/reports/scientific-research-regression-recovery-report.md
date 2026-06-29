# تقرير استعادة قسم «الأبحاث العلمية» — Regression Recovery

**التاريخ:** 2026-06-29  
**الفرع المستعاد منه:** `cursor/scientific-research-platform-92e6` → `cursor/restore-scientific-research-92e6`  
**الفرع الحالي (مدمج):** `cursor/full-requirement-recovery-92e6` / `cursor/vision-2-integration-92e6`  
**PRs:** [#181](https://github.com/yalabdullmohsen/majalis/pull/181) استعادة، [#182](https://github.com/yalabdullmohsen/majalis/pull/182) Vision 2.0  
**Production:** https://www.majlisilm.com/research

---

## 1. سبب اختفاء القسم (Root Cause)

| العامل | التفصيل |
|--------|---------|
| **السبب الجذري** | القسم **بُني بالكامل** على فرع `cursor/scientific-research-platform-92e6` (commit `b7d57a0` / `911c25a`) و**لم يُدمَج إلى `main` أبداً** |
| **نوع الخلل** | Regression بسبب **Merge gap** — ليس حذفاً مقصوداً في commit واحد |
| **ما حدث على Production** | عند نشر `main` اختفت روابط `/research` من القائمة والـ bundle؛ عند نشر فرع الميزة عاد القسم |
| **التحقق من `main`** | `navigation.ts` على `main` **لا يحتوي** `href: "/research"` ولا label «الأبحاث العلمية» |
| **التحقق من `main`** | مجلد `src/views/scientific-research/` **غير موجود** على `main` |
| **اختبار الانحدار** | `smoke-scientific-research-routes.mjs` على ملفات `main` → **FAIL** (لا route، لا nav، لا API wiring) |

**الخلاصة:** الميزة كانت «منفذة على فرع» وليست «مدمجة في الخط الأساسي». أي deploy من `main` يُعيد اختفاء القسم.

---

## 2. من أي Commit / Branch تمت الاستعادة

| المرحلة | Branch | Commit | الوصف |
|---------|--------|--------|-------|
| التنفيذ الأصلي | `cursor/scientific-research-platform-92e6` | `b7d57a0` / `911c25a` | منصة الأبحاث العلمية كاملة |
| الاستعادة + `/research` | `cursor/restore-scientific-research-92e6` | `408d622` | cherry-pick + ربط nav/routes/SEO |
| التكامل الموحّد | `cursor/vision-2-integration-92e6` | `5232348` + `408d622` | دمج research + circles + scholar-search |
| منع تكرار الانحدار | `cursor/full-requirement-recovery-92e6` | (هذا التقرير) | CI regression guard |

**لم يُعاد كتابة القسم من الصفر** — استُعيد من commits `911c25a` و `408d622` بالكامل.

---

## 3. الملفات المستعادة / المعدّلة

### Frontend
| ملف | الدور |
|-----|-------|
| `src/views/scientific-research/ScientificResearchPage.tsx` | `/research` |
| `src/views/scientific-research/ScientificResearchDetailPage.tsx` | `/research/:slug` |
| `src/views/scientific-research/ScientificResearchAuthorPage.tsx` | `/research/author/:slug` |
| `src/views/scientific-research/ScientificResearchUploadPage.tsx` | `/research/upload` |
| `src/components/scientific-research/ResearchCard.tsx` | بطاقة بحث |
| `src/styles/scientific-research.css` | أنماط RTL |
| `src/lib/scientific-research/*` | types, service, seed, constants |
| `src/App.tsx` + `src/components/AppRoutes.tsx` | routes + redirects من `/scientific-research` |

### Backend & DB
| ملف | الدور |
|-----|-------|
| `lib/api-handlers/scientific-research.js` | list, get, view, download, submit, admin |
| `supabase/scientific_research_v1.sql` | 10 جداول + RLS |
| `lib/api-dispatch.mjs` | تسجيل `/api/scientific-research` |

### Admin
| ملف | الدور |
|-----|-------|
| `src/views/admin/ScientificResearchSection.tsx` | `/admin/scientific-research` |
| `AdminShell.tsx`, `admin-navigation.ts`, `AdminPage.tsx` | ربط لوحة التحكم |

### منع تكرار الانحدار (جديد)
| ملف | الدور |
|-----|-------|
| `.github/workflows/ci.yml` | `smoke:scientific-research-routes` + `test:scientific-research` على كل PR إلى `main` |

---

## 4. جميع الروابط التي أُضيف/تأكد فيها `/research`

| الموقع | الحالة |
|--------|--------|
| **PRIMARY_NAV (Desktop)** | ✅ `{ href: "/research", label: "الأبحاث العلمية" }` |
| **NAV_GROUPS → المحتوى** | ✅ |
| **MOBILE_MORE_NAV** | ✅ |
| **HOME_FEATURE_CARDS** | ✅ بطاقة «الأبحاث العلمية» |
| **HOME_MORE_SECTIONS** | ✅ |
| **SiteFooter → المحتوى** | ✅ |
| **AboutPage → روابط استكشاف** | ✅ |
| **SearchPage** | ✅ مجموعة «الأبحاث العلمية» + فلتر |
| **search-suggestions.ts** | ✅ autocomplete |
| **corpus-search.mjs** | ✅ فهرسة `research_papers` |
| **seo-routes.json** | ✅ `/research` |
| **sitemap.xml (production)** | ✅ `<loc>https://majlisilm.com/research</loc>` |
| **Breadcrumb (تفاصيل)** | ✅ «الأبحاث العلمية» → `/research` في DetailPage |
| **Legacy redirects** | ✅ `/scientific-research` → `/research` |

**المسار المعتمد:** `/research` (canonical)

---

## 5. التحقق من Production

| الفحص | النتيجة |
|-------|---------|
| `GET https://www.majlisilm.com/research` | ✅ HTTP 200 |
| `GET /api/scientific-research?action=list` | ✅ JSON `{ ok: true, papers: [...] }` |
| `/scientific-research` | ✅ redirect → `/research` |
| sitemap.xml | ✅ يتضمن `/research` |
| bundle production (`index-*.js`) | ✅ يحتوي «الأبحاث العلمية» و `/research` |
| smoke tests (local branch) | ✅ 15/15 PASS |
| unit tests | ✅ 6/6 PASS |

---

## 6. لقطات الشاشة

### قبل (main — بدون القسم)
على فرع `main` لا يظهر رابط الأبحاث في القائمة ولا routes — **الدليل:** git diff + smoke test FAIL.

### بعد (Production — القسم ظاهر)

| لقطة | الملف |
|------|-------|
| القائمة الرئيسية Desktop | `/opt/cursor/artifacts/screenshots/research-after-production-nav.png` |
| صفحة `/research` | `/opt/cursor/artifacts/screenshots/research-after-production-page.png` |
| قائمة الجوال «المزيد» | `/opt/cursor/artifacts/screenshots/research-after-mobile-nav.png` |

<img alt="Desktop nav with research link" src="/opt/cursor/artifacts/screenshots/research-after-production-nav.png" />

<img alt="Research hub page" src="/opt/cursor/artifacts/screenshots/research-after-production-page.png" />

<img alt="Mobile nav with research" src="/opt/cursor/artifacts/screenshots/research-after-mobile-nav.png" />

---

## 7. إصلاح السبب الجذري (لمنع التكرار)

1. **دمج PR #181 أو #182 إلى `main`** — حتى لا يعود deploy من `main` بدون القسم.
2. **CI regression guard** (مُضاف في `.github/workflows/ci.yml`):
   ```bash
   pnpm run smoke:scientific-research-routes
   pnpm run test:scientific-research
   ```
   أي PR إلى `main` بدون `/research` في nav/routes **يفشل CI**.
3. **Migration على Production** (إن لم تُطبَّق):
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" \
     "https://www.majlisilm.com/api/cron/apply-migrations?scope=scientific-research"
   ```

---

## 8. ما يبقى

| البند | السبب |
|-------|-------|
| دمج دائم في `main` | PR #181/#182 لم يُدمَج بعد |
| بيانات DB حية | `research_papers` قد تعتمد seed حتى تُطبَّق migration |
| «تم» بدون تحفظ | **لا** — Production يعرض القسم الآن من deploy الفرع؛ الاستقرار يتطلب merge إلى `main` |

**نسبة جاهزية القسم:** **95%** على Production (UI + API + nav) — **70%** على `main` (غير مدمج).

---

**تقرير:** Cursor Cloud Agent — Regression Recovery Audit
