/**
 * In-app + Telegram admin notifications when automation discovers new drafts.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { sendMessage } from "../telegram/bot.mjs";

async function listAdminUserIds(admin) {
  try {
    const { data: profiles } = await admin.from("profiles").select("id").eq("is_admin", true);
    if (profiles?.length) return profiles.map((p) => p.id);
  } catch {
    /* fallback */
  }
  try {
    const { data: roles } = await admin.from("profiles").select("id").in("role", ["admin", "editor"]);
    if (roles?.length) return roles.map((p) => p.id);
  } catch {
    /* fallback */
  }
  return [];
}

async function notifyAdminViaTelegram({ newCount, sourceName, link }) {
  const chatId = String(process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();
  if (!chatId) return; // لم يُهيَّأ بعد — تخطَّ بصمت

  const headline =
    newCount === 1
      ? "📚 درس جديد تلقائي بانتظار مراجعتك"
      : `📚 ${newCount} دروس جديدة تلقائياً بانتظار مراجعتك`;
  const sourceText = sourceName ? `\nالمصدر: <b>${sourceName}</b>` : "";
  const text = `${headline}${sourceText}\n\n🔗 <a href="https://www.majlisilm.com${link}">فتح مركز المراجعة</a>`;

  try {
    await sendMessage(chatId, text, { parse_mode: "HTML", disable_web_page_preview: true });
  } catch {
    /* Telegram best-effort — لا توقف التدفق الرئيسي */
  }
}

export async function notifyAdminsNewDrafts({ newCount, sourceName, link = "/admin/review-center" } = {}) {
  if (!newCount || newCount <= 0) return { ok: true, sent: 0 };

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const userIds = await listAdminUserIds(admin);

  const title =
    newCount === 1
      ? "درس جديد بحاجة للمراجعة"
      : `تم العثور على ${newCount} دروس جديدة بحاجة للمراجعة`;
  const body = sourceName
    ? `المصدر: ${sourceName} — راجع المسودات في مركز المراجعة.`
    : "راجع المسودات في مركز المراجعة.";

  // إشعار داخلي لكل مشرف
  let sent = 0;
  for (const userId of userIds) {
    try {
      await admin.from("notifications").insert({
        user_id: userId,
        title,
        body,
        type: "system",
        link,
        is_read: false,
      });
      sent += 1;
    } catch {
      /* continue */
    }
  }

  // إشعار Telegram (best-effort — لا يوقف العملية)
  await notifyAdminViaTelegram({ newCount, sourceName, link });

  return { ok: true, sent };
}

export async function countPendingAutomationDrafts() {
  const admin = getSupabaseAdmin();
  if (!admin) return 0;
  const { count } = await admin
    .from("lesson_import_drafts")
    .select("id", { count: "exact", head: true })
    .eq("automation_status", "pending_review")
    .neq("status", "rejected");
  return count || 0;
}
