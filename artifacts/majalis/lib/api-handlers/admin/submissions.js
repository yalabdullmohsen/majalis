import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { sendMessage } from "../../../lib/telegram/bot.mjs";

async function notifyTelegramNewLesson(title, speaker, lessonId) {
  const chatId = String(process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();
  if (!chatId) return;
  const who = speaker ? `\nالشيخ: <b>${speaker}</b>` : "";
  const text = `📚 درس جديد (قُبل يدوياً)\n<b>${title || "بدون عنوان"}</b>${who}\n\n🔗 <a href="https://www.majlisilm.com/lessons/${lessonId}">عرض الدرس</a>`;
  try { await sendMessage(chatId, text, { parse_mode: "HTML", disable_web_page_preview: true }); }
  catch { /* best-effort */ }
}

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

    if (submission.type === "درس") {
      const { data: lessonRow, error } = await admin.from("lessons").insert({
        title: submission.title,
        description: submission.content,
        status: "approved",
        activity_type: "درس",
        speaker_name: submission.author || "مجتمع المنصة",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select("id, title, speaker_name").single();
      publishError = error;
      if (!error && lessonRow) {
        notifyTelegramNewLesson(lessonRow.title, lessonRow.speaker_name, lessonRow.id).catch(() => {});
      }
    } else if (submission.type === "فائدة") {
      const { error } = await admin.from("fawaid").insert({
        text: `${submission.title}\n${submission.content}`.trim(),
        author_name: submission.author || null,
        status: "approved",
      });
      publishError = error;
    } else if (submission.type === "سؤال لعبة") {
      const { error } = await admin.from("qa_questions").insert({
        question: submission.title,
        answer: submission.content,
        reference: submission.author ? `مُرسَل من: ${submission.author}` : null,
        status: "published",
        review_status: "approved",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      publishError = error;
    }
    // معلومة وفكرة: تبقى في submissions فقط بحالة approved

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
