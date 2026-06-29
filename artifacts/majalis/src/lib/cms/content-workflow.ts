import type { CmsContentKind, CmsWorkflowStatus } from "./content-types";
import { validateContentQuality, type QualityReport } from "./content-quality";
import { fetchDedupCandidates } from "./cms-service";
import type { CmsContentRecord } from "./content-types";
import { detectUnifiedDuplicates } from "./unified-dedup";
import type { DedupCandidate } from "./dedup-service";

export type WorkflowStage =
  | "draft"
  | "automated_validation"
  | "duplicate_detection"
  | "ai_classification"
  | "human_review"
  | "published"
  | "rejected"
  | "archived";

export type WorkflowStageResult = {
  stage: WorkflowStage;
  passed: boolean;
  blocking: boolean;
  message?: string;
  details?: Record<string, unknown>;
};

export type WorkflowPipelineResult = {
  ok: boolean;
  finalStatus: CmsWorkflowStatus;
  stages: WorkflowStageResult[];
  quality?: QualityReport;
  requiresHumanReview: boolean;
};

const STAGE_ORDER: WorkflowStage[] = [
  "draft",
  "automated_validation",
  "duplicate_detection",
  "ai_classification",
  "human_review",
  "published",
];

export function workflowStageIndex(stage: WorkflowStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/** Run the unified content workflow pipeline (client-side orchestration). */
export async function runContentWorkflow(
  record: CmsContentRecord,
  options: {
    skipDedup?: boolean;
    autoPublish?: boolean;
    policy?: "strict" | "standard";
    candidates?: DedupCandidate[];
  } = {},
): Promise<WorkflowPipelineResult> {
  const stages: WorkflowStageResult[] = [];
  const policy = options.policy || "standard";

  // Stage 1: Draft (always passes — record exists)
  stages.push({ stage: "draft", passed: true, blocking: false });

  // Stage 2: Automated validation
  const quality = validateContentQuality(record);
  const validationPassed = !quality.blocking;
  stages.push({
    stage: "automated_validation",
    passed: validationPassed,
    blocking: policy === "strict",
    message: validationPassed
      ? "اجتاز التحقق"
      : quality.errors.map((e) => e.message).join(" — ") || "فشل التحقق",
    details: { errors: quality.errors.length, warnings: quality.warnings.length },
  });

  if (!validationPassed && policy === "strict") {
    return {
      ok: false,
      finalStatus: "draft",
      stages,
      quality,
      requiresHumanReview: false,
    };
  }

  // Stage 3: Duplicate detection
  let isDuplicate = false;
  if (!options.skipDedup) {
    const candidates = options.candidates ?? (await fetchDedupCandidates(record.kind));
    const dedup = detectUnifiedDuplicates(record, candidates);
    isDuplicate = dedup.isDuplicate;
    stages.push({
      stage: "duplicate_detection",
      passed: true,
      blocking: false,
      message: isDuplicate
        ? `مكرر (${dedup.matches[0]?.matchType}): ${dedup.matches[0]?.existingId}`
        : "لا تكرار",
      details: { isDuplicate, matchCount: dedup.matches.length },
    });
  } else {
    stages.push({ stage: "duplicate_detection", passed: true, blocking: false, message: "تم تخطي فحص التكرار" });
  }

  // Stage 4: AI classification (best-effort — category inference)
  const inferredCategory = inferCategory(record);
  if (inferredCategory && !record.category) {
    record.category = inferredCategory;
  }
  stages.push({
    stage: "ai_classification",
    passed: true,
    blocking: false,
    message: record.category ? `التصنيف: ${record.category}` : "بدون تصنيف",
    details: { category: record.category },
  });

  // Stage 5: Human review decision
  const requiresHumanReview =
    quality.warnings.length > 0 ||
    (quality.errors.length > 0 && policy === "standard") ||
    record.status === "pending" ||
    record.metadata?.source === "user_contribution";

  stages.push({
    stage: "human_review",
    passed: !requiresHumanReview,
    blocking: requiresHumanReview,
    message: requiresHumanReview ? "يحتاج مراجعة بشرية" : "لا حاجة لمراجعة",
  });

  if (requiresHumanReview && !options.autoPublish) {
    return {
      ok: true,
      finalStatus: "pending",
      stages,
      quality,
      requiresHumanReview: true,
    };
  }

  // Stage 6: Published
  const canPublish = validationPassed || policy === "standard";
  stages.push({
    stage: "published",
    passed: canPublish && (options.autoPublish || !requiresHumanReview),
    blocking: !canPublish,
    message: canPublish ? "جاهز للنشر" : "لا يمكن النشر — فشل التحقق الحرج",
  });

  return {
    ok: canPublish,
    finalStatus: canPublish && options.autoPublish ? "published" : requiresHumanReview ? "pending" : "approved",
    stages,
    quality,
    requiresHumanReview,
  };
}

function inferCategory(record: CmsContentRecord): string | undefined {
  if (record.category) return record.category;
  const text = `${record.title} ${record.summary || ""} ${record.body || ""}`.toLowerCase();
  if (/قرآن|تجويد|حفظ/.test(text)) return "قرآن";
  if (/فقه|أحكام/.test(text)) return "فقه";
  if (/حديث|سنة/.test(text)) return "حديث";
  if (/عقيدة|توحيد/.test(text)) return "عقيدة";
  if (/سيرة|تاريخ/.test(text)) return "سيرة";
  return undefined;
}

export function statusToWorkflowStage(status: CmsWorkflowStatus): WorkflowStage {
  switch (status) {
    case "draft":
      return "draft";
    case "pending":
      return "human_review";
    case "approved":
    case "published":
      return "published";
    case "archived":
      return "archived";
    case "rejected":
      return "rejected";
    default:
      return "draft";
  }
}

export const WORKFLOW_STAGE_LABELS: Record<WorkflowStage, string> = {
  draft: "مسودة",
  automated_validation: "تحقق آلي",
  duplicate_detection: "كشف التكرار",
  ai_classification: "تصنيف ذكي",
  human_review: "مراجعة بشرية",
  published: "منشور",
  rejected: "مرفوض",
  archived: "مؤرشف",
};
