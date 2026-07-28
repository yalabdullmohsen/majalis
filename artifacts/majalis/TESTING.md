# Quran Engine Testing Suite

How to run and extend automated tests for the Majalis Quran Engine
(`DatabaseManager`, `QuranEngineContext`, `QuranViewer`, offline/PWA paths).

## Layout

```
artifacts/majalis/
  src/tests/
    setup/vitest.setup.ts          # fake-indexeddb bootstrap
    helpers/idb.ts                 # IDB reset helpers
    unit/
      DatabaseManager.test.ts      # persistence + migrations
      QuranEngineContext.test.ts   # state transitions + progress
    e2e/
      critical-journey.spec.ts     # open → ayah → play → bookmark
      offline-support.spec.ts      # cache serve while offline
  vitest.config.ts
  playwright.quran-engine.config.ts
  tests/                           # legacy / broader QA pipeline (still valid)
```

## Prerequisites

```bash
cd /workspace   # monorepo root
pnpm install --frozen-lockfile
# Playwright browsers (once per machine / CI cache):
pnpm --filter @workspace/majalis exec playwright install chromium
```

## Commands

| Command | What it runs | Typical duration |
|---------|--------------|------------------|
| `pnpm --filter @workspace/majalis run test:quran-vitest` | Vitest unit suite (`src/tests/unit`) | ~2–5s |
| `pnpm --filter @workspace/majalis run test:quran-e2e` | Playwright critical + offline (`src/tests/e2e`) | ~30–90s |
| `pnpm --filter @workspace/majalis run test:quran-suite` | Vitest only (CI-safe, fast) | ~2–5s |
| `pnpm --filter @workspace/majalis run test:quran-engine-qa` | Broader legacy unit/PWA pipeline | ~15–40s |

```bash
# Unit (Vitest + fake-indexeddb) — preferred local loop
pnpm --filter @workspace/majalis run test:quran-vitest

# E2E (starts Vite on :5173 unless already running)
pnpm --filter @workspace/majalis run test:quran-e2e
```

## CI / CD

Workflow: `.github/workflows/quran-engine-tests.yml`

- Runs on pull requests and pushes touching Quran Engine / test paths.
- **Non-blocking:** `continue-on-error: true` so a red suite never blocks merge of unrelated work while the suite matures.
- Job 1 `unit` (required path for speed): Vitest only.
- Job 2 `e2e` (optional / soft): Playwright Chromium; may skip cases when mushaf assets are unavailable.

The main `ci.yml` build gate is unchanged and remains the hard quality gate.

## Adding new tests

### Unit (Vitest)

1. Create `src/tests/unit/<Feature>.test.ts`.
2. Import from `@/core/quran` (or the module under test).
3. For IndexedDB: use `freshDatabaseManager()` / `deleteQuranEngineDb()` from `src/tests/helpers/idb.ts`.
4. Prefer asserting **behavior** (persistence, clamps, migrations) over implementation details.
5. Run `pnpm --filter @workspace/majalis run test:quran-vitest`.

Example skeleton:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { freshDatabaseManager, deleteQuranEngineDb } from "../helpers/idb";

describe("MyFeature", () => {
  beforeEach(async () => { await deleteQuranEngineDb(); });
  afterEach(async () => { await deleteQuranEngineDb(); });

  it("does the thing", async () => {
    const db = await freshDatabaseManager();
    // ...
    expect(true).toBe(true);
  });
});
```

### E2E (Playwright)

1. Add `src/tests/e2e/<flow>.spec.ts`.
2. Target stable selectors (`role`, `aria-label`, `.quran-viewer`, `.qab-actions`).
3. Soft-skip when assets are missing (`test.skip(!ready, "…")`) so CI stays green in constrained environments.
4. Keep journeys short — one critical path per file.
5. Run `pnpm --filter @workspace/majalis run test:quran-e2e`.

### What not to do

- Do not precache or assert against hashed `/assets/*` chunk names.
- Do not require live Supabase or external audio CDNs for unit tests.
- Do not make the suite a hard merge blocker until it is stable on `main` for several weeks.

## Related docs

- `tests/README.md` — broader Quran Engine QA pipeline
- `docs/quran-engine-going-live.md` — deployment / PWA / monitoring
- `docs/quran-offline-storage.md` — IndexedDB schema
