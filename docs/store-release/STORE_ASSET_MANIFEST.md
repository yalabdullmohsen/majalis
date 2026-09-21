# Store Asset Manifest — سُنّة 1.0.0

**Historical STORE_SOURCE_COMMIT file:** see `STORE_SOURCE_COMMIT.txt` (pin for Archive only — **not** live web tip).  
**Live web tip (truth sync):** see `docs/release/CURRENT_RELEASE_TRUTH.md`  
**Sources:** `LICENSE_RISKS.md`, `docs/LICENSES.md`, `CREDITS.md`, `prayer-audio-rights-registry.ts`, tree under `artifacts/majalis`  
**Rule:** `MISSING_EVIDENCE` / `rights_uncertain` / `rejected` must not enter Store binary. UI alone is not isolation.  
**Gate:** `pnpm run verify:store-assets` · `pnpm --filter @workspace/majalis run test:prayer-audio-rights` (includes store-release-assets-gate)

Machine-readable companion: `excluded-asset-globs.json`

| Asset | Path / source | In git tree? | Delivery | Rights holder | License | Evidence | Commercial? | Redistribute in app? | Attribution? | Decision | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| QPC V2 fonts | QPC / CDN / mushaf assets | Yes (reader) | Bundled glyphs (web); **stripped from store dist** | KFGQPC/QUL | Unclear for store redistribute | LICENSE_RISKS · `store-strip` · `native-strip-qpc-fonts.mjs` | Unknown | Needs written OK | Usually yes | **OWNER_APPROVED pending / BLOCKED_LICENSE store** | Owner written approval or keep strip |
| QCF_BSML | Not shipped | No | N/A | KFGQPC | N/A | SVG ornament workaround | N/A | N/A | N/A | **EXCLUDED** | Keep omitted |
| Madinah page images 604 | Not in repo | No | N/A | — | None | LICENSE_RISKS | No | No | — | **EXCLUDED** | Keep disabled |
| Audio tafsir catalog | Empty by design | No | N/A | — | — | LICENSE_RISKS | — | — | — | **EXCLUDED** | Keep empty |
| Web adhan `field` | `public/audio/adhan/adhan-field.m4a` (+ short) | Yes | Web preview / in-app | Wikimedia Commons | **CC0-1.0** | File:Adhan.ogg + rights registry | Yes | Yes (CC0) | Optional thanks | **VERIFIED (web production)** | Keep on web; **still stripped from Store RC dist** until OWNER allowlists store binary |
| Web adhan `field-full` | `public/audio/adhan/adhan-field-full.m4a` | Yes | Web preview / in-app | Wikimedia Commons | **CC0-1.0** | File:Beautiful_adhan.ogg | Yes | Yes (CC0) | Optional thanks | **VERIFIED (web production)** | same — store strip until OWNER allowlist |
| iOS CAF `adhan-short-field*.caf` | `ios/App/App/Sounds/` | Yes | Notif short | Wikimedia (derived) | CC0-1.0 | afconvert 10s IMA4 | Yes | Yes (CC0) | Optional | **VERIFIED (web/native tree)** | Store Archive: OWNER exclude-or-allowlist |
| Internal style packs (makkah/egypt/aqsa/kuwait/…) | `public/audio/adhan/*` | Yes | Web preview | Sunnah internal / mixed CDN history | internal-app-asset | rights registry | App-only | Bundle OK for web | No celebrity names | **VERIFIED (web production UI)** | Store RC still strips entire `public/audio/adhan` until OWNER pin |
| `madinah` adhan id | removed from public bundle | No file | None | Uncertain CDN | rights_uncertain | registry | No | No | — | **EXCLUDED** | Stay `approvedForProduction: false` |
| `qatami` adhan id | removed from public bundle | No file | None | Celebrity risk | rejected | registry | No | No | — | **EXCLUDED** | Stay rejected / UI blocked |
| `public/sounds/adhan/*` | legacy path | Maybe | Bundled if present | Unverified | Unresolved | LICENSE_RISKS | Unknown | Unknown | Unknown | **MISSING_EVIDENCE** | Strip from store dist |
| iOS `Sounds/adhan-*.caf` (non-CC0 / unresolved) | `ios/App/App/Sounds/` | Yes | Bundled notif | Mixed | Unresolved / internal | Sounds/README | Unknown | Unknown | Unknown | **MISSING_EVIDENCE** (except documented CC0 shorts above) | Exclude from store archive until approved |
| iOS seq CAF `adhan-seq-makkah-*.caf` | `ios/App/App/` | Yes | Bundled | Unverified | Unresolved | Tree | Unknown | Unknown | Unknown | **MISSING_EVIDENCE** | Exclude from store archive |
| Short system-like CAF (`prayer-alert`, rings) | `ios/App/App/Sounds/` | Yes | Bundled notif | Unverified / synthetic | Unclear | Tree | Unknown | Unknown | Unknown | **MISSING_EVIDENCE** (provisional allowlist for gate only) | Prefer OS default until owner OK |
| mohsalvi/adhan-audio | jsDelivr CDN | No if stream-only | Stream | mohsalvi + performers | Unclear | CREDITS / LICENSE_RISKS | Unknown | No packaging | Style-only | **STREAM_ONLY** | No offline package; no famous-name claim |
| everyayah | Remote URLs | No | Stream | EveryAyah | ToS unsigned | LICENSE_RISKS | Unknown | No bundle | Required | **STREAM_ONLY** | Live only + attribution |
| mp3quran | Remote URLs | No | Stream | mp3quran | ToS unsigned | LICENSE_RISKS | Unknown | No bundle | Required | **STREAM_ONLY** | Live only + attribution |
| Quran.com API | Remote | No | Stream/API | Quran.com | API terms | LICENSE_RISKS | Partial | No offline dump | Required | **STREAM_ONLY** | Live + `/sources` |
| AlQuran Cloud | Remote | No | Stream/API | Editions | Edition terms | LICENSE_RISKS | Partial | No offline dump | Required | **STREAM_ONLY** | Live + attribution |
| Library books ~172 missing source | Catalog | Metadata may ship | Link / download | Many publishers | Mixed | library audit | Mixed | Mixed | Mixed | **MISSING_EVIDENCE** (many) | Public UI: verified-only (Remediation PR-3) |
| Hisn al-Muslim texts | App content | Possible | Bundled text | Compiler rights | Unclear | LICENSE_RISKS | Unknown | Needs OK | Likely | **OWNER_APPROVED pending** | Owner edition OK or replace |
| App icons / splash / brand SVG | Capacitor assets | Yes | Bundled | Sunnah product | Product | Tree | Yes (own) | Yes | N/A | **VERIFIED** (product-owned) | Keep |
| System notification sound (no file) | OS | No app file | OS default | Apple/Google | Platform | — | Yes | N/A | N/A | **VERIFIED** | Default store prayer alert |

## Catalog UI policy

### Web production (`adhan-settings-sound-catalog`)

Only ids with `approvedForProduction: true`, non-`rights_uncertain`, non-`rejected`, and `celebrityNameRisk: false`.

### Store selectable catalog (`sunnah-audio-platform`)

Only voices with store decision **VERIFIED** or **OWNER_APPROVED** (written proof).  
Default: **صوت النظام الافتراضي** (`system-default`).  
`style_only_preview` and `pending_owner_approval` are **not** store-selectable.

## Store binary policy (unchanged HOLD)

Until OWNER allowlists specific globs, `store:strip-unresolved-assets` removes **all** `dist/audio/adhan` and `dist/sounds/adhan` media before Capacitor store sync — including CC0 field packs. Web production may continue serving those files from `public/`.
