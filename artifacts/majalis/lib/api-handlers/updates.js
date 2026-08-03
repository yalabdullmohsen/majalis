import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin, isMissingTableError } from "../supabase-admin.mjs";
import { UPDATES_IOS_FALLBACK } from "../updates-ios-fallback.mjs";

function toIosItem(row) {
  const id = String(row?.id || "").trim();
  const title = String(row?.title || "").trim();
  const content = String(row?.summary || row?.body || row?.title || "").trim();
  if (!id || !title || !content) return null;
  return { id, title, content };
}

async function loadFromSupabase() {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from("platform_updates")
    .select("id, title, summary, body, published_at, status")
    .eq("status", "approved")
    .order("published_at", { ascending: false })
    .limit(40);

  if (error) {
    if (isMissingTableError(error)) return null;
    console.error("[api/updates] supabase", error.message || error);
    return null;
  }

  const items = (data || []).map(toIosItem).filter(Boolean);
  return items.length > 0 ? items : null;
}

/**
 * GET /api/updates
 * JSON array for the iOS UpdatesView: [{ id, title, content }, ...]
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method Not Allowed" }, { Allow: "GET" });
    return;
  }

  try {
    const fromDb = await loadFromSupabase();
    const updates = fromDb || UPDATES_IOS_FALLBACK;

    sendJson(res, 200, updates, {
      "Cache-Control": "no-store, max-age=0",
      "Access-Control-Allow-Origin": "*",
    });
  } catch (error) {
    console.error("[api/updates]", error);
    sendJson(res, 500, { error: "فشل جلب البيانات" });
  }
}
