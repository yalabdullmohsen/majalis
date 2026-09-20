/**
 * حراسة نشر الفرق الإسلامية — قرارات بشرية إلزامية؛ لا نشر آلي.
 */
import type {
  IslamicSectsHumanReviewDecision,
  IslamicSectsPublicationStatus,
} from "./publication-states";
import {
  canPublishIslamicSectsRecord,
  isIslamicSectsPubliclyVisible,
} from "./publication-states";

/** أعلام تمنع النشر حتى مع APPROVED عام — تحتاج مختصًا شرعيًا صريحًا. */
export const ISLAMIC_SECTS_SHARIA_BLOCKER_FLAGS = [
  "needs_sharia_specialist",
  "collective_takfir_in_app_voice",
  "collective_takfir",
] as const;

export type IslamicSectsHumanDecisionRecord = {
  id: string;
  decision: IslamicSectsHumanReviewDecision;
  reviewer: string;
  reviewedAt: string;
  /** إن وُجد: يسمح بتجاوز حاجز العلم الشرعي الحساس بعد توثيق المختص */
  shariaSpecialistCleared?: boolean;
  notesAr?: string;
};

export type IslamicSectsPublishEvaluationInput = {
  id: string;
  publicationStatus: IslamicSectsPublicationStatus;
  humanDecision: IslamicSectsHumanReviewDecision | null | undefined;
  hasPrimaryOrSecondarySource: boolean;
  licenseStatus?: "unknown" | "ok" | "blocked" | "needs_review";
  shariaReviewStatus?: IslamicSectsPublicationStatus;
  inventoryFlags?: string[];
  shariaSpecialistCleared?: boolean;
};

export type IslamicSectsPublishEvaluation = {
  ok: boolean;
  reasons: string[];
};

export function evaluateIslamicSectsPublishReadiness(
  input: IslamicSectsPublishEvaluationInput,
): IslamicSectsPublishEvaluation {
  const reasons: string[] = [];

  if (!input.hasPrimaryOrSecondarySource) {
    reasons.push("missing_source");
  }
  if (
    input.humanDecision !== "APPROVED" &&
    input.humanDecision !== "APPROVED_WITH_CORRECTION"
  ) {
    reasons.push("missing_or_negative_human_decision");
  }
  if (input.publicationStatus !== "PUBLISHED") {
    reasons.push("publication_status_not_published");
  }
  if (input.licenseStatus === "blocked") {
    reasons.push("blocked_license");
  }
  if (input.shariaReviewStatus === "NEEDS_SHARIA_REVIEW") {
    reasons.push("sharia_review_pending");
  }
  if (input.shariaReviewStatus === "CONFLICTING_SOURCES") {
    reasons.push("conflicting_sources");
  }
  if (input.publicationStatus === "REJECTED") {
    reasons.push("rejected");
  }
  if (input.publicationStatus === "BLOCKED_LICENSE") {
    reasons.push("blocked_license_status");
  }

  const flags = input.inventoryFlags ?? [];
  const hasShariaBlocker = flags.some((f) =>
    (ISLAMIC_SECTS_SHARIA_BLOCKER_FLAGS as readonly string[]).includes(f),
  );
  if (hasShariaBlocker && !input.shariaSpecialistCleared) {
    reasons.push("sharia_specialist_clearance_required");
  }

  // توافق مع العقد الأساسي
  if (
    !canPublishIslamicSectsRecord({
      publicationStatus: input.publicationStatus,
      humanDecision: input.humanDecision,
      hasPrimaryOrSecondarySource: input.hasPrimaryOrSecondarySource,
    })
  ) {
    if (!reasons.includes("missing_source")) {
      /* already covered or status/decision */
    }
  }

  return { ok: reasons.length === 0, reasons };
}

export function resolvePublicationStatusFromHumanDecision(input: {
  overlayStatus: IslamicSectsPublicationStatus;
  decision: IslamicSectsHumanDecisionRecord | null | undefined;
  hasPrimaryOrSecondarySource: boolean;
  licenseStatus?: IslamicSectsPublishEvaluationInput["licenseStatus"];
  shariaReviewStatus?: IslamicSectsPublicationStatus;
  inventoryFlags?: string[];
}): IslamicSectsPublicationStatus {
  // الوكيل/الـoverlay لا يفرض PUBLISHED
  if (input.overlayStatus === "PUBLISHED") {
    throw new Error(
      "overlay must not set PUBLISHED — use human decisions file only",
    );
  }

  if (!input.decision) return input.overlayStatus;
  if (input.decision.decision === "REJECTED") return "REJECTED";
  if (input.decision.decision === "NEEDS_MORE_EVIDENCE") {
    return input.overlayStatus === "DRAFT"
      ? "NEEDS_SOURCE"
      : input.overlayStatus;
  }

  if (
    input.decision.decision === "APPROVED" ||
    input.decision.decision === "APPROVED_WITH_CORRECTION"
  ) {
    const evalResult = evaluateIslamicSectsPublishReadiness({
      id: input.decision.id,
      publicationStatus: "PUBLISHED",
      humanDecision: input.decision.decision,
      hasPrimaryOrSecondarySource: input.hasPrimaryOrSecondarySource,
      licenseStatus: input.licenseStatus,
      shariaReviewStatus: input.shariaReviewStatus,
      inventoryFlags: input.inventoryFlags,
      shariaSpecialistCleared: input.decision.shariaSpecialistCleared,
    });
    if (evalResult.ok) return "PUBLISHED";
    return "HUMAN_REVIEWED";
  }

  return input.overlayStatus;
}

export function assertNoDraftInPublicList(
  statuses: readonly IslamicSectsPublicationStatus[],
): void {
  for (const st of statuses) {
    if (st !== "PUBLISHED" && isIslamicSectsPubliclyVisible(st)) {
      throw new Error(`non-published status marked public: ${st}`);
    }
    if (
      st === "DRAFT" ||
      st === "REJECTED" ||
      st === "BLOCKED_LICENSE" ||
      st === "NEEDS_SOURCE" ||
      st === "NEEDS_SHARIA_REVIEW"
    ) {
      if (isIslamicSectsPubliclyVisible(st)) {
        throw new Error(`forbidden public visibility for ${st}`);
      }
    }
  }
}
