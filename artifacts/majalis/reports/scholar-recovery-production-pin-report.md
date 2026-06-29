# Scholar Recovery Production Pin — PR #184

**Date:** 2026-06-29  
**Main commits:** `2b3e362` (merge PR #184), `eb64d84` (redeploy trigger)

## Merge status

- PR #184 merged to `main` with conflict resolution (`feed.xml` only)
- Pre-merge checks: typecheck ✅, build ✅, verify:sheikh-recovery 20/20 ✅, research smoke 20/20 ✅
- CI on main: **SUCCESS** (includes Scholar recovery regression guard)

## Production deploy note

Initial deploy briefly served PR #186 branch (`68339e7`) over scholar recovery. Fixed by:
- `0840396` — majalis artifact change to force Vercel rebuild
- `d3722cb` — SafeLazyRoute params fix for `/lessons/:id`

**Production SHA:** `d3722cb` — Vercel status **success**

## Production verification (2026-06-29)

```
node scripts/verify-sheikh-recovery-production.mjs --base=https://www.majlisilm.com
→ 16/16 PASS
```

- `/sheikhs` — 14+ scholars visible, Salem present, no redirect to `/lessons`
- `/sheikhs/salem-bin-saad-altaweel` — profile loads
- `/lessons/sci-tawheed-saltaweel` — lesson loads
- Search autocomplete: سالم، الطويل، سالم الطويل — PASS

## Verification URLs

- https://www.majlisilm.com/sheikhs
- https://www.majlisilm.com/sheikhs/salem-bin-saad-altaweel
- https://www.majlisilm.com/lessons/sci-tawheed-saltaweel

## CI guard

```bash
pnpm --filter @workspace/majalis run verify:sheikh-recovery
```

Fails if `/sheikhs` redirect removed, Salem lesson missing, scholars < 14, catalog < 17.
