/**
 * Expected production schema — tables, RPC, views, triggers, indexes, storage, RLS.
 */
import {
  AUTOMATION_RECOVERY_TABLES,
  SMART_CMS_TABLES,
  MIGRATION_FILES,
} from "../migration-paths.mjs";
import { ACTIVATION_TABLES } from "../table-probe.mjs";
import { CORE_DB_TABLES } from "../release-gate.mjs";
import { AKE_RPC_FUNCTIONS } from "../auto-knowledge-engine/rpc-probe.mjs";

export const EXPECTED_TABLES = [...new Set([
  ...CORE_DB_TABLES,
  ...ACTIVATION_TABLES,
  ...AUTOMATION_RECOVERY_TABLES,
  ...SMART_CMS_TABLES,
  "lessons",
  "sheikhs",
  "library_items",
  "cd_deployments",
  "cd_pipeline_runs",
  "cd_self_heal_events",
  "schema_migrations",
])];

export const EXPECTED_RPC = [
  ...AKE_RPC_FUNCTIONS.map((f) => f.name),
  "cms_search",
  "search_platform",
  "search_sharia_rulings",
  "content_engine_stats",
  "is_admin",
];

export const EXPECTED_VIEWS = [
  "cms_content_search",
];

export const EXPECTED_TRIGGERS = [
  { table: "cms_content_index", name: "cms_index_search_vector_update" },
];

export const CRITICAL_INDEXES = [
  { table: "lessons", pattern: "lessons%" },
  { table: "qa_questions", pattern: "qa_questions%" },
  { table: "ake_job_queue", pattern: "ake_job_queue%" },
  { table: "content_import_jobs", pattern: "content_import_jobs%" },
  { table: "schema_migrations", pattern: "schema_migrations%" },
];

export const EXPECTED_STORAGE_BUCKETS = ["sheikhs", "transcriptions"];

export const RLS_PROTECTED_TABLES = [
  "profiles",
  "qa_questions",
  "lessons",
  "sheikhs",
  "cms_content_index",
  "content_import_jobs",
];

export const MIGRATION_SCOPES = [
  { scope: "automation-recovery", files: "AUTOMATION_RECOVERY_MIGRATION_FILES", tables: AUTOMATION_RECOVERY_TABLES },
  { scope: "smart-cms", files: "SMART_CMS_MIGRATION_FILES", tables: SMART_CMS_TABLES },
  { scope: "activation-tables", files: "ACTIVATION_TABLES_MIGRATION_FILES", tables: ACTIVATION_TABLES.slice(0, 12) },
  { scope: "cd-pipeline", files: ["cd_pipeline_v1.sql"], tables: ["cd_deployments", "cd_pipeline_runs", "cd_self_heal_events"] },
];

export { MIGRATION_FILES };
