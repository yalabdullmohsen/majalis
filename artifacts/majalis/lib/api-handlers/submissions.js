import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const MAX_TITLE = 500;
const MAX_CONTENT = 8000;
const VALID_TYPES = new Set(["lesson", "question"]);
const VALID_SECTIONS = new Set(["القرآن", "السيرة", "الفقه", "الأنبياء", "الصحابة", "العقيدة", "الحديث"]);
const VALID_LEVELS = new Set(["beginner", "intermediate", "advanced"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const { type, title, content, author = "", meta = {} } = req.body || {};

  if (!VALID_TYPES.has(type)) {
    sendJson(res, 400, { ok: false, error: "invalid_type", message: "النوع يجب أن يكون 'lesson' أو 'question'." });
    return;
  }
  if (!title || typeof title !== "string" || title.trim().length < 3) {
    sendJson(res, 400, { ok: false, error: "invalid_title", message: "العنوان مطلوب (3 أحرف على الأقل)." });
    return;
  }
  if (!content || typeof content !== "string" || content.trim().length < 3) {
    sendJson(res, 400, { ok: false, error: "invalid_content", message: "المحتوى مطلوب (3 أحرف على الأقل)." });
    return;
  }
  if (title.length > MAX_TITLE || content.length > MAX_CONTENT) {
    sendJson(res, 400, { ok: false, error: "too_long", message: "العنوان أو المحتوى أطول مما هو مسموح." });
    return;
  }

  if (type === "question") {
    if (!VALID_SECTIONS.has(meta?.section)) {
      sendJson(res, 400, { ok: false, error: "invalid_section", message: "اختر قسماً صحيحاً للسؤال." });
      return;
    }
    if (!VALID_LEVELS.has(meta?.level)) {
      sendJson(res, 400, { ok: false, error: "invalid_level", message: "اختر مستوى صحيحاً للسؤال." });
      return;
    }
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
    meta: type === "question" ? { section: meta.section, level: meta.level } : null,
  };

  const { error } = await admin.from("submissions").insert(row);
  if (error) {
    sendJson(res, 500, { ok: false, error: error.message });
    return;
  }

  sendJson(res, 201, { ok: true, message: "شكراً! تم استلام مقترحك وسيظهر بعد مراجعة الأدمن." });
}
