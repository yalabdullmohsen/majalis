# SHARIA_SOURCE_REVIEW — Wave 1

**Rule:** No invented sharia content. This file lists **status only** — no long copyrighted text copies.

| Material / surface | Status | Existing source | Block reason | Required action |
|---|---|---|---|---|
| Live fiqh-council product UI | EXCLUDED | Redirects to `/fiqh` | Product removed | Keep redirects; owner hosted purge |
| Search draft/pending items | EXCLUDED from public | SearchResultCards filter | Governance | Keep filter + tests |
| Library books with URL (18) | VERIFIED (link-out) | `external_url` in catalog | — | Maintain links |
| Library books without URL (172) | NEEDS_REVIEW / bibliographic | Author+title only | No publisher URL evidence | Owner supply URLs or keep bibliographic note |
| Archived rulings 119 pending_review | DRAFT unpublished | Inventory reports | Not public | Do not publish without review |
| `deferred-nawazil.json` | EXCLUDED internal | content/fiqh | Internal | Keep off public routes |
| Hadith verified packs | VERIFIED where packs exist | `public/data/hadith-verified` | Truncated salutation fixed in r7 | Continue gates |
| Quran text / QPC pages | VERIFIED immutable | QPC assets | Must not edit | Mushaf gates |
| IIFA / majma citations inside scholarly essays | VERIFIED as citation (not product) | Page sources | Not fiqh-council product | Do not mass-delete word «مجمع» |
| LICENSE_RISKS adhan/QPC/books | BLOCKED_LICENSE for store | LICENSE_RISKS.md | Store redistribute | Owner decisions |

**Wave 1 action (2026-09-18 reinforce):** Byte-lock محمي لـ manifest/pages-manifest/basmala؛ قائمة الحديث العامة ترشّح `isHadithComplete`؛ البحث يخفي partial/NEEDS_SCHOLAR_REVIEW؛ طابور `SCHOLAR_REVIEW_QUEUE.md`. لا اختراع أحكام أو روابط مكتبة.

**Wave 1 action (prior):** Document + gate public exposure. No new rulings, bios, or book URLs invented.

**Wave 2 action:** Sanitize harvest display; scholar rail → `/scholars`; index `SCHOLAR_PROFILES` in search; hide blocked search titles. No invented scholar bios or harvest titles.

**Wave 8 action:** Strip lesson contact noise (data + detail display); drop ellipsis-truncated harvest cards from feed; clean annual-course summary fragments; SEO word-boundary truncate; hide empty scholar sections; report mailto without public `#id`. Locale/ErrorBoundary microcopy tightened for entry gzip headroom. No invented content. `/learn/series/:slug` slug-preserving redirect deferred (entry budget).



**Wave 9 action:** Presentation/navigation/copy only for aqeedah, hadith, usul, sects. No new rulings or demographic inventions; unsourced % softened. Blocked book stubs remain disabled.

**Wave 10 action:** Seerah deep-links, prophets presentation (no invented triad content), tarikh badge noise, seerah dark readability. No invented dates/events.

**Wave 11 action:** Adhkar SEO word-boundary truncate; map 9 author-aliases with existing `SCHOLAR_PROFILES` to `/scholars/:slug`; drop `/search` as fake author href. No new scholar bios or library URLs.
