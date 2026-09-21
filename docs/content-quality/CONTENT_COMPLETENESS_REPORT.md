# CONTENT_COMPLETENESS_REPORT — Wave 1 (P0 inventory)

**Base:** `origin/main` @ `4b7bb6944`  
**Branch:** `cursor/content-wave1-p0`  
**Product:** `artifacts/majalis` only  
**Machine inventory:** `reports/content-completeness-master.json`

## Coverage totals (from AppRoutes + sections.registry)

| Metric | Count |
|---|---|
| `path=` entries in AppRoutes | 364 |
| Approx real pages | 237 |
| Approx redirects (aliases) | 127 |
| Routes with final record | 364 |
| Sections in registry | 78 (76 live / 2 hidden) |
| Library catalog books | 190 |
| Library books with `external_url` | 18 |
| Library books without URL | 172 |

Aliases that only redirect (e.g. `/library`→`/search`, `/fiqh-council`→`/fiqh`) are recorded as `NOT_APPLICABLE` aliases — **not** independent content pages.

Every AppRoutes `path=` has a row in `routeInventory` with: route, section, feature, public, statuses, priority, finalEvidence, finalState.

## Wave 1 P0 public-exposure status

| Item | Final | Evidence |
|---|---|---|
| Live `/fiqh-council` product | **EXCLUDED** | Redirects in AppRoutes |
| Draft / pending_review in search cards | **PASS** | `SearchResultCards.tsx` returns null |
| RelatedRail / HomeLatestUpdates council hrefs | **PASS** | Filter regex |
| «قريبًا» stub dialog | **PASS** | `ComingSoonDialog` uses «قسم غير متاح» |
| Quran global ayah id as surah ayah | **PASS** | `ayah-ref-normalize` + gates |
| Library without provenance URL | **BLOCKED_SOURCE** | 172 books bibliographic; no invented URLs |
| Archived rulings pending_review | **EXCLUDED** | Unpublished inventory |
| Hosted fiqh_council SQL rows | **OWNER_ACTION** | Purge SQL requires approval |

## Section final states (Wave 1 — integrity pass)

See JSON `sectionsSummary` and full `routeInventory`. Full P1–P3 language/presentation polish is **not** claimed complete in Wave 1.

States used: `COMPLETE` | `IMPROVED` | `BLOCKED_SOURCE` | `BLOCKED_LICENSE` | `EXCLUDED` | `NOT_APPLICABLE`

## Classification rules (public content)

| Class | Public visibility |
|---|---|
| VERIFIED | May appear |
| NEEDS_REVIEW | Hidden / not published |
| UNSUPPORTED | Hidden |
| DRAFT | Hidden |
| EXCLUDED | Hidden / redirected |

## What Wave 1 does **not** claim

- 100% linguistic polish of every page  
- Filling 172 library URLs without publisher evidence  
- Hosted Supabase purge executed  
- Device/store readiness  
- Full Light/Dark visual matrix (Wave 7)

## Next waves

- **Wave 2:** Quran metadata presentation, lessons/scholars/series/search depth — **DONE** (see below)
- **Wave 3:** Aqeedah / Hadith / Seerah / History / sects presentation  
- **Wave 4:** Prayer / Adhkar / account copy  
- **Wave 5:** Remaining sections + Empty/Error  
- **Wave 6:** Admin governance + SEO generators  
- **Wave 7:** Full route validation matrix + FINAL report  

## Wave 2 (merged after Wave 1)

| Fix | Status |
|---|---|
| Harvest OCR/handles/`&nbsp;`/platform boilerplate stripped | IMPROVED |
| Corrupt harvest sheikh/place hidden | IMPROVED |
| RelatedRail scholar → `/scholars` or search (not broken `/tarikh-islami`) | IMPROVED |
| `SCHOLAR_PROFILES` indexed in unified search (+10 docs) | IMPROVED |
| SearchView fully hides blocked hrefs (no title leak) | IMPROVED |
| Surah name fallback via `getSurahMeta` | IMPROVED |
| Gate | `test:content-quality-wave2` |

## Wave 8 (continuation — lessons/scholars remaining)

| Fix | Status |
|---|---|
| Lesson descriptions strip phones/`@handles` | IMPROVED_VERIFIED |
| Harvest ellipsis-truncated titles dropped | IMPROVED_VERIFIED (feed data; short titles still rejected) |
| `/learn/series/:slug` keep slug → `/lessons/:slug` | IMPROVED_VERIFIED (Wave 8 remediation) |
| Annual course summary strip `**عن الدورة:**` fragments | IMPROVED_VERIFIED |
| Scholar/Quran-person SEO truncate at word | IMPROVED_VERIFIED |
| Scholar empty works/sources/faq sections hidden | IMPROVED_VERIFIED |
| Content report mailto subject without `#id` | IMPROVED_VERIFIED |
| Gate | `test:content-quality-wave8` |

See also: `docs/content-quality/CONTENT_GAPS_REPORT.md` (remaining matrix).

## Gate

`artifacts/majalis/src/lib/__tests__/content-quality-wave1-p0-gate.test.ts`  
`artifacts/majalis/src/lib/__tests__/content-quality-wave2-gate.test.ts`  
`artifacts/majalis/src/lib/__tests__/content-quality-wave8-gate.test.ts`


## Wave 9 (aqeedah / hadith / usul / sects)

| Fix | Status |
|---|---|
| Hadith by-id H1/SEO without raw corpus id | IMPROVED_VERIFIED |
| Hide opaque CDN book index in modal | IMPROVED_VERIFIED |
| Tawhid learning path → `/tawhid/ahl-sunnah` | IMPROVED_VERIFIED |
| Usul «القواعد الأصولية» → `/fiqh-qawaid` | IMPROVED_VERIFIED |
| Sects: تعريف/نشأة, empty state, Arabic review, related link, dark pills | IMPROVED_VERIFIED |
| Soften unsourced demographic % | IMPROVED_VERIFIED |
| Strip repeated tawhid filler tails | IMPROVED_VERIFIED |
| Gate | `test:content-quality-wave9` |


## Wave 10 (seerah / history / prophets / benefits)

| Fix | Status |
|---|---|
| Seerah `#phase` deep-link + element ids | IMPROVED_VERIFIED |
| Prophets: remove identical generic triad; keep Quran loci when known | IMPROVED_VERIFIED |
| Tarikh: drop overused «مفصلي» badge | IMPROVED_VERIFIED |
| Seerah dark event/timeline text | IMPROVED_VERIFIED |
| Gate | `test:content-quality-wave10` |

## Wave 11 (worship copy + author→scholar)

| Fix | Status |
|---|---|
| Adhkar SEO description truncates at word boundary | IMPROVED_VERIFIED |
| 9 author-aliases → `/scholars/:slug` (was `/search`) | IMPROVED_VERIFIED |
| `resolveAuthorScholarLink` ignores `/search` placeholders | IMPROVED_VERIFIED |
| Remaining aliases without scholar profile | BLOCKED_SOURCE (no invent) |
| Library books without URL | BLOCKED_SOURCE (unchanged) |
| Gate | `test:content-quality-wave11` |
