# Quran Engine — Going Live Roadmap

Strategic deployment guide for the Majalis Quran Engine stack
(`DatabaseManager` / IndexedDB + `QuranViewer` + Audio / Tafseer + PWA shell).

**Status (2026-07-28):** Most production plumbing already exists. This document
maps **what ships today**, **what to tighten before a Quran-focused launch**,
and **what to defer** (Workbox migration, Vercel Analytics package).

Related docs: [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md),
[`quran-offline-storage.md`](./quran-offline-storage.md),
[`performance-security-audit.md`](./performance-security-audit.md).

---

## 0. Launch posture (one paragraph)

Treat the Quran Engine as an **offline-first reading shell**: the Vite SPA +
service worker deliver UI/logic; **IndexedDB** (`majalis-quran-engine-db`) holds
khatmah, reflections, settings, and offline audio/tafseer blobs. Network is
required only for first install, CDN audio/tafseer miss, and Supabase auth.
Deploy **only from `main`** via Vercel (`vercel.json` →
`git.deploymentEnabled.main = true`). Feature work lands through draft PRs;
merge + release remains the dedicated release workflow.

---

## 1. PWA — Service Worker & Installability

### 1.1 What we ship today (do not rip out)

| Piece | Location | Behavior |
|---|---|---|
| Service worker | `public/sw.js` | Custom SW (Workbox-equivalent strategies), versioned by `SW_BUILD_ID` from `scripts/generate-version.mjs` → `/sw-version.js` |
| Registration | `src/lib/service-worker.ts` | Prod-only `navigator.serviceWorker.register("/sw.js")`; periodic `registration.update()`; stale non-`/sw.js` workers purged |
| App shell assets | `STATIC_SHELL_ASSETS` in `sw.js` | Pre-cached: offline page, icons, manifests — **never** `/` or `index.html` (avoids pinning hashed chunks) |
| Hashed bundles | `/assets/*` | Network-first with cache fallback (stale hashed JS breaks lazy routes) |
| Mushaf data / fonts | `/data/quran*`, `/fonts/quran*`, `/fonts/qpc-v2/*` | Cache-first → offline page turns |
| External APIs | `api.alquran.cloud`, `api.aladhan.com` | Cache-first |
| User data | Dexie / IndexedDB | **Not** in Cache Storage — handled by `DatabaseManager` |

### 1.2 Workbox strategy (phased)

**Phase A — Keep custom SW (current, recommended for go-live).**  
Strategies already match Workbox recipes:

| Concern | Current | Workbox analogue |
|---|---|---|
| Navigations | `networkFirstNavigation` | `NetworkFirst` + offline fallback |
| Shell icons / fonts | `cacheFirst(OFFLINE_CACHE)` | `CacheFirst` |
| Mushaf JSON | `cacheFirst(DATA_CACHE)` | `CacheFirst` + expiration plugin |
| `/assets/*` | network then cache | `StaleWhileRevalidate` (optional upgrade) |

**Phase B — Optional Workbox migration (post-launch).**  
Only if maintenance cost rises:

1. Add `workbox-build` (or `vite-plugin-pwa`) as a **build-time** inject into
   `dist/sw.js` — do **not** dual-register workers.
2. Port route rules 1:1; keep `SW_BUILD_ID` cache-name suffix.
3. Keep **network-only documents** rule (never precache `index.html`).
4. Smoke-test: install → airplane mode → `/quran-viewer` + IndexedDB khatmah.

Until Phase B, treat `public/sw.js` as the source of truth.

### 1.3 Manifest (Install to Home Screen)

Canonical link in `index.html`:

```html
<link rel="manifest" href="/site.webmanifest" />
```

Also present: `public/manifest.json`, `public/manifest.webmanifest` (keep
aligned when editing shortcuts).

**iOS notes**

- `apple-touch-icon` + startup images already in `index.html`.
- `display: standalone`, `theme_color: #143F35`, `dir: rtl`, `lang: ar`.
- Safari: Add to Home Screen uses icons + `apple-mobile-web-app-*` meta;
  full SW offline is stronger on Chromium / Android.

**Android / Chrome**

- Icons 192 + 512 (+ maskable) required — present.
- `start_url: /?source=pwa` enables installability analytics via query.

**Go-live checklist**

- [ ] Lighthouse → PWA ≥ installable
- [ ] Android: install → offline open last mushaf page
- [ ] iOS: Add to Home Screen → opens `start_url`, theme color correct
- [ ] After deploy: Update banner / `controllerchange` reload path still works

---

## 2. Vercel deployment optimization

### 2.1 Project settings (dashboard)

| Field | Value |
|---|---|
| Root Directory | `artifacts/majalis` |
| Framework | Vite |
| Install | `corepack enable && cd ../.. && corepack pnpm install --frozen-lockfile --prod=false` |
| Build | `pnpm run build` |
| Output | `dist` |
| Production branch | `main` only |

Config file: `artifacts/majalis/vercel.json`.

### 2.2 Caching headers (required for Quran assets)

Immutable hashed JS/CSS already:

```text
/assets/(.*) → Cache-Control: public, max-age=31536000, immutable
```

**Must also long-cache** (added / verified for go-live):

| Path | Rationale |
|---|---|
| `/fonts/(.*)` | QPC / UI fonts; rare change |
| `/data/quran/(.*)`, `/data/quran-v2/(.*)` | Static mushaf JSON |
| Audio under same origin (if any) | Long cache + `Accept-Ranges` via CDN |

Documents / SW / manifests stay **no-store** so deploys invalidate quickly:

`/`, `/index.html`, `/sw.js`, `/sw-version.js`, `/version.json`, manifests.

### 2.3 “Edge Middleware” for initial load — correct framing

This app is a **Vite SPA + serverless `api/index.js`**, not Next.js App Router.
Vercel **Edge Middleware** is the wrong primary lever here.

Use instead:

1. **Edge CDN** (automatic on Vercel) for `/assets`, fonts, mushaf JSON.
2. **Prerender** (`scripts/prerender.mjs`) for SEO HTML shells.
3. **Service worker** for repeat visits / offline.
4. **Optional** Edge Middleware later only for geo redirects, bot gates, or
   A/B — place `middleware.js` at the Vercel project root only with a clear
   need; do not block first paint with auth middleware for public mushaf.

Initial page load budget: keep `index.html` tiny + `no-store`; defer
assistant / heavy widgets (`DeferredAssistantWidget` pattern already in
`App.tsx`).

### 2.4 SPA rewrites for Quran routes

Ensure client routes resolve when cold-loaded:

- `/quran-viewer` and `/quran-viewer/:path*` → `/index.html`
- Existing `/mushaf/:path*`, `/quran/:path*` already covered

API stays on `/api/(.*)` → `/api/index`.

---

## 3. Performance & monitoring

### 3.1 Field signals (recommended stack)

| Layer | Tool | Purpose |
|---|---|---|
| Core Web Vitals | Native `PerformanceObserver` reporter (`src/lib/web-vitals-reporter.ts`) or later `@vercel/analytics` + Speed Insights | LCP / INP / CLS / TTFB in production |
| Slow ops | `src/lib/performance-monitor.ts` (`PERF_SLOW_MS = 3000`) | API / render / fetch outliers → client error pipeline |
| Lab | `pnpm --filter @workspace/majalis run test:quran-engine-perf` | Local mushaf vitals bench |
| Memory / IDB | `ResourceManager` + LRU + `docs/quran-resource-lifecycle.md` | Cap offline assets; watch `performance.memory` in Chromium DevTools during long reading sessions |

**Vercel Analytics / Speed Insights (enable in dashboard):**

1. Project → Analytics → enable Web Analytics + Speed Insights.
2. Optionally add `@vercel/analytics` / `@vercel/speed-insights` and mount once
   in `main.tsx` (prod-only). Prefer this **after** go-live if package weight
   is a concern — the native reporter covers vitals without a new dependency.
3. Alert on LCP > 2.5s or INP > 200ms on `/quran-viewer` and `/`.

**Memory-leak field playbook**

- Session ≥ 30 min continuous page turns + audio.
- Watch IDB growth (`offline_assets_store`), JS heap, detached canvases.
- If heap climbs without plateau → audit `AudioEngine` element reuse and
  mushaf page DOM retention (`PageCurlStage` / prefetch ±1).

### 3.2 CI/CD pipeline (GitHub Actions)

**Already in repo**

| Workflow | Role |
|---|---|
| `.github/workflows/ci.yml` | PR + `main`: content-guard, typecheck, lint, build, import tests, `verify:deploy` |
| `.github/workflows/auto-deploy.yml` | After `main` push: rebuild gate + curl health on production |
| `.github/workflows/release-majlisilm.yml` | Manual merge of automation branches → `main` with quality gates |

**Target pipeline for Quran Engine go-live**

```text
PR opened
  → ci.yml (build + existing gates)
  → + Quran unit smokes (core / audio / viewer / dashboard stats)
  → + optional test:quran-engine-perf (non-blocking or budget gate)
Merge to main (human / release workflow only)
  → Vercel production deploy (git.deploymentEnabled.main)
  → auto-deploy.yml health check on https://www.majlisilm.com/
```

Do **not** deploy feature branches to production. Preview deployments for PRs
are fine if enabled in the Vercel project.

**Suggested CI step (add when tests land):**

```yaml
- name: Quran Engine unit smokes
  run: |
    cd artifacts/majalis
    npx tsx tests/unit/quran-core-structure.test.ts
    npx tsx tests/unit/quran-viewer-surface.test.ts
    # add: home-dashboard-stats, audio, tafseer as they land on main
```

---

## 4. Security headers

Already enforced globally in `vercel.json` → `headers` for `/(.*)`:

| Header | Value (summary) |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Content-Security-Policy` | Restrictive default; allows Supabase, AlQuran Cloud, AlAdhan, Quran audio CDNs, fonts |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` (+ CSP `frame-ancestors 'none'`) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera off; mic/geo self (recitation / prayer) |

**Go-live CSP hygiene**

- When adding a new audio/tafseer CDN, extend **both** `media-src` and
  `connect-src` in the same PR.
- Prefer `'self'` hashed assets; avoid widening `script-src` beyond current
  `'unsafe-inline'` until a nonce/hash migration is scheduled.
- Never put secrets in the SPA — only `VITE_SUPABASE_*` anon keys.

---

## 5. Phased checklist — “Going Live”

### Phase 0 — Freeze (done / verify)

- [x] Custom SW + versioned caches
- [x] Manifests + apple-touch icons
- [x] HSTS + CSP + asset immutable cache
- [x] CI build gate + main-only Vercel deploy
- [ ] Confirm `/quran-viewer` rewrite + font/mushaf Cache-Control in `vercel.json`

### Phase 1 — Quran readiness (this PR / next)

- [ ] Offline: airplane mode after one online session → page turn + khatmah resume
- [ ] Installability smoke (Android + iOS)
- [ ] Web vitals reporter active in prod; dashboard baseline for `/` and `/quran-viewer`
- [ ] Wire Quran unit smokes into `ci.yml`

### Phase 2 — Observability hardening

- [ ] Enable Vercel Speed Insights in dashboard
- [ ] Optional `@vercel/analytics` mount
- [ ] Alerting on vitals regressions + SW update failure rate

### Phase 3 — Optional Workbox

- [ ] Build-time Workbox inject replacing hand-rolled fetch router
- [ ] Cache expiration plugins for mushaf JSON / audio metadata
- [ ] Document rollback: previous `sw.js` + `SW_BUILD_ID` bump

---

## 6. Owner commands (local)

```bash
cd /workspace   # monorepo root
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
pnpm --filter @workspace/majalis run verify:deploy

# Quran smokes (as available on branch)
cd artifacts/majalis && npx tsx tests/unit/quran-core-structure.test.ts
```

Production health after merge: `https://www.majlisilm.com/` (and
`/quran-viewer` once routed).
