/**
 * AKE global + per-connector sync state (backfill → incremental transition).
 */

import { currentMonthKey, isConnectorBackfillDone } from "./sync-window.mjs";
import { isMissingTableError } from "../supabase-admin.mjs";

const GLOBAL_STATE_ID = "global";

export async function loadGlobalSyncState(admin) {
  const monthKey = currentMonthKey();
  try {
    const { data, error } = await admin
      .from("ake_sync_state")
      .select("*")
      .eq("id", GLOBAL_STATE_ID)
      .maybeSingle();

    if (error && isMissingTableError(error)) {
      return {
        id: GLOBAL_STATE_ID,
        current_month_key: monthKey,
        global_backfill_completed: false,
        global_import_mode: "backfill",
        _fallback: true,
      };
    }

    if (!data) {
      return {
        id: GLOBAL_STATE_ID,
        current_month_key: monthKey,
        global_backfill_completed: false,
        global_import_mode: "backfill",
      };
    }

    if (data.current_month_key !== monthKey) {
      return {
        ...data,
        current_month_key: monthKey,
        global_backfill_completed: false,
        global_import_mode: "backfill",
        _monthRollover: true,
      };
    }

    return data;
  } catch {
    return {
      id: GLOBAL_STATE_ID,
      current_month_key: monthKey,
      global_backfill_completed: false,
      global_import_mode: "backfill",
      _fallback: true,
    };
  }
}

export async function persistGlobalSyncState(admin, patch) {
  try {
    await admin.from("ake_sync_state").upsert(
      {
        id: GLOBAL_STATE_ID,
        updated_at: new Date().toISOString(),
        ...patch,
      },
      { onConflict: "id" },
    );
  } catch {
    /* table may not exist yet */
  }
}

/**
 * Resolve run-level import mode: backfill until every active connector
 * completes current-month backfill, then incremental.
 */
export function resolveRunImportMode(globalState, connectors, options = {}) {
  if (options.importMode === "backfill" || options.importMode === "incremental") {
    return options.importMode;
  }

  const monthKey = currentMonthKey();
  if (globalState?.global_backfill_completed && globalState?.current_month_key === monthKey) {
    return "incremental";
  }

  const active = (connectors || []).filter((c) => c.is_active !== false && c.connector_type !== "inactive");
  if (active.length === 0) return "incremental";

  const allDone = active.every((c) => isConnectorBackfillDone(c, monthKey));
  return allDone ? "incremental" : "backfill";
}

export async function markConnectorBackfillComplete(admin, connector, monthKey, stats) {
  if (!connector?.id) return;
  const now = new Date().toISOString();
  try {
    await admin.from("ake_connectors").update({
      backfill_month_key: monthKey,
      backfill_completed_at: now,
      sync_cursor_at: now,
      items_published: (connector.items_published || 0) + (stats?.published || 0),
      updated_at: now,
    }).eq("id", connector.id);
  } catch {
    /* ignore */
  }
}

export async function updateConnectorSyncCursor(admin, connector, items) {
  if (!connector?.id || !items?.length) return;
  let maxDate = connector.sync_cursor_at ? new Date(connector.sync_cursor_at) : null;

  for (const item of items) {
    const raw = item.source_published_at || item.published_at;
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    if (!maxDate || d > maxDate) maxDate = d;
  }

  if (!maxDate) return;

  try {
    await admin.from("ake_connectors").update({
      sync_cursor_at: maxDate.toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", connector.id);
  } catch {
    /* ignore */
  }
}

export async function finalizeRunSyncState(admin, globalState, connectors, runStats, importMode) {
  const monthKey = currentMonthKey();
  const active = (connectors || []).filter((c) => c.is_active !== false && c.connector_type !== "inactive");
  const allDone = active.every((c) => isConnectorBackfillDone(c, monthKey));

  if (importMode === "backfill" && allDone) {
    await persistGlobalSyncState(admin, {
      current_month_key: monthKey,
      global_backfill_completed: true,
      global_backfill_completed_at: new Date().toISOString(),
      global_import_mode: "incremental",
      last_run_id: runStats.runId || null,
      last_run_summary: {
        published: runStats.published,
        processed: runStats.processed,
        fetched: runStats.fetched,
      },
    });
  } else if (importMode === "incremental") {
    await persistGlobalSyncState(admin, {
      current_month_key: monthKey,
      global_import_mode: "incremental",
      global_backfill_completed: true,
      last_run_id: runStats.runId || null,
      last_successful_sync_at: new Date().toISOString(),
    });
  }
}

/** Connector finished backfill when all in-window items are handled or none exist. */
export function shouldCompleteConnectorBackfill(stats, importMode) {
  if (importMode !== "backfill") return false;

  if ((stats.rawFetched || 0) === 0) return true;
  if ((stats.fetched || 0) === 0 && (stats.rawFetched || 0) > 0) return true;

  const handled =
    (stats.duplicate || 0) +
    (stats.published || 0) +
    (stats.review || 0) +
    (stats.rejected || 0);
  return (stats.fetched || 0) > 0 && handled >= (stats.fetched || 0);
}
