/**
 * Daily research metadata indexing — honest report; no untested live fetches.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

/**
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function runResearchesDailyImport(opts = {}) {
  const { signal } = opts;
  if (signal?.aborted) {
    const err = new Error("aborted");
    err.code = "aborted";
    throw err;
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
    return { ok: true, report };
  }

  const { data: running } = await supabase
    .from("import_jobs")
    .select("id")
    .eq("status", "running")
    .limit(1)
    .maybeSingle();

  if (running?.id) {
    report.notes.push("تخطي: مهمة استيراد قيد التشغيل.");
    return { ok: true, report, skipped: true };
  }

  const { data: sources, error: srcErr } = await supabase
    .from("import_sources")
    .select("id,name,active,metadata_only,base_url")
    .eq("active", true);

  if (srcErr) {
    report.notes.push(`تعذّر قراءة المصادر: ${srcErr.message}`);
    return { ok: true, report };
  }

  if (!sources?.length) {
    report.notes.push(
      "لا مصادر نشطة. فعّل مصدرًا مصرّحًا بعد التحقق من شروط الاستخدام واختبار الـ API.",
    );
  } else {
    for (const src of sources) {
      if (signal?.aborted) break;
      report.failedSources.push(src.id);
      report.notes.push(
        `المصدر «${src.name}» مفعّل لكن موصل الجلب الحي غير مفعّل بعد الاختبار القانوني/التقني. metadata_only=${src.metadata_only !== false}`,
      );
      await supabase
        .from("import_sources")
        .update({ last_run_at: ranAt, last_result: "skipped_untested_connector" })
        .eq("id", src.id);
    }
  }

  if (signal?.aborted) {
    const err = new Error("aborted");
    err.code = "aborted";
    throw err;
  }

  const { data: job } = await supabase
    .from("import_jobs")
    .insert({
      status: "completed",
      started_at: ranAt,
      finished_at: new Date().toISOString(),
      report,
    })
    .select("id")
    .maybeSingle();

  if (job?.id) {
    await supabase.from("import_logs").insert({
      job_id: job.id,
      level: "info",
      message: report.notes.join(" | ") || "completed",
    });
  }

  return { ok: true, report };
}
