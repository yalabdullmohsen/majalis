# سُنّة — Release Blockers (Cleanup program)

Status at **P0 documentation only**. Cleanup is **NOT** a release by itself.

## Blocks shipping a “cleanup complete” claim

| ID | Blocker | Severity | Action |
|---|---|---|---|
| B01 | No mass dead-code deletion evidence yet | P0 | Run P1 with per-file evidence |
| B02 | Parallel audio stacks still present | P1–P2 | Consolidate behind coordinator+bus; CI forbid third player |
| B03 | Full circular-deps report NOT VERIFIED | P3 | madge/dependency-cruiser gate when adopted |
| B04 | Bundle size before/after NOT VERIFIED | P4 | `build` + analyzer on majalis |
| B05 | TestFlight of cleanup branch NOT VERIFIED | P4 | Internal build after P1+ consolidations |
| B06 | 531 majalis scripts — unknown stale set | P1 | Inventory + prove unused before delete |
| B07 | Frozen artifacts still in tree (noise) | debt | Keep until product decision; do not delete mushafi |
| B08 | Open parallel PRs may race (audio-reader, etc.) | process | One concern per PR; rebase cleanup on main |
| B09 | E2E critical journeys not re-run for cleanup | P4 | Home, mushaf, search, prayer, audio, auth |
| B10 | DB migration history must never be rewritten | standing | Expand/contract only |

## Does P0 itself block production?

**No.** P0 adds docs + gate only. Safe to merge if CI green.

## Hard stops (any phase)

- Red CI
- Protected content diff without specialist review
- Deleting applied migrations
- Removing routes without redirects + deep-link tests
- Introducing `any` / ts-ignore to force green
- Secrets in client
