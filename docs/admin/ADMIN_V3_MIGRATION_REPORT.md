# Admin v3 Migration Report — Wave 7

**Date:** 2026-09-21  
**Base:** `168e2155f`  
**Inventory source:** `docs/admin/LEGACY_ADMIN_INVENTORY.md`

## Entry cutover

| Path | Behavior after Wave 7 | Status |
|---|---|---|
| `/admin` (no `?section`) | Redirect → `/admin/v3` | **MIGRATED** |
| `/admin?section=*` | Legacy `AdminPage` shell (CRUD) | **BLOCKED** (CRUD not ported) |
| `/admin/legacy` | Explicit Legacy shell | **KEEP** until delete wave |
| `/admin/v3/*` | Admin v3 shell + centers | **MIGRATED** |
| NavBar / SideNav admin link | Points to `/admin/v3` | **MIGRATED** |
| Dead `fiqh-review` / `fiqh-quality` | Redirect → `/admin/v3` | **SUPERSEDED** |

## Function matrix (summary)

| Area | oldRoute | newRoute | migrationStatus | Notes |
|---|---|---|---|---|
| Shell / Drawer | `/admin` | `/admin/v3` | MIGRATED | Default entry |
| Dashboard home | `/admin` / dashboard sections | `/admin/v3` | MIGRATED | Operational home |
| Content tools | `/admin?section=…` | `/admin/v3/content` → legacy hrefs | SUPERSEDED UI / BLOCKED CRUD | Catalog only |
| Review tools | review-hub / review-center | `/admin/v3/review` | SUPERSEDED UI / BLOCKED CRUD | |
| Users | `?section=users` | `/admin/v3/users` | SUPERSEDED UI / BLOCKED CRUD | No RLS change |
| Notifications | telegram / instagram | `/admin/v3/notifications` | SUPERSEDED UI / BLOCKED CRUD | |
| Analytics | search-analytics / feature-status | `/admin/v3/analytics` | SUPERSEDED UI / BLOCKED CRUD | |
| Automation | automation/* | `/admin/v3/automation` | SUPERSEDED UI / BLOCKED CRUD | Centers consolidated |
| System | error-logs / internal | `/admin/v3/system` | SUPERSEDED UI / BLOCKED CRUD | |
| Settings | `?section=settings` | `/admin/v3/settings` | SUPERSEDED UI / BLOCKED CRUD | |
| Audit | — | `/admin/v3/audit` | MIGRATED | Local event contract |
| AdminSiteEditBar / QuickEdit | Legacy shell only | — | KEEP | Still required for Legacy edit surfaces |
| Full Legacy delete | — | — | **BLOCKED** | Until CRUD journeys ported + deep-link redirects proven |

## Delete readiness

**NOT READY.** Criteria unmet:

- [ ] All required CRUD on v3 native surfaces
- [ ] Permissions journeys on v3 only
- [ ] No active imports of Legacy shell outside `/admin/legacy` and `?section=`
- [ ] Owner approval for SAFE_REMOVE list

Follow-up: dedicated delete PR only after CRUD migration (post Wave 7 scope).

## Explicit non-actions this wave

- No deletion of `views/admin/**`
- No RLS / MFA / SQL changes
- No inventing CRUD replacements
