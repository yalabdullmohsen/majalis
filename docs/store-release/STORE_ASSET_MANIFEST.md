# Store Asset Manifest — سُنّة 1.0.0

**STORE_SOURCE_COMMIT:** `ed5320b1f23c7b21d230c0698e86ce5cb8731ebc`  
**Sources:** `LICENSE_RISKS.md`, `docs/LICENSES.md`, `CREDITS.md`, `LAUNCH_CANDIDATE_REPORT.md`, tree under `artifacts/majalis`  
**Rule:** `MISSING_EVIDENCE` must not enter Store binary. UI alone is not isolation.

Machine-readable companion: `excluded-asset-globs.json` · Gate: `pnpm run verify:store-assets`

| Asset | Path / source | In binary? | Delivery | Rights holder | License | Evidence | Commercial? | Redistribute in app? | Attribution? | Decision | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| QPC V2 fonts | QPC / CDN / mushaf assets | Yes (reader) | Bundled glyphs | KFGQPC/QUL | Unclear for store redistribute | LICENSE_RISKS | Unknown | Needs written OK | Usually yes | **OWNER_APPROVED pending** | Owner written approval or hold store |
| QCF_BSML | Not shipped | No | N/A | KFGQPC | N/A | SVG ornament workaround | N/A | N/A | N/A | **EXCLUDED** | Keep omitted |
| Madinah page images 604 | Not in repo | No | N/A | — | None | LICENSE_RISKS | No | No | — | **EXCLUDED** | Keep disabled |
| Audio tafsir catalog | Empty by design | No | N/A | — | — | LICENSE_RISKS | — | — | — | **EXCLUDED** | Keep empty |
| `public/sounds/adhan/*` | `artifacts/majalis/public/sounds/adhan/` | Would copy via `public/`→dist | Bundled | Unverified | Unresolved | LICENSE_RISKS | Unknown | Unknown | Unknown | **MISSING_EVIDENCE** | Strip from store dist |
| `public/audio/adhan/*` | `artifacts/majalis/public/audio/adhan/` | Would copy | Bundled / preview | Mixed / mohsalvi | Unresolved | SOURCES.md | Unknown | Unknown | Partial | **MISSING_EVIDENCE** | Strip from store dist |
| iOS `Sounds/adhan-*.caf` | `ios/App/App/Sounds/` | Yes in Xcode resources | Bundled notif | Unverified | Unresolved | Sounds/README | Unknown | Unknown | Unknown | **MISSING_EVIDENCE** | Exclude from store archive until approved |
| iOS seq CAF `adhan-seq-makkah-*.caf` | `ios/App/App/` | Yes | Bundled | Unverified | Unresolved | Tree | Unknown | Unknown | Unknown | **MISSING_EVIDENCE** | Exclude from store archive |
| Short system-like CAF (`prayer-alert`, rings) | `ios/App/App/Sounds/` | Yes | Bundled notif | Unverified / synthetic | Unclear | Tree | Unknown | Unknown | Unknown | **MISSING_EVIDENCE** (provisional allowlist for gate only) | Prefer OS default until owner OK |
| mohsalvi/adhan-audio | jsDelivr CDN | No if stream-only | Stream | mohsalvi + performers | Unclear | CREDITS / LICENSE_RISKS | Unknown | No packaging | Style-only | **STREAM_ONLY** | No offline package; no famous-name claim |
| everyayah | Remote URLs | No | Stream | EveryAyah | ToS unsigned | LICENSE_RISKS | Unknown | No bundle | Required | **STREAM_ONLY** | Live only + attribution |
| mp3quran | Remote URLs | No | Stream | mp3quran | ToS unsigned | LICENSE_RISKS | Unknown | No bundle | Required | **STREAM_ONLY** | Live only + attribution |
| Quran.com API | Remote | No | Stream/API | Quran.com | API terms | LICENSE_RISKS | Partial | No offline dump | Required | **STREAM_ONLY** | Live + `/sources` |
| AlQuran Cloud | Remote | No | Stream/API | Editions | Edition terms | LICENSE_RISKS | Partial | No offline dump | Required | **STREAM_ONLY** | Live + attribution |
| Library books ~173 | Catalog / links | Metadata may ship | Link / download | Many publishers | Mixed | LICENSE_RISKS | Mixed | Mixed | Mixed | **MISSING_EVIDENCE** (many) | Store UI: verified-only / empty (later PR) |
| Hisn al-Muslim texts | App content | Possible | Bundled text | Compiler rights | Unclear | LICENSE_RISKS | Unknown | Needs OK | Likely | **OWNER_APPROVED pending** | Owner edition OK or replace |
| App icons / splash / brand SVG | Capacitor assets | Yes | Bundled | Sunnah product | Product | Tree | Yes (own) | Yes | N/A | **VERIFIED** (product-owned) | Keep |
| System notification sound (no file) | OS | No app file | OS default | Apple/Google | Platform | — | Yes | N/A | N/A | **VERIFIED** | Default store prayer alert |

## Catalog UI policy (store)

Only voices with store decision **VERIFIED** or **OWNER_APPROVED** (with written proof on file) may appear as selectable.  
Default: **صوت النظام الافتراضي** (`system-default`).

`style_only_preview` and `pending_owner_approval` are **not** store-selectable.
