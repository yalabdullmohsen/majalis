/**
 * كرون يومي لفهرسة بيانات وصفية من مصادر مفعّلة فقط.
 * لا ينزّل ملفات محمية، ولا يتجاوز robots، ولا يدّعي جلبًا حيًا لمصادر غير مختبرة.
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const ranAt = new Date().toISOString();
  const report = {
    ranAt,
    discovered: 0,
    accepted: 0,
    duplicates: 0,
    rejected: 0,
    needsReview: 0,
    failedSources: [],
    notes: [],
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    report.notes.push("Supabase غير مهيأ — لم يُنفَّذ جلب.");
    sendJson(res, 200, { ok: true, report });
    return;
  }

  // قفل تشغيل متزامن بسيط عبر جدول import_jobs إن وُجد
  const { data: running } = await supabase
    .from("import_jobs")
    .select("id")
    .eq("status", "running")
    .limit(1)
    .maybeSingle();

  if (running?.id) {
    report.notes.push("تخطي: مهمة استيراد قيد التشغيل.");
    sendJson(res, 200, { ok: true, report, skipped: true });
    return;
  }

  const { data: sources, error: srcErr } = await supabase
    .from("import_sources")
    .select("id,name,active,metadata_only,base_url")
    .eq("active", true);

  if (srcErr) {
    report.notes.push(`تعذّر قراءة المصادر: ${srcErr.message}`);
    sendJson(res, 200, { ok: true, report });
    return;
  }

  if (!sources?.length) {
    report.notes.push("لا مصادر نشطة. فعّل مصدرًا مصرّحًا بعد التحقق من شروط الاستخدام واختبار الـ API.");
  } else {
    for (const src of sources) {
      // لا جلب حي غير مختبر — نسجّل فشلًا صريحًا بدل اختراع نتائج
      report.failedSources.push(src.id);
      report.notes.push(
        `المصدر «${src.name}» مفعّل لكن موصل الجلب الحي غير مفعّل بعد الاختبار القانوني/التقني. metadata_only=${src.metadata_only !== false}`,
      );
      await supabase.from("import_sources").update({ last_run_at: ranAt, last_result: "skipped_untested_connector" }).eq("id", src.id);
    }
  }

  const { data: job } = await supabase
    .from("import_jobs")
    .insert({ status: "completed", started_at: ranAt, finished_at: new Date().toISOString(), report })
    .select("id")
    .maybeSingle();

  if (job?.id) {
    await supabase.from("import_logs").insert({
      job_id: job.id,
      level: "info",
      message: report.notes.join(" | ") || "completed",
    });
  }

  sendJson(res, 200, { ok: true, report });
}
