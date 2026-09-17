# CONTENT_COMPLETENESS — remaining gap matrix (post Wave1–2)

**Base main:** `b633b6cd1`  
**Product:** `artifacts/majalis`

## Already COMPLETE / IMPROVED (do not re-do)

| Section | Status | Evidence |
|---|---|---|
| fiqh-council public | EXCLUDED | redirects + gates |
| Search draft/pending | IMPROVED_VERIFIED | SearchResultCards + SearchView |
| Harvest OCR handles (Wave2) | IMPROVED_VERIFIED | harvest-display-text |
| Scholars in search | IMPROVED_VERIFIED | generate-unified-search-index |
| RelatedRail scholars | IMPROVED_VERIFIED | `/scholars/:slug` |
| Ayah normalize | COMPLETE_VERIFIED | ayah-ref-normalize |
| Mushaf QPC text | NOT_APPLICABLE | protected |

## Remaining (Wave 8+)

| section | route | previousStatus | remainingGap | action | priority | acceptanceTest |
|---|---|---|---|---|---|---|
| lessons | `/lessons` | IMPROVED | phones/handles in descriptions | strip via cleanLessonPublicText | P0 | wave8-gate |
| harvest | `/lessons` feed | IMPROVED | ellipsis mid-title cards | drop truncated | P0 | wave8-gate |
| series deep links | `/learn/series/:slug` | REGRESSION-context | slug lost on redirect | **DEFERRED** — entry budget; stays `/lessons` | P1 | documented |
| annual courses | `/annual-courses/:id` | IMPROVED | garbled `**عن الدورة:**` summaries | cleanAnnualCourseSummary | P1 | wave8-gate |
| scholars | `/scholars/:slug` | IMPROVED | SEO mid-word cut; empty section heads | truncateAtWord + guards | P1 | wave8-gate |
| quran people | `/quran/people/:slug` | IMPROVED | SEO mid-word cut | truncateAtWord | P1 | wave8-gate |
| report button | lesson detail | IMPROVED | `#id` in mailto subject | title-only subject | P1 | wave8-gate |
| library | `/search` | BLOCKED_SOURCE | 172 books no URL | OWNER — no invent | P0 | documented |
| fiqh_council SQL | hosted | EXCLUDED | purge not run | OWNER_ACTION | P0 | documented |
| aqidah/hadith/sects | various | COMPLETE claim | presentation polish | Wave 9 | P1 | pending |
| seerah/history | various | COMPLETE claim | presentation polish | Wave 10 | P1 | pending |
| prayer/adhkar copy | various | COMPLETE claim | copy polish | Wave 11 | P2 | pending |
| search/SEO regen | — | IMPROVED | deeper SEO | Wave 13 | P2 | pending |
| admin governance | `/admin` | IMPROVED | field gates | Wave 14 | P1 | pending |

## Wave 8 final states (this PR)

| section | finalState |
|---|---|
| lessons contact display | IMPROVED_VERIFIED (data scrub + detail `cleanLessonPublicText`) |
| harvest truncated cards | IMPROVED_VERIFIED (runtime sanitize drops `…` titles; feed.json schema kept ≥1) |
| learn series redirects | DEFERRED (entry budget; `/learn/series/:slug` → `/lessons`) |
| annual course summaries | IMPROVED_VERIFIED |
| scholars SEO/empty | IMPROVED_VERIFIED |
| quran people SEO | IMPROVED_VERIFIED |
| report mailto subject | IMPROVED_VERIFIED (no `#id`) |
| library URLs | BLOCKED_SOURCE (unchanged) |
| entry budget headroom | IMPROVED_VERIFIED (locale/ErrorBoundary copy tightened) |
