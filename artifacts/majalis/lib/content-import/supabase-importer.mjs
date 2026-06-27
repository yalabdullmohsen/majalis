/**
 * @deprecated Use bulk-importer.mjs — kept for backward-compatible imports.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { bulkImportToSupabase } from "./bulk-importer.mjs";

export async function importToSupabase(admin, type, payloads, opts = {}) {
  if (!admin && !opts.dryRun) {
    return {
      ok: false,
      imported: 0,
      skipped: 0,
      failed: payloads.length,
      errors: ["Supabase غير مهيأ — أضف VITE_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY"],
    };
  }
  return bulkImportToSupabase(type, payloads, opts);
}

export { getSupabaseAdmin };
