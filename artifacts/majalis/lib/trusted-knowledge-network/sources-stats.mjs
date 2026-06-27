/**
 * Source fetch stats helper (shared by fetch + pipeline).
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function updateSourceStatsFromFetch(sourceId, { ok, items = 0, error }) {
  const admin = getSupabaseAdmin();
  if (!admin || !sourceId) return;
  try {
    const { data: current } = await admin
      .from("akp_content_sources")
      .select("fetch_count, success_count, items_imported, success_rate")
      .eq("id", sourceId)
      .maybeSingle();
    const fetchCount = (current?.fetch_count || 0) + 1;
    const successCount = (current?.success_count || 0) + (ok ? 1 : 0);
    const successRate = fetchCount > 0 ? Math.round((successCount / fetchCount) * 10000) / 100 : 0;
    await admin.from("akp_content_sources").update({
      fetch_count: fetchCount,
      success_count: successCount,
      success_rate: successRate,
      items_imported: (current?.items_imported || 0) + (ok ? items : 0),
      last_sync_at: new Date().toISOString(),
      last_fetch_at: new Date().toISOString(),
      last_success_at: ok ? new Date().toISOString() : undefined,
      last_error: ok ? null : String(error || "fetch_failed"),
      updated_at: new Date().toISOString(),
    }).eq("id", sourceId);
  } catch {
    /* optional */
  }
}
