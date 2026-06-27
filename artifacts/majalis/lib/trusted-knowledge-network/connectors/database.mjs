/**
 * Local database connector — query Supabase table configured in source.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";

export const type = "database";

export async function fetch(source, contentType) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const cfg = source.connector_config || source.metadata?.connector_config || {};
  const table = cfg.table;
  if (!table) throw new Error("database connector requires connector_config.table");

  const limit = Math.min(cfg.limit || 50, 200);
  let q = admin.from(table).select(cfg.select || "*").limit(limit);
  if (cfg.filter) {
    for (const [k, v] of Object.entries(cfg.filter)) q = q.eq(k, v);
  }
  if (cfg.orderBy) q = q.order(cfg.orderBy, { ascending: cfg.orderAsc !== false });

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapDbRow(row, contentType, cfg));
}

function mapDbRow(row, contentType, cfg) {
  const map = cfg.fieldMap || {};
  const get = (k) => row[map[k] || k] ?? "";
  switch (contentType) {
    case "benefits":
      return { text: get("text"), author_name: get("author_name"), category: get("category") || "فوائد" };
    case "questions":
      return { question: get("question"), answer: get("answer"), category_name: get("category") };
    default:
      return { title: get("title"), body: get("body") || get("text"), text: get("text") };
  }
}
