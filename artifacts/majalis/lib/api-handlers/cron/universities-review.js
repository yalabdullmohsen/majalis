/**
 * Cron: مراجعة الجامعات الأسبوعية
 * ينشئ تذكيرات للمراجعة البشرية — لا يُحدّث أي بيانات تلقائياً
 *
 * يشغَّل كل يوم اثنين (0 2 * * 1) — الساعة 2 صباحاً UTC
 */
import { sendJson } from "../../api/_http.mjs";
import { getSupabaseAdmin, isMissingTableError } from "../../../lib/supabase-admin.mjs";

const SIX_MONTHS_AGO_DAYS = 180;
const DEADLINE_SOON_DAYS   = 30;

export default async function universitiesReviewCron(req, res) {
  // تحقق من التوثيق
  const authHeader = req.headers?.authorization || "";
  if (!authHeader.startsWith("Bearer ") || authHeader.slice(7) !== process.env.CRON_SECRET) {
    return sendJson(res, 401, { error: "unauthorized" });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 500, { error: "no supabase admin" });

  const report = { created: 0, errors: [] };

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - SIX_MONTHS_AGO_DAYS);

    // ── 1: جامعات لم تُحدَّث منذ أكثر من 6 أشهر ─────────────────────────
    const { data: staleUnivs, error: staleErr } = await admin
      .from("universities")
      .select("id, name_ar, last_updated_at")
      .lt("last_updated_at", sixMonthsAgo.toISOString())
      .eq("is_published", true);

    if (staleErr && !isMissingTableError(staleErr)) {
      report.errors.push(`stale_query: ${staleErr.message}`);
    }

    for (const u of staleUnivs || []) {
      // تحقق من وجود تذكير معلّق مسبق لنفس الجامعة
      const { data: existing } = await admin
        .from("review_reminders")
        .select("id")
        .eq("university_id", u.id)
        .eq("reminder_type", "annual_check")
        .eq("status", "pending")
        .maybeSingle();

      if (!existing) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        const { error } = await admin
          .from("review_reminders")
          .insert({
            university_id: u.id,
            reminder_type: "annual_check",
            due_date: dueDate.toISOString().split("T")[0],
            status: "pending",
            notes: `آخر تحديث: ${new Date(u.last_updated_at).toLocaleDateString("ar-SA")}`,
          });
        if (!error) report.created++;
        else report.errors.push(`insert_stale_${u.id}: ${error.message}`);
      }
    }

    // ── 2: برامج تقترب مواعيد تقديمها (خلال 30 يوماً) ───────────────────
    // نجلب شروط القبول التي تحتوي على application_deadline وننبّه المراجع
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + DEADLINE_SOON_DAYS);

    const { data: programs, error: progErr } = await admin
      .from("university_programs")
      .select(`id, program_name, university_id, admission_requirements(application_deadline)`)
      .eq("is_active", true);

    if (progErr && !isMissingTableError(progErr)) {
      report.errors.push(`prog_query: ${progErr.message}`);
    }

    for (const prog of programs || []) {
      const deadline = prog.admission_requirements?.[0]?.application_deadline;
      if (!deadline) continue;

      // نحاول تحويل الموعد لتاريخ إذا كان قابلاً للتحليل
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) continue;

      const today = new Date();
      const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= DEADLINE_SOON_DAYS) {
        const { data: existing } = await admin
          .from("review_reminders")
          .select("id")
          .eq("program_id", prog.id)
          .eq("reminder_type", "deadline_approaching")
          .eq("status", "pending")
          .maybeSingle();

        if (!existing) {
          const { error } = await admin
            .from("review_reminders")
            .insert({
              university_id: prog.university_id,
              program_id: prog.id,
              reminder_type: "deadline_approaching",
              due_date: deadlineDate.toISOString().split("T")[0],
              status: "pending",
              notes: `موعد التقديم لبرنامج "${prog.program_name}" يقترب (${diffDays} يوماً)`,
            });
          if (!error) report.created++;
          else report.errors.push(`insert_deadline_${prog.id}: ${error.message}`);
        }
      }
    }

    sendJson(res, 200, {
      ok: true,
      reminders_created: report.created,
      errors: report.errors,
    });
  } catch (e) {
    sendJson(res, 500, { error: String(e?.message || e) });
  }
}
