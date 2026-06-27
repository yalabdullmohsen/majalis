/**
 * In-app admin notifications when automation discovers new drafts.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

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

export async function notifyAdminsNewDrafts({ newCount, sourceName, link = "/admin/review-center" } = {}) {
  if (!newCount || newCount <= 0) return { ok: true, sent: 0 };

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const userIds = await listAdminUserIds(admin);
  if (!userIds.length) return { ok: true, sent: 0, reason: "no_admins" };

  const title =
    newCount === 1
      ? "درس جديد بحاجة للمراجعة"
      : `تم العثور على ${newCount} دروس جديدة بحاجة للمراجعة`;
  const body = sourceName
    ? `المصدر: ${sourceName} — راجع المسودات في مركز المراجعة.`
    : "راجع المسودات في مركز المراجعة.";

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
