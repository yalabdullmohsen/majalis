import { supabase } from "@/lib/supabase";
import { logSupabaseError } from "@/lib/supabase-config";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import type { CmsContentKind } from "./content-types";
import { runContentWorkflow } from "./content-workflow";
import { normalizeImportRow } from "./normalize";
import { pushCmsNotification } from "./cms-notifications";

export type ContributionType =
  | "research"
  | "lesson"
  | "circle_announcement"
  | "course_announcement"
  | "book"
  | "text"
  | "fawaid"
  | "question_suggestion"
  | "correction";

export type ContributionInput = {
  type: ContributionType;
  title: string;
  body?: string;
  authorName?: string;
  authorEmail?: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
};

export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string> = {
  research: "بحث علمي",
  lesson: "درس",
  circle_announcement: "إعلان حلقة",
  course_announcement: "إعلان دورة",
  book: "كتاب",
  text: "متن",
  fawaid: "فائدة",
  question_suggestion: "اقتراح سؤال",
  correction: "تصحيح معلومة",
};

const CONTRIBUTION_TO_KIND: Partial<Record<ContributionType, CmsContentKind>> = {
  research: "article",
  lesson: "lesson",
  circle_announcement: "announcement",
  course_announcement: "course",
  book: "book",
  text: "article",
  fawaid: "fawaid",
  question_suggestion: "qa",
  correction: "announcement",
};

export async function submitContribution(
  userId: string | undefined,
  input: ContributionInput,
): Promise<{ ok: boolean; draftId?: string; error?: string; requiresReview: boolean }> {
  if (!input.title?.trim()) {
    return { ok: false, error: "العنوان مطلوب", requiresReview: false };
  }

  const kind = CONTRIBUTION_TO_KIND[input.type] || "announcement";
  const record = normalizeImportRow(kind, {
    title: input.title,
    body: input.body,
    text: input.body,
    question: input.type === "question_suggestion" ? input.title : undefined,
    answer: input.body,
    author_name: input.authorName,
    source_url: input.sourceUrl,
    ...input.metadata,
  });
  record.metadata = { ...record.metadata, source: "user_contribution", contribution_type: input.type };
  record.status = "pending";

  const workflow = await runContentWorkflow(record, { policy: "standard" });

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      draftId: `local-${Date.now()}`,
      requiresReview: true,
    };
  }

  const extractedData = {
    title: input.title,
    body: input.body,
    author_name: input.authorName,
    author_email: input.authorEmail,
    source_url: input.sourceUrl,
    contribution_type: input.type,
    ...input.metadata,
  };

  const { data, error } = await supabase
    .from("content_drafts")
    .insert({
      content_kind: kind,
      source_type: "manual",
      source_url: input.sourceUrl || null,
      extracted_data: extractedData,
      validation_errors: workflow.quality?.errors || [],
      validation_warnings: workflow.quality?.warnings || [],
      workflow_status: "pending",
      created_by: userId || null,
      metadata: {
        contribution_type: input.type,
        workflow_stages: workflow.stages,
        quality_score: workflow.quality?.score,
      },
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseError("submitContribution", error);
    return { ok: false, error: error.message, requiresReview: false };
  }

  await pushCmsNotification({
    type: "new_content",
    title: "مساهمة مستخدم جديدة",
    message: `${CONTRIBUTION_TYPE_LABELS[input.type]}: ${input.title.slice(0, 60)}`,
    content_kind: kind,
    record_id: String(data.id),
    metadata: { contribution_type: input.type },
  });

  await pushCmsNotification({
    type: "review_needed",
    title: "مساهمة تحتاج مراجعة",
    message: input.title.slice(0, 80),
    content_kind: kind,
    record_id: String(data.id),
  });

  return {
    ok: true,
    draftId: String(data.id),
    requiresReview: true,
  };
}

export async function listPendingContributions(limit = 50) {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from("content_drafts")
    .select("id, content_kind, source_type, extracted_data, workflow_status, created_at, metadata")
    .eq("workflow_status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError("listPendingContributions", error);
    return [];
  }

  return (data || []).filter(
    (d) =>
      d.metadata?.contribution_type ||
      d.metadata?.source === "user_contribution" ||
      (d.extracted_data as Record<string, unknown>)?.contribution_type,
  );
}
