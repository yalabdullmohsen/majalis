/**
 * Bridge for server-side platform search (FTS fallback without client imports).
 */

import { getSupabaseAdmin } from "./supabase-admin.mjs";

function normalizeText(t) {
  return String(t || "").replace(/[\u064B-\u065F\u0670]/g, "").toLowerCase().trim();
}

function matchAny(fields, query) {
  const q = normalizeText(query);
  if (!q) return false;
  return fields.some((f) => normalizeText(f).includes(q));
}

export async function searchEverything(query, limit = 20) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  try {
    const { data } = await admin.rpc("search_platform", { query });
    if (data) {
      const results = [];
      for (const [kind, items] of Object.entries(data)) {
        if (!Array.isArray(items)) continue;
        for (const item of items.slice(0, limit)) {
          results.push({ ...item, kind, rank: 5 });
        }
      }
      return results.slice(0, limit);
    }
  } catch {
    /* fallback below */
  }

  const { data: lessons } = await admin
    .from("lessons")
    .select("id, title, description, category")
    .eq("status", "approved")
    .limit(limit);

  return (lessons || [])
    .filter((l) => matchAny([l.title, l.description, l.category], query))
    .map((l) => ({ ...l, kind: "lesson", rank: 3 }));
}
