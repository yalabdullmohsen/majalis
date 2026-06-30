import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, { ok: false, error: "supabase_admin_not_configured" });
    return;
  }

  if (req.method === "GET") {
    const status = req.query?.status || "pending";
    const { data, error } = await admin
      .from("submissions")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: true });

    if (error) {
      sendJson(res, 500, { ok: false, error: error.message });
      return;
    }
    sendJson(res, 200, { ok: true, data: data || [] });
    return;
  }

  if (req.method === "POST") {
    const { id, action } = req.body || {};
    if (!id || !["approve", "reject"].includes(action)) {
      sendJson(res, 400, { ok: false, error: "bad_request", message: "مطلوب id وaction (approve أو reject)." });
      return;
    }

    const { data: rows, error: fetchErr } = await admin
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !rows) {
      sendJson(res, 404, { ok: false, error: "not_found" });
      return;
    }

    const submission = rows;

    if (action === "reject") {
      const { error } = await admin.from("submissions").update({ status: "rejected" }).eq("id", id);
      if (error) { sendJson(res, 500, { ok: false, error: error.message }); return; }
      sendJson(res, 200, { ok: true, message: "تم رفض الإضافة." });
      return;
    }

    // approve — publish to the relevant table
    let publishError = null;

    if (submission.type === "question") {
      const section = submission.meta?.section || "العقيدة";
      const level = submission.meta?.level || "intermediate";
      const { error } = await admin.from("quiz_questions").insert({
        section,
        level,
        question: submission.title,
        answer: submission.content,
        status: "published",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      publishError = error;
    } else if (submission.type === "lesson") {
      const { error } = await admin.from("lessons").insert({
        title: submission.title,
        description: submission.content,
        status: "approved",
        activity_type: "درس",
        speaker_name: submission.author || "مجتمع المنصة",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      publishError = error;
    }

    if (publishError) {
      sendJson(res, 500, { ok: false, error: publishError.message, message: "فشل نشر المحتوى." });
      return;
    }

    const { error: statusErr } = await admin.from("submissions").update({ status: "approved" }).eq("id", id);
    if (statusErr) {
      sendJson(res, 500, { ok: false, error: statusErr.message });
      return;
    }

    sendJson(res, 200, { ok: true, message: "تمت الموافقة ونُشر المحتوى." });
    return;
  }

  sendJson(res, 405, { ok: false, error: "method_not_allowed" });
}
