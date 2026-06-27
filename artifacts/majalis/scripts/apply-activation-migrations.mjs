#!/usr/bin/env node
/**
 * Apply Production Activation migrations (PR #72–#76 follow-up).
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/apply-activation-migrations.mjs
 *   pnpm --filter @workspace/majalis run apply:activation-migrations
 *
 * Applies in order:
 *   1. qa_categories_fix_v1.sql
 *   2. sharia_rulings_prereq.sql
 *   3. sharia_rulings_encyclopedia_v1.sql
 *   4. majlis_knowledge_engine_v1.sql
 *   5. majlis_knowledge_engine_v2.sql
 */
import { applyMigrations } from "../lib/db-migrate.mjs";
import { ACTIVATION_MIGRATION_FILES } from "../lib/migration-paths.mjs";

const TABLES = [
  "qa_categories",
  "qa_questions",
  "sharia_rulings",
  "sharia_ruling_categories",
  "mke_runs",
  "mke_queue_jobs",
  "mke_decisions",
  "mke_quality_reports",
  "mke_source_plugins",
];

async function probeTables() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return {};
  const out = {};
  for (const t of TABLES) {
    const res = await fetch(`${url}/rest/v1/${t}?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    out[t] = res.status === 200;
  }
  return out;
}

async function main() {
  console.log("Applying activation migrations:", ACTIVATION_MIGRATION_FILES.join(" → "));
  const before = await probeTables();
  console.log("Before:", before);

  const result = await applyMigrations({ files: ACTIVATION_MIGRATION_FILES, continueOnError: false });
  console.log(JSON.stringify(result, null, 2));

  const after = await probeTables();
  console.log("After:", after);

  const missing = TABLES.filter((t) => !after[t]);
  if (!result.ok || missing.length) {
    console.error("Activation incomplete. Missing tables:", missing.join(", "));
    process.exit(1);
  }
  console.log("Activation migrations applied successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
