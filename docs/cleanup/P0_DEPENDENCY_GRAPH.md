# سُنّة — P0 Dependency Graph (logical)

## Workspace edges

```
apps/artifacts/majalis ──imports──▶ lib/api-client-react, lib/api-zod, lib/db (as used)
apps/artifacts/api-server ──imports──▶ lib/* (handlers/db as wired)
scripts/* ──orchestrates──▶ pnpm filters on artifacts + root gates
CI (.github/workflows) ──runs──▶ verify:ci / path lanes / auto-merge
```

## Allowed direction

```
artifacts/*  →  lib/*
lib/*        →  lib/* (no upward import into artifacts)
scripts      →  read artifacts/lib (gates only)
```

## Forbidden (to gate in P2+)

- `lib/*` importing `artifacts/majalis/src/**`
- Feature UI importing a second audio stack bypassing `app-audio-coordinator` / bus
- Client bundle embedding API secrets
- Codemod touching protected content globs

## How to regenerate deeper graphs later

Use existing toolchain only — do not invent:

```bash
# example probes (optional; not required for P0 gate)
pnpm why <pkg>
# knip / depcheck / madge when already adopted in prior sweeps (see docs/DEAD_CODE_SWEEP_REPORT.md)
```

## Known duplicate / parallel clusters (for P2, not deleted in P0)

| Cluster | Members | Status |
|---|---|---|
| Audio | coordinator, bus, AudioEngine, mini player, speech-read-aloud, adhan, lessons | **duplicated** surfaces; SoT target = coordinator+bus |
| Quran readers | Immersive / Verified mushaf / NewMushaf / legacy viewers | **legacy_in_use** — map before remove |
| Search | knowledge-platform universal search + older search libs | inventory in P1 |
| Design | soft cards / green surface / legacy cards | migrate then delete |

## Cycles

P0 does not claim a full madge cycle report.  
**NOT VERIFIED:** complete circular dependency audit.  
Track as release blocker for deep cleanup P3, not for documenting P0.
