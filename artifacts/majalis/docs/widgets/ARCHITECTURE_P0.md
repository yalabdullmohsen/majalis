# سُنّة Widgets P0

## Verdict scope
Infrastructure only — **no** full home-screen widget UI rollout.

## Platform audit
- Runtime: Capacitor WebView (Vite React) + iOS/Android shells
- Existing: iOS Prayer Live Activity (`active`)
- Missing: WidgetKit home/lock widgets, Android App Widgets (`ready_to_integrate`)

## Data plane
- `WidgetDataCoordinator` (`publishCoreWidgetSnapshots`)
- Shared snapshot schema v1 + checksum
- Atomic localStorage write (`sunnah-widget-bundle-v1`)
- Sources of truth: `prayer-time-engine` / `prayer-times`, `quran-last-page`, content-resolver deep links
- Account wipe via `clear-user-local-data` + `invalidateWidgetsForAccountChange`

## Privacy
- lock_safe vs account_private payloads
- No tokens in shared snapshots
- Guest/user scope hashing

## Not in P0
Home Screen UI, Live Activity expansion beyond prayer, gallery settings UI, TestFlight widget installs

