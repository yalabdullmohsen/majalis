/**
 * Admin API for lesson automation — sources + review center.
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  listTrustedSources,
  upsertTrustedSource,
  getTrustedSource,
} from "../../../lib/cms/trusted-sources.mjs";
import { listAutomationAudit } from "../../../lib/cms/automation-audit.mjs";
import { runLessonSourceMonitor } from "../../../lib/cms/lesson-source-monitor.mjs";
import { listAutomationRuns } from "../../../lib/cms/automation-runs.mjs";
import { countPendingAutomationDrafts } from "../../../lib/cms/automation-notifications.mjs";
import { listLessonImportDrafts, getLessonImportDraft } from "../../../lib/cms/lesson-import-draft.mjs";
import { handleLessonImportApprove, handleLessonImportReject } from "../../../lib/cms/lesson-import-actions.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "").trim();

  try {
    if (action === "list-sources") {
      const sources = await listTrustedSources({ activeOnly: body.activeOnly === true });
      sendJson(res, 200, { ok: true, sources });
      return;
    }

    if (action === "upsert-source") {
      const result = await upsertTrustedSource(body.source || body);
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    if (action === "toggle-source") {
      const source = await getTrustedSource(body.sourceId);
      if (!source) {
        sendJson(res, 404, { ok: false, error: "not_found" });
        return;
      }
      const result = await upsertTrustedSource({ ...source, active: body.active ?? !source.active });
      sendJson(res, 200, result);
      return;
    }

    if (action === "toggle-auto-publish") {
      const source = await getTrustedSource(body.sourceId);
      if (!source) {
        sendJson(res, 404, { ok: false, error: "not_found" });
        return;
      }
      const result = await upsertTrustedSource({
        ...source,
        auto_publish_allowed: body.auto_publish_allowed ?? !source.auto_publish_allowed,
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "run-monitor") {
      const result = await runLessonSourceMonitor({
        dryRun: body.dryRun === true,
        sourceId: body.sourceId || null,
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "list-audit") {
      const records = await listAutomationAudit({
        decision: body.decision,
        limit: body.limit || 100,
        sourceId: body.sourceId,
      });
      sendJson(res, 200, { ok: true, records });
      return;
    }

    if (action === "list-review") {
      const drafts = await listLessonImportDrafts({
        status: body.status,
        limit: body.limit || 100,
      });
      const audit = await listAutomationAudit({ limit: 100 });
      const autoPublished = audit.filter((a) => a.decision === "approved");
      const pending = drafts.filter((d) => d.automation_status === "pending_review" || d.status === "needs_review");
      const duplicates = audit.filter((a) => a.decision === "duplicate");
      const rejected = audit.filter((a) => a.decision === "rejected");
      const pendingCount = await countPendingAutomationDrafts();
      sendJson(res, 200, {
        ok: true,
        drafts: pending,
        autoPublished,
        duplicates,
        rejected,
        audit,
        pendingCount,
      });
      return;
    }

    if (action === "list-runs") {
      const runs = await listAutomationRuns({ limit: body.limit || 20 });
      sendJson(res, 200, { ok: true, runs });
      return;
    }

    if (action === "re-analyze") {
      const draft = await getLessonImportDraft(body.draftId);
      if (!draft?.source_id) {
        sendJson(res, 400, { ok: false, error: "missing_source_id" });
        return;
      }
      const result = await runLessonSourceMonitor({
        sourceId: draft.source_id,
        runType: "re_analyze",
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "approve-draft") {
      const draft = await getLessonImportDraft(body.draftId);
      if (!draft) {
        sendJson(res, 404, { ok: false, error: "draft_not_found" });
        return;
      }
      await handleLessonImportApprove(
        { draftId: body.draftId, parsed_fields: body.parsed_fields || draft.parsed_payload },
        auth,
        sendJson,
        res,
      );
      return;
    }

    if (action === "reject-draft") {
      await handleLessonImportReject({ draftId: body.draftId }, auth, sendJson, res);
      return;
    }

    sendJson(res, 400, {
      ok: false,
      error: "unknown_action",
      actions: [
        "list-sources",
        "upsert-source",
        "toggle-source",
        "toggle-auto-publish",
        "run-monitor",
        "list-audit",
        "list-review",
        "list-runs",
        "re-analyze",
        "approve-draft",
        "reject-draft",
      ],
    });
  } catch (err) {
    console.error("[admin/lesson-automation]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
