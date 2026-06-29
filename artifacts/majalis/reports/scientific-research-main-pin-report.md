# تقرير تثبيت قسم الأبحاث العلمية في main

**التاريخ:** 2026-06-26  
**Commit على main:** `c2fe89e`  
**PR المدمج:** [#181 — fix: استعادة قسم الأبحاث العلمية على /research](https://github.com/yalabdullmohsen/majalis/pull/181)

---

## 1. اختيار PR

| PR | المحتوى | القرار |
|----|---------|--------|
| **#181** | استعادة `/research` + redirects + nav/footer/search/sitemap | **✅ مُدمج** |
| #182 | Vision 2.0 (circles + scholar-search + research) | ❌ مُغلق — مكرر |
| #183 | Full recovery (contact/about + vision 2 + research) | ❌ مُغلق — مكرر |

### لماذا #181؟

- **الأكثر تركيزاً** على استعادة الأبحاث العلمية دون مزايا إضافية (contact, vision 2, UI redesign)
- يحتوي على **جميع** عناصر checklist الاستعادة
- #183 كان أوسع لكنه يضيف ميزات خارج نطاق «تثبيت فقط»
- #182 يضيف حلقات قرآنية وباحث علمي — خارج النطاق

**ملاحظة:** main كان يحتوي مسبقاً على ملفات الأبحاث عند `/scientific-research` فقط (بدون `/research`). PR #181 يثبت المسار الصحيح `/research` + redirects.

---

## 2. checklist الاستعادة — بعد الدمج

| العنصر | الحالة |
|--------|--------|
| Route `/research` | ✅ |
| Redirect `/scientific-research` → `/research` | ✅ |
| صفحة الأبحاث + تفاصيل + مؤلف + رفع | ✅ |
| Admin `/admin/scientific-research` | ✅ |
| API `/api/scientific-research` | ✅ |
| Navigation (PRIMARY_NAV) | ✅ |
| Mobile Navigation (MOBILE_MORE_NAV) | ✅ |
| Footer | ✅ |
| Home (HOME_FEATURE_CARDS / MORE) | ✅ |
| Search suggestions | ✅ |
| Sitemap `/research` | ✅ |
| SEO routes + prerender | ✅ |
| smoke test | ✅ 20/20 |
| unit test | ✅ 6/6 |
| CI regression guard | ✅ |

---

## 3. نتائج الاختبارات (قبل push)

```
pnpm run smoke:scientific-research-routes  → 20 PASS, 0 FAIL
pnpm run test:scientific-research         → 6 passed, 0 failed
pnpm --filter @workspace/majalis run build    → ✅
pnpm --filter @workspace/majalis run typecheck → ✅
pnpm --filter @workspace/majalis run lint      → ✅ (warnings only)
```

---

## 4. Regression Guard

**`.github/workflows/ci.yml`** — خطوة جديدة:

```yaml
- name: Scientific research regression guard
  run: |
    cd artifacts/majalis
    pnpm run smoke:scientific-research-routes
    pnpm run test:scientific-research
```

**`smoke-scientific-research-routes.mjs`** يفحص:
- `/research` routes + legacy redirects
- Nav + Mobile nav + Footer
- Admin section
- Search suggestions
- Sitemap entry
- API dispatch + SQL schema

أي PR إلى main **يفشل CI** إذا اختفى أي من هذه العناصر.

---

## 5. مصير PRs الأخرى

| PR | الإجراء |
|----|---------|
| #181 | مُدمج في main (`c2fe89e`) |
| #182 | يُغلق — الاستعادة ثبتت في #181 |
| #183 | يُغلق — الاستعادة ثبتت في #181 |

---

## 6. Production

| URL | المتوقع |
|-----|---------|
| https://www.majlisilm.com/research | 200 — صفحة الأبحاث |
| https://www.majlisilm.com/scientific-research | redirect → `/research` |
| https://www.majlisilm.com/admin/scientific-research | admin panel |
| `/api/scientific-research?action=list` | JSON list |
| sitemap.xml | يحتوي `https://majlisilm.com/research` |

---

## 7. إثبات التثبيت في main

```bash
git show main:artifacts/majalis/src/App.tsx | rg 'path="/research"'
git show main:artifacts/majalis/scripts/smoke-scientific-research-routes.mjs
git show main:.github/workflows/ci.yml | rg "scientific-research"
```

**أي Deploy من main** يتضمن الآن `/research` + CI guard — لن يختفي القسم مع deploys مستقبلية.
