/**
 * Unified content lifecycle states — maps runtime status to DB-safe values.
 */

export const LIFECYCLE = {
  DRAFT: "draft",
  QUEUED: "queued",
  PROCESSING: "processing",
  PUBLISHED: "published",
  UPDATED: "updated",
  CANCELLED: "cancelled",
  FAILED: "failed",
  ARCHIVED: "archived",
};

/** Valid transitions between lifecycle states */
export const LIFECYCLE_TRANSITIONS = {
  [LIFECYCLE.DRAFT]: [LIFECYCLE.QUEUED, LIFECYCLE.PROCESSING, LIFECYCLE.ARCHIVED],
  [LIFECYCLE.QUEUED]: [LIFECYCLE.PROCESSING, LIFECYCLE.FAILED, LIFECYCLE.CANCELLED],
  [LIFECYCLE.PROCESSING]: [LIFECYCLE.PUBLISHED, LIFECYCLE.UPDATED, LIFECYCLE.FAILED, LIFECYCLE.CANCELLED],
  [LIFECYCLE.PUBLISHED]: [LIFECYCLE.UPDATED, LIFECYCLE.ARCHIVED, LIFECYCLE.CANCELLED],
  [LIFECYCLE.UPDATED]: [LIFECYCLE.PUBLISHED, LIFECYCLE.ARCHIVED, LIFECYCLE.CANCELLED],
  [LIFECYCLE.FAILED]: [LIFECYCLE.QUEUED, LIFECYCLE.ARCHIVED],
  [LIFECYCLE.CANCELLED]: [LIFECYCLE.ARCHIVED],
  [LIFECYCLE.ARCHIVED]: [],
};

export function canTransition(from, to) {
  const allowed = LIFECYCLE_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

/** Map lifecycle to knowledge_items columns (DB-safe) */
export function toKnowledgeItemState(lifecycle) {
  switch (lifecycle) {
    case LIFECYCLE.DRAFT:
      return { publish_status: "pending", pipeline_stage: "collected", lifecycle_status: "active" };
    case LIFECYCLE.QUEUED:
      return { publish_status: "pending", pipeline_stage: "verified", lifecycle_status: "active" };
    case LIFECYCLE.PROCESSING:
      return { publish_status: "pending", pipeline_stage: "analyzed", lifecycle_status: "active" };
    case LIFECYCLE.PUBLISHED:
      return { publish_status: "published", pipeline_stage: "published", lifecycle_status: "active" };
    case LIFECYCLE.UPDATED:
      return { publish_status: "published", pipeline_stage: "published", lifecycle_status: "active" };
    case LIFECYCLE.CANCELLED:
      return { publish_status: "archived", pipeline_stage: "rejected", lifecycle_status: "cancelled" };
    case LIFECYCLE.FAILED:
      return { publish_status: "rejected", pipeline_stage: "rejected", lifecycle_status: "active" };
    case LIFECYCLE.ARCHIVED:
      return { publish_status: "archived", pipeline_stage: "rejected", lifecycle_status: "archived" };
    default:
      return { publish_status: "pending", pipeline_stage: "collected", lifecycle_status: "active" };
  }
}

/** Map lifecycle to lessons.status (enum-safe) */
export function toLessonStatus(lifecycle) {
  switch (lifecycle) {
    case LIFECYCLE.PUBLISHED:
    case LIFECYCLE.UPDATED:
      return "approved";
    case LIFECYCLE.CANCELLED:
    case LIFECYCLE.FAILED:
    case LIFECYCLE.ARCHIVED:
      return "rejected";
    default:
      return "pending";
  }
}

export function lifecycleFromChangeType(changeType) {
  if (changeType === "cancelled") return LIFECYCLE.CANCELLED;
  if (changeType === "updated") return LIFECYCLE.UPDATED;
  if (changeType === "created") return LIFECYCLE.PUBLISHED;
  return LIFECYCLE.PROCESSING;
}
