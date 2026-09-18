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
| aqidah/hadith/sects | various | IMPROVED_VERIFIED | Wave9 presentation | done | P1 | wave9-gate |
| seerah/history | various | COMPLETE claim | presentation polish | Wave 10 | P1 | pending |
| prayer/adhkar copy | various | COMPLETE claim | copy polish | Wave 11 | P2 | pending |
| search/SEO regen | — | IMPROVED | mid-word SEO clamp | truncateAtWord-style clamp | P2 | wave12-gate |
| admin governance | `/admin` | IMPROVED | field gates | Wave 14 | P1 | pending |
| home empty/widgets | `/` | IMPROVED | weak empty copy | unify EMPTY.data | P2 | wave12-gate |

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


## Wave 9 final states (PR #2086)

| section | finalState |
|---|---|
| hadith by-id public title | IMPROVED_VERIFIED |
| hadith modal book index | IMPROVED_VERIFIED |
| tawhid path card | IMPROVED_VERIFIED |
| fiqh usul → qawaid | IMPROVED_VERIFIED |
| islamic-sects structure/empty/dark/review | IMPROVED_VERIFIED |
| tawhid filler tails | IMPROVED_VERIFIED |
| umda/bulugh stubs | BLOCKED_SOURCE |


## Wave 10 final states

| section | finalState |
|---|---|
| seerah deep-links | IMPROVED_VERIFIED |
| prophets generic sections | IMPROVED_VERIFIED |
| tarikh featured badge noise | IMPROVED_VERIFIED |
| seerah dark text | IMPROVED_VERIFIED |
| fawaid template clusters | IMPROVED_VERIFIED (collapsed permutations + strip tails) |
| author-aliases → scholars | IMPROVED_VERIFIED (9 profiles; rest BLOCKED_SOURCE) |


## Wave 11 final states

| section | finalState |
|---|---|
| adhkar SEO truncateAtWord | IMPROVED_VERIFIED |
| author-aliases (9 profiles) → `/scholars` | IMPROVED_VERIFIED |
| remaining aliases without profile | BLOCKED_SOURCE (stay unlinked; no `/search` fake) |
| fawaid template clusters | IMPROVED_VERIFIED |
| library URLs | BLOCKED_SOURCE |


## Wave 12 final states

| section | finalState |
|---|---|
| SEO meta clamp word-boundary | IMPROVED_VERIFIED |
| home widget empty copy | IMPROVED_VERIFIED |
| home start-here lead clarity | IMPROVED_VERIFIED |
| library URLs | BLOCKED_SOURCE |
| author aliases without profile | BLOCKED_SOURCE |
| hosted fiqh_council purge | OWNER_ACTION |

## Wave 13 final states

| section | finalState |
|---|---|
| vault/knowledge/seerah/asmaa/akhlaq empties | IMPROVED_VERIFIED (EMPTY.*) |
| sects/tarikh/topics/universities/landmarks | IMPROVED_VERIFIED |
| occasions/qa/stories empties | IMPROVED_VERIFIED |
| ui-copy entry budget (SECTION_LEAD→fiqh module) | IMPROVED_VERIFIED |
| library URLs | BLOCKED_SOURCE |
| author aliases without profile | BLOCKED_SOURCE |
| hosted fiqh_council purge | OWNER_ACTION |
| critical CSS 60KiB leftover dist | Class C — clean dist before verify |

## Wave 14 final states

| section | finalState |
|---|---|
| hikam/prophets/sahabah/fadail/sunan empties | IMPROVED_VERIFIED |
| mutashabihat/nations/sins/miracles | IMPROVED_VERIFIED |
| updates/arbaeen/discover-islam/vault notes | IMPROVED_VERIFIED |
| library URLs | BLOCKED_SOURCE |
| hosted fiqh_council purge | OWNER_ACTION |

## Wave 15 final states

| section | finalState |
|---|---|
| academic research demo badge/filter | IMPROVED_VERIFIED |
| citations/mindmap/learning-paths empties | IMPROVED_VERIFIED |
| library URLs | BLOCKED_SOURCE |
| hosted fiqh_council purge | OWNER_ACTION |

## Wave 16 final states

| section | finalState |
|---|---|
| knowledge-graph / my-submissions empties | IMPROVED_VERIFIED |
| library URLs | BLOCKED_SOURCE |
| hosted fiqh_council purge | OWNER_ACTION |
| admin empties | DEFERRED (out of public scope) |

## Wave 17 final states

| section | finalState |
|---|---|
| adhkar/duas/tafsir/fawaid empties | IMPROVED_VERIFIED |
| duas-quran/hadith-science/glossary | IMPROVED_VERIFIED |
| teacher/reading-plans/arbaeen-nawawi | IMPROVED_VERIFIED |
| library URLs | BLOCKED_SOURCE |
| admin empties | DEFERRED |

## Wave 18 final states

| section | finalState |
|---|---|
| quran circles/index/people/numbers/makki/search | IMPROVED_VERIFIED |
| lessons/rulings/qawaid/hadith/search/notifications | IMPROVED_VERIFIED |
| adhkar loadError → STATUS | IMPROVED_VERIFIED |
| library URLs | BLOCKED_SOURCE |
| admin empties | DEFERRED |

## Wave 19 final states

| section | finalState |
|---|---|
| discover-islam / new-muslim / sins detail not-found | IMPROVED_VERIFIED |
| auto-content / annual-course / path loadError | IMPROVED_VERIFIED |
| library URLs | BLOCKED_SOURCE |
| admin empties | DEFERRED |
