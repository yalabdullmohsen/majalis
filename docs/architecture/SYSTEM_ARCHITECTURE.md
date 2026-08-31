# SYSTEM ARCHITECTURE — سُنّة (snapshot 2026-07-29)

## Clients

- Web SPA: Vite + React (`artifacts/majalis`)
- Capacitor iOS shell: `artifacts/majalis/ios/App`
- Expo mobile package: `artifacts/majalis-mobile` (separate)

## Edge / compute

- Vercel project `majalis-majalis` serves static `dist/` + serverless `api/index.js`
- Dispatcher: `lib/api-dispatch.mjs` → `lib/api-handlers/**`
- Cron: Vercel Cron → `/api/cron/*` (many still inline on main)

## Data

- Hosted Supabase project `ngmvmlulzacrlicuagyp` (PostgreSQL 17 claimed)
- Browser uses anon key; server uses service role / `DATABASE_URL` where configured
- No local primary DB in monorepo (Drizzle placeholder noted in AGENTS.md)

## AI

- Anthropic (and optional other keys) via server-side provider client + circuit tables (migration may be missing in prod)

## Trust boundaries

1. Public internet → Vercel CDN / Functions
2. Functions → Supabase/Postgres (service role must never ship as `VITE_*`)
3. Client → Supabase RLS (must be complete)
4. Cron secret header → privileged jobs
