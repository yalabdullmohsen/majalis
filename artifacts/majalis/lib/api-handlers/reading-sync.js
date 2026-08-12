/**
 * POST /api/reading-sync — accept daily reading progress for soft remote sync.
 * Persists only when a Supabase table is available; otherwise 503 (not a fake 200).
 */
import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin, isMissingTableError } from "../../lib/supabase-admin.mjs";

function isValidPayload(body) {
  if (!body || typeof body !== "object") return false;
  if (body.type !== "daily-reading") return false;
  if (!Array.isArray(body.entries)) return false;
  return true;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, service: "reading-sync", write: "POST" });
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (!isValidPayload(body)) {
    sendJson(res, 400, { ok: false, error: "invalid_payload", message: "نوع الحمولة غير صالح." });
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, { ok: false, error: "reading_sync_unavailable", message: "المزامنة غير متاحة حاليًا." });
    return;
  }

  const row = {
    payload: body,
    entry_count: body.entries.length,
    synced_at: new Date().toISOString(),
  };

  try {
    const { error } = await admin.from("reading_sync_events").insert(row);
    if (error) {
      if (isMissingTableError(error)) {
        sendJson(res, 503, {
          ok: false,
          error: "reading_sync_schema_missing",
          message: "جدول المزامنة غير مُعدّ.",
        });
        return;
      }
      throw error;
    }
    sendJson(res, 200, { ok: true, persisted: true, entryCount: body.entries.length });
  } catch (err) {
    console.error("[reading-sync] persist failed", err);
    sendJson(res, 503, { ok: false, error: "reading_sync_failed", message: "تعذر حفظ المزامنة." });
  }
}
