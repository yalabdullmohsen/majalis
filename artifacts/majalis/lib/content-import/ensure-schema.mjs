/**
 * Content-import schema — verify-only (never apply DDL at runtime).
 * Apply kuwait_lessons_extend.sql / content_import_jobs_v1.sql via CLI/SQL Editor.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { verifyImportTables, recoverImportJobIntegrity } from "./import-jobs.mjs";

async function lessonsImportColumnsReady(admin) {
  const { error } = await admin.from("lessons").select("external_key, speaker_name, day_of_week").limit(0);
  if (!error) return { ok: true };
  const msg = String(error.message || "");
  if (msg.includes("external_key") || msg.includes("speaker_name") || msg.includes("day_of_week")) {
    return { ok: false, missing: true, error: "schema_not_ready" };
  }
  return { ok: false, missing: false, error: "schema_check_failed" };
}

/**
 * Verify content-import schema readiness. Never runs CREATE/ALTER.
 * @deprecated name kept for callers — behavior is verify-only.
 */
export async function ensureContentImportSchema() {
  return verifyContentImportSchema();
}

export async function verifyContentImportSchema() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      error: "supabase_admin_missing",
      schemaMutationBlocked: true,
    };
  }

  const ready = await lessonsImportColumnsReady(admin);
  const importJobs = await verifyImportTables(admin);
  const integrity = importJobs.ok
    ? await recoverImportJobIntegrity({ skipEnsure: true })
    : { ok: false, error: importJobs.error };

  if (!ready.ok) {
    return {
      ok: false,
      error: ready.missing ? "schema_not_ready" : ready.error,
      schemaMutationBlocked: true,
      hint: "Apply supabase/kuwait_lessons_extend.sql via CLI/SQL Editor (REQUIRES_EXPLICIT_APPROVAL).",
      importJobs: importJobs.ok,
      integrity,
    };
  }

  if (!importJobs.ok) {
    return {
      ok: false,
      error: "import_schema_not_ready",
      schemaMutationBlocked: true,
      hint: "Apply supabase/content_import_jobs_v1.sql via CLI/SQL Editor (REQUIRES_EXPLICIT_APPROVAL).",
      integrity,
    };
  }

  return {
    ok: true,
    alreadyReady: true,
    mode: "verify_only",
    schemaMutationBlocked: true,
    importJobs: true,
    importJobsVia: importJobs.via,
    integrity,
  };
}
