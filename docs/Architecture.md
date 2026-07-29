# Architecture — مجالس العلم (Majalis Al-Ilm)

## Stack (authoritative)

| Surface | Technology | Path |
|---|---|---|
| Web (production) | Vite + React SPA (RTL Arabic) | `artifacts/majalis` |
| Mobile | Expo Router (React Native) | `artifacts/majalis-mobile` |
| Native shell | Capacitor wrapping the Vite web app | `artifacts/majalis/ios`, `android` |
| Legacy Flutter | Modular Quran/AI sketch (not the production store app) | `artifacts/majlisilm-flutter` |
| API | Express push notifications | `artifacts/api-server` |
| Data | Hosted Supabase (Auth + Postgres + Storage) | browser → Supabase directly |

This is **not** a Next.js application. SSR/SSG concerns map to Vite prerender + `seo-prerender/` for the web app.

## Target architecture

```
Presentation (views / components / hooks)
        ↓ depends on
Application (use cases)
        ↓ depends on
Domain (entities / ports)
        ↑ implemented by
Infrastructure (Supabase adapters, local storage, HTTP)
```

### Dependency rule

- UI must not call Supabase clients or encode merge/fallback business rules.
- Use cases depend on **ports** (interfaces), not concrete adapters.
- Adapters implement ports and may call existing `@/lib/*` façades during the strangler migration.
- Composition roots live in per-feature `di.ts` factories (`createXModule` / `getXModule`).

## Feature-first layout (incremental)

```
src/features/<feature>/
  domain/          # entities + ports
  application/     # use cases
  infrastructure/  # adapters
  di.ts            # factory + singleton
  index.ts         # public façade
```

Existing `src/views`, `src/components`, and `src/lib` remain until features are migrated. `@/lib/*` re-exports preserve compatibility.

## Current extraction status

| Feature | Status | Entry |
|---|---|---|
| Lessons | Phase 2 foundation | `@/features/lessons` — `getLessonsModule().loadLessonDetail` used by `LessonDetailPage` |
| Auth | Pending | still via `AuthProvider` + `@/lib/supabase` |
| Fawaid / Sheikhs / Quran | Pending | stay in `@/lib` until extracted |

## State management

- Server/remote data: use cases + React local state / effects (no Redux).
- Session/profile: `AuthProvider` (Context).
- Quran reading engine: `QuranEngineProvider` + controllers in `src/core` / `src/lib`.
- Prefer feature modules over growing god-files (`supabase.ts`).

## Testing

- Use-case unit tests with fake ports (`node:assert` + `tsx`), no network.
- Package scripts: `test:lessons-domain`.

## Migration policy

1. Extract one feature seam at a time (Strangler Fig).
2. Keep public `@/lib` APIs stable until all callers migrate.
3. Never mass-move seeds, SEO prerender, Cron, Vercel config, or Capacitor iOS in architecture PRs.
4. No temporary hacks (`any`, `@ts-ignore`, disabled lint/tests).
