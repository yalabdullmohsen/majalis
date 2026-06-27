/**
 * Ensure Supabase schema supports content import (lessons extended columns).
 * Runs kuwait_lessons_extend.sql when external_key column is missing.
 */

import { readFileSync } from "node:fs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getPgClient } from "../database.mjs";
import { migrationFilePath } from "../migration-paths.mjs";
import { ensureImportTables, recoverImportJobIntegrity } from "./import-jobs.mjs";

const CONTENT_IMPORT_MIGRATION = "kuwait_lessons_extend.sql";

async function lessonsImportColumnsReady(admin) {
  const { error } = await admin.from("lessons").select("external_key, speaker_name, day_of_week").limit(0);
  if (!error) return { ok: true };
  const msg = String(error.message || "");
  if (msg.includes("external_key") || msg.includes("speaker_name") || msg.includes("day_of_week")) {
    return { ok: false, missing: true, error: msg };
  }
  return { ok: false, missing: false, error: msg };
}

export async function ensureContentImportSchema() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, error: "Supabase admin not configured (SUPABASE_SERVICE_ROLE_KEY required)" };
  }

  const ready = await lessonsImportColumnsReady(admin);
  const importJobs = await ensureImportTables(admin);
  const integrity = importJobs.ok ? await recoverImportJobIntegrity() : { ok: false, error: importJobs.error };

  if (ready.ok) {
    return {
      ok: importJobs.ok,
      alreadyReady: true,
      importJobs: importJobs.ok,
      importJobsVia: importJobs.via,
      integrity,
      error: importJobs.ok ? undefined : importJobs.error,
    };
  }

  if (!ready.missing) {
    return { ok: false, error: ready.error || "lessons schema check failed" };
  }

  let sql;
  try {
    sql = readFileSync(migrationFilePath(CONTENT_IMPORT_MIGRATION), "utf8");
  } catch (err) {
    return { ok: false, error: `Migration file missing: ${CONTENT_IMPORT_MIGRATION} — ${err.message}` };
  }

  let client;
  try {
    ({ client } = await getPgClient());
    await client.query(sql);
  } catch (err) {
    return { ok: false, error: `Failed to apply ${CONTENT_IMPORT_MIGRATION}: ${err.message}` };
  } finally {
    await client?.end().catch(() => {});
  }

  const after = await lessonsImportColumnsReady(admin);
  if (!after.ok) {
    return { ok: false, error: `Migration applied but columns still missing: ${after.error}` };
  }

  return { ok: true, migrated: true, file: CONTENT_IMPORT_MIGRATION, importJobs, integrity };
}
