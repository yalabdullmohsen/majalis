/**
 * Runtime schema capability detection — avoids publisher failures on missing columns.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";

/** @type {Map<string, Set<string>>} */
const columnCache = new Map();

const PROBED = new Set();

async function probeTableColumns(admin, table) {
  if (columnCache.has(table)) return columnCache.get(table);

  const columns = new Set(["id", "created_at", "updated_at", "status", "external_key"]);
  try {
    const { data, error } = await admin.from(table).select("*").limit(1);
    if (!error && data?.[0]) {
      for (const k of Object.keys(data[0])) columns.add(k);
    }
  } catch {
    /* keep defaults */
  }

  columnCache.set(table, columns);
  PROBED.add(table);
  return columns;
}

export async function tableHasColumn(table, column) {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const cols = await probeTableColumns(admin, table);
  return cols.has(column);
}

export async function filterRecordForTable(table, record) {
  const admin = getSupabaseAdmin();
  if (!admin) return record;

  const cols = await probeTableColumns(admin, table);
  const filtered = {};
  const dropped = [];

  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue;
    if (cols.has(key)) filtered[key] = value;
    else dropped.push(key);
  }

  return { record: filtered, dropped };
}

export function invalidateSchemaCache(table) {
  if (table) columnCache.delete(table);
  else columnCache.clear();
}

export function getProbedTables() {
  return [...PROBED];
}
