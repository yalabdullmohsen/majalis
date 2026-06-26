/**
 * Resolve SQL migration directory — works in monorepo dev and Vercel (root = artifacts/majalis).
 */

import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const MIGRATION_FILES = [
  "auto_content_pipeline.sql",
  "auto_content_pipeline_v2.sql",
  "auto_engine_production_complete.sql",
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
