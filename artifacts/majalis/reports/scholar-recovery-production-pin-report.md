# Scholar Recovery Production Pin — PR #184

**Date:** 2026-06-29  
**Main commits:** `2b3e362` (merge PR #184), `eb64d84` (redeploy trigger)

## Merge status

- PR #184 merged to `main` with conflict resolution (`feed.xml` only)
- Pre-merge checks: typecheck ✅, build ✅, verify:sheikh-recovery 20/20 ✅, research smoke 20/20 ✅
- CI on main: **SUCCESS** (includes Scholar recovery regression guard)

## Production deploy note

Vercel briefly served commit `68339e7` (PR #186 branch) over `2b3e362`. A follow-up push to `main` forces production rebuild from scholar recovery code.

## Verification URLs

- https://www.majlisilm.com/sheikhs
- https://www.majlisilm.com/sheikhs/salem-bin-saad-altaweel
- https://www.majlisilm.com/lessons/sci-tawheed-saltaweel

## CI guard

```bash
pnpm --filter @workspace/majalis run verify:sheikh-recovery
```

Fails if `/sheikhs` redirect removed, Salem lesson missing, scholars < 14, catalog < 17.
