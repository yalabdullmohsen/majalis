/**
 * Resolve SQL migration directory — works in monorepo dev and Vercel (root = artifacts/majalis).
 */

import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ACTIVATION_MIGRATION_FILES = [
  "owner_bootstrap_enum_v1.sql",
  "owner_bootstrap_v1.sql",
  "qa_categories_fix_v1.sql",
  "sharia_rulings_prereq.sql",
  "sharia_rulings_encyclopedia_v1.sql",
  "majlis_knowledge_engine_v1.sql",
  "majlis_knowledge_engine_v2.sql",
  "autonomous_platform_v1.sql",
];

/** Production activation — sharia + MKE tables only (no owner/qa bootstrap). */
export const ACTIVATION_TABLES_MIGRATION_FILES = [
  "platform_bootstrap_compat_v1.sql",
  "sharia_rulings_prereq.sql",
  "sharia_rulings_encyclopedia_v1.sql",
  "majlis_knowledge_engine_v1.sql",
  "majlis_knowledge_engine_v2.sql",
  "autonomous_platform_v1.sql",
  "autonomous_platform_v3.sql",
  "content_production_v1.sql",
  "auto_knowledge_engine_v13_rpc_fix.sql",
  "fiqh_council_items_ake_prereq.sql",
  "auto_knowledge_engine_v14_sync.sql",
  "cd_pipeline_v1.sql",
];

export const MIGRATION_FILES = [
  "auto_content_pipeline.sql",
  "auto_content_pipeline_v2.sql",
  "auto_engine_production_complete.sql",
  "platform_bootstrap_compat_v1.sql",
  "knowledge_engine_v12.sql",
  "auto_knowledge_engine_v13.sql",
  "scholarly_verification_v1.sql",
  "scholarly_intelligence_v1.sql",
  "digital_learning_v1.sql",
  "autonomous_ai_v1.sql",
  "global_reference_v1.sql",
  "islamic_intelligence_v1.sql",
  "open_platform_v1.sql",
  "governance_v1.sql",
  "verified_knowledge_platform_v1.sql",
  "reasoning_engine_v1.sql",
  "knowledge_graph_phase4_v1.sql",
  "qa_phase4_seed.sql",
  "kuwait_lessons_extend.sql",
  "content_import_jobs_v1.sql",
  "smart_cms_v5.sql",
  "lesson_import_drafts_v1.sql",
  "trusted_lesson_sources_v1.sql",
  "kuwait_instagram_sources_v1.sql",
  "kuwait_instagram_sources_v2.sql",
  "smart_source_monitoring_v1.sql",
  "automation_phase5_v1.sql",
  "lesson_intelligence_v6.sql",
  "instagram_graph_phase7_v1.sql",
  "owner_bootstrap_enum_v1.sql",
  "owner_bootstrap_v1.sql",
  "qa_categories_fix_v1.sql",
  "sharia_rulings_prereq.sql",
  "sharia_rulings_encyclopedia_v1.sql",
  "majlis_knowledge_engine_v1.sql",
  "majlis_knowledge_engine_v2.sql",
  "autonomous_platform_v1.sql",
  "autonomous_platform_v3.sql",
  "content_production_v1.sql",
  "auto_knowledge_engine_v13_rpc_fix.sql",
  "fiqh_council_items_ake_prereq.sql",
  "auto_knowledge_engine_v14_sync.sql",
  "cd_pipeline_v1.sql",
];

export function resolveMigrationsDir() {
  const candidates = [
    join(__dirname, "..", "supabase"),
    join(__dirname, "../../..", "supabase"),
    join(process.cwd(), "supabase"),
    join(process.cwd(), "..", "..", "supabase"),
  ];

  for (const dir of candidates) {
    const probe = join(dir, "auto_engine_production_complete.sql");
    if (existsSync(probe)) {
      return { dir, source: dir, exists: true };
    }
  }

  return {
    dir: candidates[0],
    source: "none",
    exists: false,
    tried: candidates,
  };
}

export function listAvailableMigrations() {
  const { dir, exists, tried } = resolveMigrationsDir();
  if (!exists) {
    return { ok: false, dir, tried, files: [], missing: MIGRATION_FILES };
  }

  const present = [];
  const missing = [];
  for (const file of MIGRATION_FILES) {
    const full = join(dir, file);
    if (existsSync(full)) present.push(file);
    else missing.push(file);
  }

  const all = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  return { ok: missing.length === 0, dir, present, missing, allSqlInDir: all };
}

export function migrationFilePath(filename) {
  const { dir, exists } = resolveMigrationsDir();
  if (!exists) {
    throw new Error(`Migrations directory not found — tried supabase/ under app root and monorepo root`);
  }
  return join(dir, filename);
}
