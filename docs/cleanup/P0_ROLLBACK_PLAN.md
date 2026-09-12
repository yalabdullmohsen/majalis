# سُنّة — Cleanup Rollback Plan (P0)

## Goals

- Instantly undo risky cleanup commits without data loss.
- Never roll back user Supabase data as part of code cleanup.
- Never “fix” religious corpora via revert side effects without checking diffs.

## Primary rollback

1. **Reverting a cleanup PR**

```bash
gh pr view <n> --json mergeCommit,number
git checkout main && git pull --ff-only
git revert -m 1 <merge_commit_sha>
# or: git revert <cleanup_commit_sha> for single commits
pnpm run verify:ci -- --changed
git push
```

2. **Hard reset to baseline tag** (only on unreleased branches)

```bash
git fetch origin
git checkout cleanup-p0-baseline-<shortsha>
# recreate branch from tag if needed
```

3. **Production**

- Vercel tracks `main`. Revert commit on `main` → auto deploy.
- Confirm `https://www.ssunnah.com/version.json` matches intended commit.
- Capacitor/store: do not submit store binary from an unverified cleanup branch.

## Data / migrations

- Code rollback ≠ database rollback.
- Never delete or edit applied migration files to “undo.”
- If a forward migration was applied, ship a new compensating migration.

## User progress / downloads

- Local-first progress keys must remain readable across cleanup versions (additive schema).
- Do not clear IndexedDB/localStorage in cleanup scripts.

## Communication

- Brand in all notices: **سُنّة**
- If production regresses: revert first, analyze second.

## P0 expectation

P0 only adds documentation + `scripts/cleanup/p0-gate.mjs`.  
Rollback of P0 alone is a trivial revert with no runtime behavior change beyond the new gate in `verify:ci`.
