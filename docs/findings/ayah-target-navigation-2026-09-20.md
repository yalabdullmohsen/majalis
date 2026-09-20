# Ayah Target Navigation — Finding

**Classification:** `NEXT_BUILD_FIX` (App Store review in flight — do not auto-withdraw)

**Severity path:** Wrong page from legacy `/mushaf/:surah?ayah=` treated surah number as page and dropped ayah → user opens wrong page without selection. Not a published Quran-text integrity break; reference navigation bug.

## Root cause (proven)

1. `AppRoutes` route `/mushaf/:surah` redirected to `/mushaf?page=${surah}` and dropped `?ayah=`.
2. Call sites (`mushafAyahHref`, search, topic index, deep-link builder, jump search) emitted `/mushaf/${surah}?ayah=${ayah}` which hit that buggy redirect.
3. Example: البقرة 34 → `/mushaf/2?ayah=34` → `/mushaf?page=2` (no ayah). الأعراف 11 → page 7 instead of 151.

Prophet «مواضع الذكر» already used `QuranNavigationService.openAyah` (canonical). Highlight could still be cleared by a race (`!pending → clear` after consume) and auto-timeout.

## Fix

- Canonical href: `resolveCanonicalAyahHref` / `buildMushafAyahHref` / `openMushafAtReference`.
- Legacy redirect via `resolveLegacyMushafSurahRedirect` + pending stash.
- Pending selection with `navigationIntentId`; Last Position deferred when intent present.
- Dismiss chip «إلغاء التحديد»; no auto-clear; page leave ends selection after reveal.

## Refs verified in gate

| Ref | Page |
|-----|------|
| 2:34 | 6 |
| 7:11 | 151 |
| 15:31 | 263 |
| 38:74 | 457 |
