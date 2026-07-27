import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const MAX_TITLE = 500;
const MAX_ABSTRACT = 12000;

/**
 * استلام طلب إضافة بحث — لا يُنشر مباشرة.
 * إن وُجدت جداول researches_v1 يُحفظ في research_submissions، وإلا يُرفض بوضوح.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const body = req.body || {};
  const title = String(body.title || "").trim();
  const abstract = String(body.abstract || "").trim();
  const authorName = String(body.authorName || "").trim();
  const authorEmail = String(body.authorEmail || "").trim();
  const kind = String(body.kind || "").trim();
  const acceptTerms = !!body.acceptTerms;
  const attestOwnership = !!body.attestOwnership;

  if (!acceptTerms || !attestOwnership) {
    sendJson(res, 400, { ok: false, error: "terms_required", message: "الموافقة والإقرار مطلوبان." });
    return;
  }
  if (title.length < 5 || title.length > MAX_TITLE) {
    sendJson(res, 400, { ok: false, error: "invalid_title" });
    return;
  }
  if (abstract.length < 40 || abstract.length > MAX_ABSTRACT) {
    sendJson(res, 400, { ok: false, error: "invalid_abstract" });
    return;
  }
  if (!authorName || !authorEmail.includes("@")) {
    sendJson(res, 400, { ok: false, error: "invalid_author" });
    return;
  }

  const isPersonal = kind === "personal_research";
  const status = isPersonal ? "awaiting_review" : "auto_screening";

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, {
      ok: false,
      error: "service_unavailable",
      message: "قاعدة البيانات غير مهيأة. يمكن الحفظ المحلي من الواجهة للتطوير.",
    });
    return;
  }

  const row = {
    owner_user_id: null,
    status,
    status_note: isPersonal
      ? "بحث شخصي: لا يُنشر إلا بعد المراجعة العلمية والإدارية."
      : "تم الاستلام — فحص آلي ثم مراجعة.",
    is_personal: isPersonal,
    payload: {
      ...body,
      authorEmail, // يبقى في payload للإدارة — لا يُعرض للعامة
      title,
      abstract,
      authorName,
    },
  };

  const { data, error } = await admin.from("research_submissions").insert(row).select("id,status").maybeSingle();
  if (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message,
      message: "تعذّر الحفظ. تأكد من تطبيق supabase/researches_v1.sql.",
    });
    return;
  }

  sendJson(res, 201, {
    ok: true,
    id: data?.id,
    status: data?.status || status,
    message: "شكراً. لن يُنشر البحث مباشرة وسيُراجع وفق سياسة المنصة.",
  });
}
