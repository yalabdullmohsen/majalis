import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import {
  getGovernanceDashboard,
  runGovernanceCycle,
  getAuditTrail,
  getReviewQueue,
  runScientificReview,
  submitHumanReview,
  transitionLifecycle,
  assignRole,
  getRolesForUser,
  runGovernanceSecurityAudit,
  runBackupCheck,
  runRestoreTest,
  getQualityMetrics,
  getGovernanceMonitoring,
  generateGovernanceReport,
  buildMaintenancePlan,
  generateTechnicalDocs,
  ROLES,
  LIFECYCLE_STAGES,
} from "../../../lib/governance/index.mjs";
import { syncLegacyRolesToGovernance } from "../../../lib/governance/role-sync.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";
  const admin = getSupabaseAdmin();

  try {
    if (action === "dashboard") {
      const dashboard = await getGovernanceDashboard(admin);
      sendJson(res, 200, { ok: true, ...dashboard });
      return;
    }

    if (action === "monitoring") {
      const monitoring = await getGovernanceMonitoring(admin);
      sendJson(res, 200, { ok: true, monitoring });
      return;
    }

    if (action === "quality") {
      const quality = await getQualityMetrics(admin);
      sendJson(res, 200, { ok: true, quality });
      return;
    }

    if (action === "audit") {
      const logs = await getAuditTrail(admin, {
        limit: Number(req.query?.limit || 50),
        action: req.query?.filter_action,
        resource_id: req.query?.resource_id,
      });
      sendJson(res, 200, { ok: true, logs });
      return;
    }

    if (action === "reviews") {
      const reviews = await getReviewQueue(admin, { status: req.query?.status || "needs_review" });
      sendJson(res, 200, { ok: true, reviews });
      return;
    }

    if (action === "review") {
      const item = req.body?.item;
      if (!item) {
        sendJson(res, 400, { ok: false, error: "item_required" });
        return;
      }
      const result = await runScientificReview(admin, item, { checkLinks: true });
      sendJson(res, 200, { ok: true, review: result });
      return;
    }

    if (action === "approve-review") {
      const { content_kind, content_id, decision, notes } = req.body || {};
      const result = await submitHumanReview(admin, {
        contentKind: content_kind,
        contentId: content_id,
        reviewer: { role: "scientific_reviewer", user_id: req.body?.reviewer_id },
        decision,
        notes,
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "transition") {
      const { content_kind, content_id, to_stage, reason, item } = req.body || {};
      const result = await transitionLifecycle(admin, {
        contentKind: content_kind,
        contentId: content_id,
        toStage: to_stage,
        actor: { role: req.body?.actor_role || "content_manager" },
        reason,
        item,
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "assign-role") {
      const result = await assignRole(admin, {
        userId: req.body?.user_id,
        roleId: req.body?.role_id,
        assignedBy: req.body?.assigned_by,
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "roles") {
      sendJson(res, 200, { ok: true, roles: ROLES, lifecycle: LIFECYCLE_STAGES });
      return;
    }

    if (action === "security") {
      const audit = await runGovernanceSecurityAudit(admin);
      sendJson(res, 200, { ok: true, audit });
      return;
    }

    if (action === "backup") {
      const backup = await runBackupCheck(admin, { exportSamples: true });
      sendJson(res, 200, { ok: true, backup });
      return;
    }

    if (action === "restore-test") {
      const restore = await runRestoreTest(admin, { exportFirst: true, actorId: auth.userId || "admin" });
      sendJson(res, 200, { ok: true, restore });
      return;
    }

    if (action === "sync-roles") {
      const sync = await syncLegacyRolesToGovernance(admin, { assignedBy: auth.userId || null });
      sendJson(res, 200, { ok: true, sync });
      return;
    }

    if (action === "cycle") {
      const result = await runGovernanceCycle(admin, { backup: req.body?.backup, security: true });
      sendJson(res, 200, result);
      return;
    }

    if (action === "report") {
      const report = await generateGovernanceReport(admin);
      sendJson(res, 200, { ok: true, report });
      return;
    }

    if (action === "docs") {
      const docs = generateTechnicalDocs();
      sendJson(res, 200, { ok: true, docs });
      return;
    }

    if (action === "maintenance-plan") {
      sendJson(res, 200, { ok: true, plan: buildMaintenancePlan() });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
