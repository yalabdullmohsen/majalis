/**
 * recitation-session-service.ts
 * حفظ نتائج جلسة تسميع في recitation_sessions/recitation_errors
 * (supabase/quran_recitation_ai_test_v1.sql). لا صوت يُخزَّن هنا إطلاقًا
 * — فقط نصوص مطبَّعة لأغراض التقرير (القسم 9، القسم 12).
 */
import { supabase } from "@/lib/supabase";
import type { AlignmentEvent, AlertLevel, PrecisionLevel, RecitationMode } from "./types";

export type SessionRangeInput = {
  rangeType: "surah" | "ayah_range" | "page" | "juz" | "hizb" | "rub";
  surahNumber?: number;
  ayahFrom?: number;
  ayahTo?: number;
  pageNumber?: number;
  juzNumber?: number;
  /** يحتاج supabase/quran_recitation_ai_test_v3_hizb_rub_columns.sql (لم يُطبَّق تلقائيًا — راجع تعليق الملف). */
  hizbNumber?: number;
  rubNumber?: number;
};

export type SessionSummaryInput = {
  range: SessionRangeInput;
  mode: RecitationMode;
  precisionLevel: PrecisionLevel;
  providerId: string;
  alertLevel: AlertLevel;
  durationSeconds: number;
  versesCount: number;
  wordsTotal: number;
  wordsCorrect: number;
  hintsUsed: number;
  confidencePct: number;
};

export async function saveRecitationSession(userId: string, input: SessionSummaryInput, events: AlignmentEvent[]): Promise<string | null> {
  const accuracyPct = input.wordsTotal > 0 ? Math.round((input.wordsCorrect / input.wordsTotal) * 1000) / 10 : 0;

  const { data: session, error } = await supabase
    .from("recitation_sessions")
    .insert({
      user_id: userId,
      range_type: input.range.rangeType,
      surah_number: input.range.surahNumber ?? null,
      ayah_from: input.range.ayahFrom ?? null,
      ayah_to: input.range.ayahTo ?? null,
      page_number: input.range.pageNumber ?? null,
      juz_number: input.range.juzNumber ?? null,
      // ⚠️ hizb_number/rub_number يُدرَجان **فقط عند الحاجة الفعلية** (لا
      // ?? null دومًا كالحقول أعلاه) — هذان العمودان يحتاجان
      // quran_recitation_ai_test_v3_hizb_rub_columns.sql (لم يُطبَّق
      // تلقائيًا بعد). لو أُدرِجا دومًا كباقي الحقول، كان سيفشل حفظ **كل**
      // جلسة (سورة/نطاق آيات/صفحة/جزء أيضًا لا وضعَي الحزب/الربع فقط)
      // بمجرد وجود مفتاح لعمود غير موجود بعد في الجدول الحيّ.
      ...(input.range.hizbNumber !== undefined ? { hizb_number: input.range.hizbNumber } : {}),
      ...(input.range.rubNumber !== undefined ? { rub_number: input.range.rubNumber } : {}),
      mode: input.mode,
      precision_level: input.precisionLevel,
      provider_id: input.providerId,
      alert_level: input.alertLevel,
      duration_seconds: input.durationSeconds,
      verses_count: input.versesCount,
      words_total: input.wordsTotal,
      words_correct: input.wordsCorrect,
      accuracy_pct: accuracyPct,
      confidence_pct: input.confidencePct,
      hints_used: input.hintsUsed,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !session) {
    // فشل صامت سابقًا (بلا أي أثر) — خطر حقيقي: مثال فعلي هو قيد CHECK
    // على عمود mode لا يشمل 'freeform' بعد (راجع
    // supabase/quran_recitation_ai_test_v2_freeform_mode.sql) قد يرفض
    // الحفظ بصمت فيبدو للمستخدم أن كل شيء تم بنجاح رغم ضياع النتيجة
    // فعليًا. سجل تشخيصي على الأقل — لا يُغيِّر سلوك الواجهة (لا تزال
    // تُكمِل الجلسة بصدق دون افتراض نجاح لم يحدث، القسم 12).
    console.error("recitation-ai: فشل حفظ الجلسة في قاعدة البيانات", error);
    return null;
  }

  const errorRows = events
    .filter((e): e is Extract<AlignmentEvent, { kind: "error" }> => e.kind === "error")
    .map((e) => ({
      session_id: session.id,
      ayah_key: e.ref ? `${e.ref.surah}:${e.ref.ayah}` : "unknown",
      word_index: e.ref?.wordIndex ?? -1,
      error_type: e.errorType,
      expected_norm: e.ref?.normalized ?? null,
      heard_norm: e.heardWord ?? null,
      confidence_pct: e.confidence,
      is_tajweed: false,
      tajweed_rule: null,
    }));

  if (errorRows.length > 0) {
    await supabase.from("recitation_errors").insert(errorRows);
  }

  return session.id as string;
}

export async function getRecentRecitationSessions(userId: string, limit = 10) {
  const { data } = await supabase
    .from("recitation_sessions")
    .select("id,surah_number,ayah_from,ayah_to,mode,precision_level,accuracy_pct,verses_count,started_at,completed_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/**
 * حذف حقيقي (لا صوري) لكل جلسات وأخطاء التسميع الخاصة بالمستخدم — يُستدعى
 * من شاشة الخصوصية (القسم 12: "حذف بيانات فعلي"). recitation_errors تُحذَف
 * تلقائيًا (ON DELETE CASCADE على session_id، راجع quran_recitation_ai_test_v1.sql)
 * فلا حاجة لحذفها صراحة هنا. لا يمس أي صوت — لا صوت يُخزَّن أصلًا في هذا
 * الجدول (راجع تعليق أعلى الملف).
 */
export async function deleteAllRecitationSessions(userId: string): Promise<boolean> {
  const { error } = await supabase.from("recitation_sessions").delete().eq("user_id", userId);
  return !error;
}
