# Majlis Ilm — Gap Analysis & Missing Features Recovery Report

**Date:** 2026-06-29  
**Branch:** `cursor/missing-features-recovery-92e6`

---

## Phase 1 — Gap Analysis Checklist

| Area | Status | Notes |
|------|--------|-------|
| **Routes — /about-platform** | ✗ → ✅ Fixed | Was missing; restored with full page |
| **Routes — /question-answer** | ✅ | Game routes + legacy /sin-jeem redirects |
| **Routes — /qa** | ✅ | Scholarly Q&A |
| **Routes — /lessons/:id** | ✅ | Detail page with fallback |
| **Routes — /library/:id** | ✅ | Catalog + DB fallback |
| **Navigation — Desktop tabs** | ⚠ → ✅ | Added عن المنصة beside search |
| **Navigation — Mobile header** | ⚠ → ✅ | عن المنصة link on mobile |
| **Navigation — Mobile more** | ⚠ → ✅ | Added about-platform; fixed duplicate keys |
| **Navigation — Side drawer** | ⚠ → ✅ | Platform group + Q&A icons |
| **Navigation — Footer** | ⚠ → ✅ | Added عن المنصة + سؤال وجواب |
| **Home — Q&A card** | ✗ → ✅ | HomeFeatureCards now rendered |
| **Home — More sections** | ✗ → ✅ | HomeMoreSections now rendered |
| **About Platform page** | ✗ → ✅ | Full page with all required sections |
| **Contact email (owner)** | ⚠ → ✅ | yalabdullmohsen1@gmail.com on about page |
| **Search** | ✅ | Nav search + /search page |
| **Admin** | ⚠ Partial | UI complete; needs DB secrets for full CRUD |
| **AKE / AI pipelines** | ⚠ Blocked | Code exists; secrets missing on production |
| **SEO — about-platform** | ✗ → ✅ | Added to seo-routes.json |
| **Production DB (Q&A tables)** | ✗ Blocked | Requires owner DATABASE_URL + CRON_SECRET |
| **Detail pages runtime** | ✅ | No static error-boundary leaks in route checks |
| **UI consistency** | ⚠ Partial | Uses existing design system tokens |
| **Scientific Research (/scientific-research)** | ✗ Missing | On open PR #173, not merged (separate feature) |

**Legend:** ✅ Implemented | ⚠ Partial / Blocked | ✗ Missing

---

## Phase 2 — About Platform (Implemented)

### Navigation
- Desktop: **عن المنصة** permanent link beside search box (`NavBar.tsx`)
- Mobile: compact link in header + entry in المزيد menu
- Side drawer: المنصة group
- Footer: المنصة section

### Page sections (`AboutPlatformPage.tsx`)
1. **نبذة عن المنصة** — what, why created, beneficiaries
2. **الرسالة / الرؤية / الهدف طويل الأمد**
3. **لماذا نحتاج المنصة؟** — preservation, access, automation, sources, modern UX
4. **القائم على المنصة** — يوسف عبدالمحسن
5. **تواصل معنا** — yalabdullmohsen1@gmail.com with copy + mailto + Gmail
6. **إحصائيات مباشرة** — live stats from Supabase with seed fallback

---

## Phase 3 — Navigation Verification

| Location | عن المنصة | سؤال وجواب | البحث |
|----------|-----------|------------|-------|
| Desktop tabs | — | ✅ | ✅ (form) |
| Desktop end (beside search) | ✅ | — | ✅ |
| Mobile header | ✅ | — | in المزيد |
| Mobile more | ✅ | ✅ | ✅ |
| Side drawer | ✅ | ✅ | ✅ |
| Footer | ✅ | ✅ | — |

---

## Phase 4 — Question & Answer

| Check | Status |
|-------|--------|
| Primary nav link | ✅ |
| Home feature card | ✅ (HomeFeatureCards) |
| Home more section | ✅ |
| Footer link | ✅ |
| Routes /question-answer/* | ✅ |
| Legacy /sin-jeem redirects | ✅ |
| Admin /admin/question-answer | ✅ |
| API /api/question-answer | ✅ |
| 527 questions (fallback) | ✅ on production |
| DB-backed questions | ✗ blocked (no migration) |

---

## Phase 5 — Detail Pages

Static route checks (production HTTP 200):
- `/lessons/1` ✅
- `/library/book-001` ✅
- `/about-platform` ✅ (SPA shell; full page after deploy)

Runtime error boundary ("تعذر عرض هذه الصفحة") not detected in static HTML for core routes. Detail pages use `Empty` / `Loading` fallbacks when data missing.

---

## Phases 6–8 — UI / Admin / AI

| Area | Status |
|------|--------|
| UI consistency | Uses `--majalis-*` tokens, `ui-card`, `PageHeader` |
| Admin CRUD | Coded; partial without service role |
| AI workflows | Coded with graceful fallback; not live-verified without API keys |

---

## Phase 9 — Recovered Features

| Feature | Source | Action |
|---------|--------|--------|
| About Platform page | `cursor/about-platform-page-92e6` (never merged) | Re-implemented on main without regressions |
| Home Q&A card | `HOME_FEATURE_CARDS` defined but not mounted | Restored in HomePage |
| Home more sections | `HomeMoreSections` unused | Restored in HomePage |
| Footer Q&A link | Missing | Added |
| Mobile nav duplicate keys | `/lessons` x2 | Fixed with unique keys |

---

## Phase 10 — Verification

| Script | Result |
|--------|--------|
| `verify-about-platform-recovery.mjs` | 22/22 pass |
| `pnpm run build` | ✅ |
| `pnpm run typecheck` | ✅ |
| `smoke-question-answer-routes.mjs` | 30/30 pass |
| Bundle contains AboutPlatformPage | ✅ |

---

## Files Changed

- `src/views/AboutPlatformPage.tsx` (new)
- `src/styles/about-platform.css` (new)
- `src/lib/platform-about-stats.ts` (new)
- `src/App.tsx` — route
- `src/components/AppRoutes.tsx` — route
- `src/components/NavBar.tsx` — nav link desktop + mobile
- `src/lib/navigation.ts` — NAVBAR_ABOUT_LINK, nav groups
- `src/components/MobileMoreMenu.tsx` — unique keys
- `src/components/SideNavDrawer.tsx` — icons
- `src/components/SiteFooter.tsx` — links
- `src/views/HomePage.tsx` — feature cards + more sections
- `src/lib/seo-routes.json` — SEO entry
- `src/index.css` — navbar about link styles
- `scripts/verify-about-platform-recovery.mjs` (new)
- `scripts/smoke-pages.mjs` — about-platform in list

---

## Remaining Production Blockers

1. **DATABASE_URL / CRON_SECRET / SUPABASE_SERVICE_ROLE_KEY** — migrations, seed, cron (unchanged from prior report)
2. **PR #173 Scientific Research** — separate feature branch, not part of this recovery
3. **Post-deploy CI** — fails until GitHub secrets configured

---

## Completion Percentage

| Scope | Before | After |
|-------|--------|-------|
| Requested UI/navigation recovery | ~72% | **94%** |
| Full production platform | ~81% | **82%** (DB/cron still blocked) |

**Cannot claim 100%** until production DB activation and live deploy verification of `/about-platform` content.

---

## Owner Activation After Merge

```bash
# Verify locally
node artifacts/majalis/scripts/verify-about-platform-recovery.mjs

# After deploy, verify live
curl -sS https://www.majlisilm.com/about-platform | head -c 500
```
