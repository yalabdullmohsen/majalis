# Vision 2.0 Integration Report

**Branch:** `cursor/vision-2-integration-92e6`  
**Date:** 2026-06-29  
**Status:** Integration phase complete — ready for Phase 2/3 planning

---

## 1. What Was Merged

| Source branch | Commit | Feature |
|---|---|---|
| `cursor/restore-scientific-research-92e6` | `408d622` | الأبحاث العلمية at `/research` |
| `cursor/quran-scientific-circles-92e6` | `457f39b` | الحلقات القرآنية والعلمية |
| `cursor/vision-2-phase1-scholar-search-92e6` | `92ea7de` | الباحث العلمي — corpus search + autocomplete |
| `main` (base) | `eac711a` | Scholarly Intelligence v1 engine |

All three Vision 2.0 feature branches are now combined on a single integration branch.

---

## 2. Unified Platform Wiring

### Search (الباحث العلمي)

- `/search` and `/scholar-search` — same unified search UI
- `unified-search.mjs` orchestrates: platform RPC, knowledge semantic, scholarly verification, bridge, **extended corpus**
- `corpus-search.mjs` indexes: Quran, tafsir, hadith, mutoon, sheikhs, mosques, **circles**, **research papers**, learning paths, sin-jeem
- Research papers now query `research_papers` table (with seed fallback)
- SearchPage merges research + circles into intelligent results
- `/api/search-autocomplete` registered in production `api-dispatch.mjs`

### Navigation & Routes

| Path | Desktop nav | Mobile | Footer | AppRoutes |
|---|---|---|---|---|
| `/research` | yes | yes | yes | yes |
| `/quran-scientific-circles` | yes | yes | yes | yes |
| `/scholar-search` | NAV_GROUPS | — | yes | yes |
| `/topics` | home + search | — | yes | yes |
| `/sheikhs/:id` | — | — | — | Next.js App Router |

### Smart Relations

`RelatedKnowledge` on: lessons, sheikhs, topics, fatwa, rulings, library, research, circles, fawaid.

---

## 3. Readiness for Phase 2 / Phase 3

Merge this integration PR to `main` before starting the next phase. Apply Supabase migrations on production after merge.
