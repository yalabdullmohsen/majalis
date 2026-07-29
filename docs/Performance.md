# Performance — المجلس العلمي

## Scope

Web (`artifacts/majalis`, Vite + React SPA) is the primary surface. Mobile (Expo) and legacy Flutter follow the same network/timeout contracts where shared.

## Bundle strategy

- Route-level `lazyWithRetry` (~160+ chunks) — **do not** force `src/` paths into named `manualChunks`.
- Vendor `manualChunks` only for `node_modules` (supabase, radix, icons, charts, …).
- React core matcher must use path segments (`/react/`, `/react-dom/`) — never bare `includes("react")` (that pulls `react-hook-form` / Radix into the long-lived vendor chunk).
- Build target `es2022`, `legalComments: "none"`, `cssCodeSplit`, `assetsInlineLimit: 4096`.

## Network & cache

- Client: `RequestManager` (timeout 8s, limited retries, GET dedupe).
- TanStack Query: `staleTime` 90s, `gcTime` 10m, `networkMode: "online"`, no refetch-on-focus.
- Static fonts/data: long-cache headers (Vercel + Express).
- Idle `prewarm*` for audio CDNs, text APIs, and configured Supabase origin.

## Images & fonts

- Prefer `OptimizedImage` (lazy + async decode + optional `fetchPriority`).
- Amiri Quran self-hosted + `preload`; UI fonts via non-blocking `media=print` swap.
- Decorative Google fonts deferred until idle / first interaction.

## Measurement

- `PERF_SLOW_MS` (3s) → console + client error pipeline.
- Optional: `ANALYZE=1` Vite build → `dist/bundle-stats.html`.
- Gate: `pnpm --filter @workspace/majalis run test:phase7-performance`.

## Anti-patterns (do not reintroduce)

- Static `manualChunks` for application feature folders.
- Blocking Google Fonts in `<head>` without `media` swap.
- Placeholder / invalid `preconnect` hrefs.
- `networkMode: "always"` for default queries (spams offline failures).
