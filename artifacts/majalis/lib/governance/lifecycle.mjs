/**
 * Enterprise Governance — content lifecycle workflow.
 */

import crypto from "node:crypto";
import { LIFECYCLE_STAGES } from "./config.mjs";
import { canPerformAction, resolveRole } from "./rbac.mjs";
import { logGovernanceEvent } from "./audit.mjs";
import { runReviewGate } from "../scholarly-verification/review-gate.mjs";

const STAGE_ORDER = Object.fromEntries(LIFECYCLE_STAGES.map((s) => [s.id, s.order]));

export function getNextStage(currentStage) {
  const current = LIFECYCLE_STAGES.find((s) => s.id === currentStage);
  if (!current) return LIFECYCLE_STAGES[0];
  const next = LIFECYCLE_STAGES.find((s) => s.order === current.order + 1);
  return next || null;
}

export function canTransition(user, fromStage, toStage) {
  const from = STAGE_ORDER[fromStage] || 0;
  const to = STAGE_ORDER[toStage] || 0;
  if (to <= from) return canPerformAction(user, "archive");

  const target = LIFECYCLE_STAGES.find((s) => s.id === toStage);
  if (!target) return false;
  if (target.auto) return true;

  if (toStage === "publish") return canPerformAction(user, "publish");
  if (toStage === "editorial_review") return canPerformAction(user, "review_editorial");
  if (toStage === "scientific_review") return canPerformAction(user, "review_scientific");
  if (toStage === "approval") return canPerformAction(user, "approve");

  return canPerformAction(user, "edit");
}

export async function getContentLifecycle(admin, contentKind, contentId) {
  if (!admin) return { stage: "draft", history: [] };

  try {
    const { data } = await admin
      .from("governance_content_lifecycle")
      .select("*")
      .eq("content_kind", contentKind)
      .eq("content_id", contentId)
      .maybeSingle();

    const { data: history } = await admin
      .from("governance_lifecycle_history")
      .select("*")
      .eq("content_kind", contentKind)
      .eq("content_id", contentId)
      .order("created_at", { ascending: false })
      .limit(20);

    return {
      stage: data?.current_stage || "draft",
      status: data?.status || "active",
      assigned_to: data?.assigned_to,
      history: history || [],
      updated_at: data?.updated_at,
    };
  } catch {
    return { stage: "draft", history: [] };
  }
}

export async function transitionLifecycle(admin, { contentKind, contentId, toStage, actor, reason, item }) {
  const actorRole = resolveRole(actor);
  const current = await getContentLifecycle(admin, contentKind, contentId);
  const fromStage = current.stage;

  if (!canTransition(actor, fromStage, toStage)) {
    return { ok: false, error: "permission_denied", from: fromStage, to: toStage };
  }

  if (toStage === "source_verification" && item) {
    const gate = await runReviewGate(item, { checkLinks: true });
    if (!gate.can_publish && toStage === "publish") {
      return { ok: false, error: "review_gate_failed", gate };
    }
  }

  const now = new Date().toISOString();
  const historyEntry = {
    id: crypto.randomUUID(),
    content_kind: contentKind,
    content_id: contentId,
    from_stage: fromStage,
    to_stage: toStage,
    actor_id: actor?.id || actor?.user_id || "system",
    actor_role: actorRole,
    reason: reason || null,
    created_at: now,
  };

  if (admin) {
    try {
      await admin.from("governance_content_lifecycle").upsert(
        {
          content_kind: contentKind,
          content_id: contentId,
          current_stage: toStage,
          status: toStage === "archive" ? "archived" : "active",
          updated_at: now,
          updated_by: historyEntry.actor_id,
        },
        { onConflict: "content_kind,content_id" },
      );

      await admin.from("governance_lifecycle_history").insert(historyEntry);
    } catch {
      /* tables may not exist */
    }
  }

  await logGovernanceEvent(admin, {
    action: "lifecycle_transition",
    actor_id: historyEntry.actor_id,
    actor_role: actorRole,
    resource_type: contentKind,
    resource_id: contentId,
    reason,
    metadata: { from: fromStage, to: toStage },
  });

  return { ok: true, from: fromStage, to: toStage, history: historyEntry };
}

export async function runAutoLifecycleStages(admin, item, { contentKind, contentId }) {
  const results = [];

  for (const stage of LIFECYCLE_STAGES.filter((s) => s.auto)) {
    const result = await transitionLifecycle(admin, {
      contentKind,
      contentId,
      toStage: stage.id,
      actor: { role: "system_admin" },
      reason: "auto_stage",
      item,
    });
    results.push({ stage: stage.id, ...result });
    if (!result.ok) break;
  }

  return results;
}

export { LIFECYCLE_STAGES };
