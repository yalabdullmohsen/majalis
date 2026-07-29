# GitHub branch protection (manual)

Required on `main`:

1. Settings → Branches → Add rule for `main`.
2. Require PR before merge; dismiss stale approvals.
3. Require status checks (names as shown in Actions):
   - `Verify build` (current `ci.yml`)
   - Future split jobs when added: quality / migration-check / api-contract / playwright
   - `Vercel – majalis-majalis`
4. Require branches up to date.
5. Block force pushes and deletions.
6. Do **not** allow bypass for deploy automation except documented owners.

Agent cannot apply org settings without admin UI access.
