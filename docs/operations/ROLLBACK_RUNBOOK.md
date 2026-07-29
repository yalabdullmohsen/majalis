# ROLLBACK RUNBOOK

## Application

1. Revert merge commit on `main` via GitHub revert PR (no force-push).
2. Vercel auto-deploys previous `main` SHA.
3. Do not delete DB tables/columns to “undo”.

## Database

1. Prefer expand/contract: leave new columns/tables in place.
2. Rollback SQL must be prepared per migration before apply.
3. Production apply requires backup + explicit approval.

## Auto-merge incident

1. Disable/delete `auto-merge-to-main.yml` on `main`.
2. Cancel pending auto-merges: `gh pr merge <n> --disable-auto`.
3. Convert accidental Ready PRs back to Draft if needed.
