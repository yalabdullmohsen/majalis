import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const MAX_TITLE = 500;
const MAX_CONTENT = 8000;
const VALID_TYPES = new Set(["درس", "فائدة", "معلومة", "سؤال لعبة", "فكرة"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const { type, title, content, author = "" } = req.body || {};

  if (!VALID_TYPES.has(type)) {
    sendJson(res, 400, { ok: false, error: "invalid_type", message: "نوع المحتوى غير صالح." });
    return;
  }
  if (!title || typeof title !== "string" || title.trim().length < 3) {
    sendJson(res, 400, { ok: false, error: "invalid_title", message: "العنوان مطلوب (3 أحرف على الأقل)." });
    return;
  }
  if (!content || typeof content !== "string" || content.trim().length < 3) {
    sendJson(res, 400, { ok: false, error: "invalid_content", message: "التفاصيل مطلوبة (3 أحرف على الأقل)." });
    return;
  }
  if (title.length > MAX_TITLE || content.length > MAX_CONTENT) {
    sendJson(res, 400, { ok: false, error: "too_long", message: "العنوان أو التفاصيل أطول مما هو مسموح." });
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, { ok: false, error: "service_unavailable" });
    return;
  }

  const row = {
    type,
    title: title.trim().slice(0, MAX_TITLE),
    content: content.trim().slice(0, MAX_CONTENT),
    author: String(author || "").trim().slice(0, 200),
    status: "pending",
    meta: null,
  };

  const { error } = await admin.from("submissions").insert(row);
  if (error) {
    sendJson(res, 500, { ok: false, error: error.message });
    return;
  }

  sendJson(res, 201, { ok: true, message: "شكراً! تم استلام مقترحك وسيظهر بعد مراجعة الأدمن." });
}
