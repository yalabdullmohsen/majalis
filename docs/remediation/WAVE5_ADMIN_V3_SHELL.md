# Wave 5 — Admin v3 Shell

**Date:** 2026-09-21  
**Base:** `05c3cbafd` (post Wave 4)  
**Entry:** `/admin/v3` (lazy + `AdminRouteGuard`)

## Delivered

- App Shell: sidebar (web/iPad) · mobile bottom nav (5) · search · account menu · notifications · breadcrumbs
- Dashboard entry + center stubs (Wave 6 fill)
- Error boundary · loading/empty/offline states
- Audit event contract (`admin-v3/audit-events.ts`)
- Light/Dark tokens · RTL · keyboard skip + focus-visible
- Legacy `/admin` **unchanged** (link from v3)

## Explicit non-actions

- No Legacy delete
- No RLS/permission changes
- No Admin tools on public chrome
- Centers CRUD deferred to Wave 6
