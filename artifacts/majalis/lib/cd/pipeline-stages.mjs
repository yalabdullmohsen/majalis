/**
 * CD Pipeline stages — definitions for CI runner.
 */

export const PIPELINE_STAGES = [
  { id: "lint", label: "Lint", cmd: "pnpm -r --if-present run lint", optional: true },
  { id: "typecheck", label: "Type Check", cmd: "pnpm run typecheck:libs && pnpm --filter @workspace/majalis run typecheck" },
  { id: "unit_tests", label: "Unit Tests", cmd: "cd artifacts/majalis && pnpm run test:content-import" },
  { id: "integration_tests", label: "Integration Tests", cmd: "cd artifacts/majalis && pnpm run test:content-import-e2e" },
  { id: "build", label: "Production Build", cmd: "pnpm --filter @workspace/majalis run build" },
  { id: "security_scan", label: "Security Scan", cmd: "cd artifacts/majalis && pnpm run verify:no-infinite-loading && pnpm run verify:content-import-vercel" },
  { id: "ake_tests", label: "AKE Tests", cmd: "cd artifacts/majalis && pnpm run verify:ake-backfill && pnpm run verify:ake-pipeline" },
  { id: "platform_tests", label: "Platform Tests", cmd: "cd artifacts/majalis && pnpm run verify:autonomous-platform && pnpm run verify:majlis-knowledge-engine && pnpm run verify:import-jobs-integrity" },
  { id: "deploy_output", label: "Deploy Output", cmd: "pnpm --filter @workspace/majalis run verify:deploy" },
  { id: "database_verify", label: "Database Verification", cmd: "cd artifacts/majalis && pnpm run audit:database", optional: true },
];

export const MIN_COVERAGE_PCT = 0;
