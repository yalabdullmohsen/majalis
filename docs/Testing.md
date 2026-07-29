# Testing — المجلس العلمي

## Web (`@workspace/majalis`)

Primary command:

```bash
pnpm --filter @workspace/majalis run test
```

Includes (non-exhaustive):

| Suite | Focus |
|---|---|
| `test:pwa` / `test:nav-active` / `test:seo` | Shell, navigation, SEO contracts |
| `test:phase1-quality` … `test:phase9-coverage` | Enterprise phase invariants |
| `test:lessons-domain` | Clean Architecture use case |
| `test:inheritance-engine` | Faraid math (unit) |
| `test:learning-paths-engine` | Certificates / scheduling |
| `test:category-tree` | Tree filter performance |
| `test:supabase-policy-audit` | SQL policy anti-patterns |
| `test:ci-security-gates` | Bootstrap / CI permissions |

Additional suites exist under `package.json` (`test:web-vitals-part9`, quiz, scholars, …) for deeper regression.

## Flutter (`artifacts/majlisilm-flutter`)

```bash
bash artifacts/majlisilm-flutter/scripts/flutter-gates.sh
# equivalent: flutter analyze --no-fatal-infos && flutter test
```

Covers AI recitation matcher, Quran smoke, release helpers.

## Mobile Expo

```bash
pnpm --filter @workspace/majalis-mobile run typecheck
```

## CI mapping

GitHub `ci.yml` runs install → content-guard → typecheck → lint → build → import/platform verifies. Local `pnpm test` is the broader unit/regression pack and must stay green before PRs.

## Policy

- No skipped assertions, no `\|\| true`, no disabling suites to greenwash.
- Prefer deterministic unit tests with injected clocks/ports over live network.
- New enterprise phases add a named `test:phaseN-*` script wired into `test`.
