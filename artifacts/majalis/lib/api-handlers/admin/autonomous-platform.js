/**
 * Admin API — Autonomous Knowledge Platform v3.
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  listManagedSources,
  getManagedSource,
  createManagedSource,
  upsertManagedSource,
  deleteManagedSource,
  toggleManagedSource,
  testManagedSource,
  discoverFeedsFromUrl,
  listPendingDiscoveries,
  approveDiscovery,
  rejectDiscovery,
  buildProductionAnalytics,
  getAnalyticsHistory,
  getDailyGoalProgress,
  enforceDailyGoals,
  runAutonomousPlatformV3,
  listAuditLog,
  listBackupSnapshots,
  runDailyBackupSnapshot,
  semanticSearch,
  getPageRecommendations,
  SUPPORTED_LANGUAGES,
  PLATFORM_V3_VERSION,
} from "../../../lib/autonomous-platform/v3/index.mjs";
import { logAuditEvent, sanitizeAdminPayload } from "../../../lib/autonomous-platform/v3/security.mjs";

export default async function handler(req, res) {
  const body = req.method === "POST" ? sanitizeAdminPayload(req.body || {}) : {};
  const query = req.query || {};
  const action = String(body.action || query.action || "dashboard").trim();

  const auth = await requireAdminAccess(req, res, sendJson, { requireImport: action.startsWith("source.") });
  if (!auth) return;

  if (req.method === "GET") {
    if (action === "sources" || action === "list-sources") {
      const listed = await listManagedSources({ activeOnly: query.activeOnly === "1" });
      sendJson(res, 200, listed);
      return;
    }
    if (action === "source") {
      const id = String(query.id || query.slug || "").trim();
      const got = await getManagedSource(id);
      sendJson(res, got.ok ? 200 : 404, got);
      return;
    }
    if (action === "analytics") {
      sendJson(res, 200, await buildProductionAnalytics());
      return;
    }
    if (action === "analytics-history") {
      sendJson(res, 200, await getAnalyticsHistory(Number(query.days) || 30));
      return;
    }
    if (action === "goals") {
      sendJson(res, 200, await getDailyGoalProgress());
      return;
    }
    if (action === "discoveries") {
      sendJson(res, 200, await listPendingDiscoveries(Number(query.limit) || 30));
      return;
    }
    if (action === "audit") {
      sendJson(res, 200, await listAuditLog({ limit: Number(query.limit) || 50 }));
      return;
    }
    if (action === "backups") {
      sendJson(res, 200, await listBackupSnapshots(Number(query.limit) || 20));
      return;
    }
    if (action === "languages") {
      sendJson(res, 200, { ok: true, languages: SUPPORTED_LANGUAGES });
      return;
    }
    if (action === "search") {
      const q = String(query.q || "").trim();
      sendJson(res, 200, await semanticSearch(q, { limit: Number(query.limit) || 20 }));
      return;
    }
    if (action === "recommendations") {
      sendJson(res, 200, await getPageRecommendations({
        contentType: query.contentType,
        contentId: query.contentId,
        title: query.title,
        limit: Number(query.limit) || 6,
      }));
      return;
    }
    sendJson(res, 200, {
      ok: true,
      platformVersion: PLATFORM_V3_VERSION,
      actions: ["sources", "analytics", "goals", "discoveries", "audit", "backups", "search"],
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  if (action === "source.create") {
    const created = await createManagedSource(body.source || body, auth);
    sendJson(res, created.ok ? 200 : 400, created);
    return;
  }

  if (action === "source.update") {
    const updated = await upsertManagedSource(body.source || body, auth);
    sendJson(res, updated.ok ? 200 : 400, updated);
    return;
  }

  if (action === "source.delete") {
    const id = String(body.id || body.sourceId || "").trim();
    const deleted = await deleteManagedSource(id, auth);
    sendJson(res, deleted.ok ? 200 : 400, deleted);
    return;
  }

  if (action === "source.toggle") {
    const id = String(body.id || body.sourceId || "").trim();
    const toggled = await toggleManagedSource(id, body.active !== false, auth);
    sendJson(res, toggled.ok ? 200 : 400, toggled);
    return;
  }

  if (action === "source.test") {
    const id = String(body.id || body.url || body.sourceId || "").trim();
    const tested = await testManagedSource(id);
    sendJson(res, 200, tested);
    return;
  }

  if (action === "discover") {
    const url = String(body.url || "").trim();
    if (!url) {
      sendJson(res, 400, { ok: false, error: "missing_url" });
      return;
    }
    const found = await discoverFeedsFromUrl(url);
    if (found.ok && found.discoveries?.length) {
      const { saveDiscoveries } = await import("../../../lib/autonomous-platform/v3/source-discovery.mjs");
      await saveDiscoveries(found.discoveries);
    }
    sendJson(res, 200, found);
    return;
  }

  if (action === "discovery.approve") {
    const approved = await approveDiscovery(body.id, body.source, auth);
    sendJson(res, approved.ok ? 200 : 400, approved);
    return;
  }

  if (action === "discovery.reject") {
    const rejected = await rejectDiscovery(body.id);
    sendJson(res, 200, rejected);
    return;
  }

  if (action === "run") {
    const result = await runAutonomousPlatformV3({ mode: body.mode || "full", triggerType: "admin" });
    await logAuditEvent({ actor: auth, action: "platform.run", metadata: { mode: body.mode || "full" } });
    sendJson(res, 200, result);
    return;
  }

  if (action === "goals.enforce") {
    sendJson(res, 200, await enforceDailyGoals(body));
    return;
  }

  if (action === "backup.run") {
    sendJson(res, 200, await runDailyBackupSnapshot(auth.userId || "admin"));
    return;
  }

  sendJson(res, 400, { ok: false, error: "unknown_action", action });
}
