/**
 * Enterprise Governance — scientific review workflow before publish.
 */

import crypto from "node:crypto";
import { REVIEW_CHECKS } from "./config.mjs";
import { runReviewGate, checkLink } from "../scholarly-verification/review-gate.mjs";
import { canPerformAction, resolveRole } from "./rbac.mjs";
import { logGovernanceEvent } from "./audit.mjs";

export async function runScientificReview(admin, item, opts = {}) {
  const reviewId = crypto.randomUUID();
  const started = new Date().toISOString();

  const gate = await runReviewGate(item, { checkLinks: opts.checkLinks ?? true });
  const checks = [];

  checks.push({
    id: "source",
    label: "مراجعة المصدر",
    passed: gate.checks?.find((c) => c.name === "provenance")?.passed ?? false,
    auto: true,
    details: gate.provenance,
  });

  checks.push({
    id: "text",
    label: "مراجعة النص",
    passed: (gate.completeness_score || 0) >= 75,
    auto: true,
    score: gate.completeness_score,
  });

  checks.push({
    id: "classification",
    label: "مراجعة التصنيف",
    passed: Boolean(item.category || item.ai_category),
    auto: true,
  });

  if (item.source_url) {
    const linkCheck = await checkLink(item.source_url);
    checks.push({ id: "links", label: "مراجعة الروابط", passed: linkCheck.ok, auto: true, details: linkCheck });
  } else {
    checks.push({ id: "links", label: "مراجعة الروابط", passed: false, auto: true, note: "no_source_url" });
  }

  checks.push({
    id: "metadata",
    label: "مراجعة البيانات الوصفية",
    passed: Boolean(item.title && (item.summary || item.description)),
    auto: true,
  });

  checks.push({
    id: "images",
    label: "مراجعة الصور",
    passed: !gate.warnings?.some((w) => w.includes("image") || w.includes("صورة")),
    auto: true,
  });

  checks.push({
    id: "policy",
    label: "التوافق مع سياسة المنصة",
    passed: gate.can_publish,
    auto: true,
    details: { can_publish: gate.can_publish, errors: gate.errors },
  });

  const passedCount = checks.filter((c) => c.passed).length;
  const allPassed = passedCount === checks.length;
  const canPublish = allPassed && gate.can_publish;

  const review = {
    id: reviewId,
    content_kind: item.content_kind || item.content_type,
    content_id: item.id || item.content_id,
    status: canPublish ? "approved" : "needs_review",
    checks,
    passed: passedCount,
    total: checks.length,
    gate_result: gate,
    can_publish: canPublish,
    started_at: started,
    finished_at: new Date().toISOString(),
  };

  if (admin) {
    try {
      await admin.from("governance_reviews").upsert(
        {
          id: reviewId,
          content_kind: review.content_kind,
          content_id: review.content_id,
          review_type: "scientific",
          status: review.status,
          checks,
          can_publish: canPublish,
          reviewer_id: opts.reviewer_id || "system",
          finished_at: review.finished_at,
        },
        { onConflict: "content_kind,content_id,review_type" },
      );
    } catch {
      /* table may not exist */
    }
  }

  return review;
}

export async function submitHumanReview(admin, { contentKind, contentId, reviewer, decision, notes }) {
  const role = resolveRole(reviewer);
  if (!canPerformAction(reviewer, decision === "approve" ? "approve" : "reject")) {
    return { ok: false, error: "permission_denied" };
  }

  const status = decision === "approve" ? "approved" : "rejected";

  if (admin) {
    try {
      await admin.from("governance_reviews").update({
        status,
        reviewer_id: reviewer?.id || reviewer?.user_id,
        reviewer_role: role,
        review_notes: notes,
        reviewed_at: new Date().toISOString(),
      }).eq("content_kind", contentKind).eq("content_id", contentId);
    } catch {
      /* table may not exist */
    }
  }

  await logGovernanceEvent(admin, {
    action: decision === "approve" ? "review_approve" : "review_reject",
    actor_id: reviewer?.id,
    actor_role: role,
    resource_type: contentKind,
    resource_id: contentId,
    reason: notes,
  });

  return { ok: true, status, decision };
}

export async function getReviewQueue(admin, { status = "needs_review", limit = 50 } = {}) {
  if (!admin) return [];

  try {
    const { data } = await admin
      .from("governance_reviews")
      .select("*")
      .eq("status", status)
      .order("finished_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

export { REVIEW_CHECKS };
