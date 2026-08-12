/** خدمة رفع ومراجعة محتوى المستخدمين عبر Supabase.
 * رفع الأذان أُلغي نهائيًا (2026-08) — يبقى النوع في القراءة فقط للسجلات التاريخية.
 */

import { supabase } from "@/lib/supabase";

/** "adhan" تاريخي فقط — لا إنشاء طلبات جديدة من هذا النوع. */
export type SubmissionType = "adhan" | "lesson";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export type UserSubmission = {
  id: string;
  type: SubmissionType;
  submitter_name: string;
  submitter_email?: string;
  user_id?: string;
  title: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_size_kb?: number;
  file_mime?: string;
  meta: Record<string, unknown>;
  status: SubmissionStatus;
  reviewer_note?: string;
  reviewed_at?: string;
  created_at: string;
};

export type LessonMeta = {
  sheikh: string;
  duration_min?: number;
  topic: string;
  source_url?: string;
};

const BUCKET = "user-submissions";

// ── رفع ملف إلى Supabase Storage ──────────────────────────────────────
async function uploadFile(file: File, folder: "lessons"): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(`رفع الملف فشل: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ── رفع درس ───────────────────────────────────────────────────────────
export async function submitLesson(params: {
  file?: File;
  title: string;
  description: string;
  submitterName: string;
  submitterEmail?: string;
  meta: LessonMeta;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let fileSizeKb: number | undefined;
    let fileMime: string | undefined;

    if (params.file) {
      fileUrl    = await uploadFile(params.file, "lessons");
      fileName   = params.file.name;
      fileSizeKb = Math.round(params.file.size / 1024);
      fileMime   = params.file.type;
    }

    const { data, error } = await supabase
      .from("user_submissions")
      .insert({
        type:            "lesson",
        title:           params.title,
        description:     params.description,
        submitter_name:  params.submitterName,
        submitter_email: params.submitterEmail ?? null,
        file_url:        fileUrl ?? null,
        file_name:       fileName ?? null,
        file_size_kb:    fileSizeKb ?? null,
        file_mime:       fileMime ?? null,
        meta:            params.meta,
        status:          "pending",
      })
      .select("id")
      .single();

    if (error) throw error;
    return { ok: true, id: data?.id };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return { ok: false, error: msg };
  }
}

// ── Admin: قائمة الطلبات ───────────────────────────────────────────────
export async function listSubmissions(opts?: {
  status?: SubmissionStatus | "all";
  type?: SubmissionType | "all";
  limit?: number;
}): Promise<UserSubmission[]> {
  let q = supabase
    .from("user_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status);
  if (opts?.type   && opts.type   !== "all") q = q.eq("type",   opts.type);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as UserSubmission[];
}

// ── Admin: قبول أو رفض ────────────────────────────────────────────────
export async function reviewSubmission(
  id: string,
  status: "approved" | "rejected",
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("user_submissions")
    .update({
      status,
      reviewer_note: note ?? null,
      reviewed_at:   new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Admin: نشر درس مقبول كمسودة في جدول lessons ─────────────────────
export async function publishLessonAsDraft(
  sub: UserSubmission,
): Promise<{ ok: boolean; error?: string }> {
  if (sub.type !== "lesson" || sub.status !== "approved") {
    return { ok: false, error: "يجب أن يكون الطلب درساً مقبولاً" };
  }
  const meta = sub.meta as Record<string, string | number | undefined>;

  const { error } = await supabase
    .from("lessons")
    .insert({
      title:        sub.title,
      description:  sub.description ?? "",
      speaker_name: String(meta.sheikh ?? sub.submitter_name),
      duration:     meta.duration_min ? `${meta.duration_min} دقيقة` : null,
      category:     String(meta.topic ?? "أخرى"),
      source_url:   meta.source_url ? String(meta.source_url) : null,
      media_url:    sub.file_url ?? null,
      status:       "draft",
      source:       "community",
      submitted_by: sub.submitter_name,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await supabase
    .from("user_submissions")
    .update({ meta: { ...meta, lesson_drafted: true } })
    .eq("id", sub.id);

  return { ok: true };
}

// ── إحصائيات الطلبات للأدمن ───────────────────────────────────────────
export type SubmissionStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  lesson: number;
  /** سجلات تاريخية فقط — ميزة الرفع ملغاة. */
  adhanLegacy: number;
};

export async function getSubmissionStats(): Promise<SubmissionStats> {
  const { data } = await supabase
    .from("user_submissions")
    .select("status,type");

  const rows = (data ?? []) as { status: string; type: string }[];
  return {
    total:    rows.length,
    pending:  rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    lesson:   rows.filter((r) => r.type === "lesson").length,
    adhanLegacy: rows.filter((r) => r.type === "adhan").length,
  };
}

// ── تنسيق حجم الملف ───────────────────────────────────────────────────
export function formatFileSize(kb?: number): string {
  if (!kb) return "—";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
