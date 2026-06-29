/**
 * Admin API — Autonomous Data Acquisition Engine
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  buildDashboard,
  runAcquisitionEngine,
  runSourcePipeline,
  runDedupCleanup,
  listSources,
  upsertSource,
  seedSourcesIfEmpty,
} from "../../../lib/data-acquisition/index.mjs";

export default async function handler(req, res) {
  const body = req.method === "POST" ? req.body || {} : {};
  const query = req.query || {};
  const action = String(body.action || query.action || "dashboard").trim();

  const needsWrite = ["run", "run-source", "source.create", "source.update", "source.toggle", "seed", "dedup"].includes(action);
  const auth = await requireAdminAccess(req, res, sendJson, { requireImport: needsWrite });
  if (!auth) return;

  if (req.method === "GET") {
    if (action === "dashboard") {
      sendJson(res, 200, await buildDashboard());
      return;
    }
    if (action === "sources") {
      sendJson(res, 200, { ok: true, sources: await listSources() });
      return;
    }
    sendJson(res, 200, { ok: true, actions: ["dashboard", "sources", "run", "run-source", "dedup", "seed"] });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  if (action === "dashboard") {
    sendJson(res, 200, await buildDashboard());
    return;
  }

  if (action === "seed") {
    sendJson(res, 200, await seedSourcesIfEmpty());
    return;
  }

  if (action === "run") {
    const mode = body.mode || query.mode || "hourly";
    sendJson(res, 200, await runAcquisitionEngine({ mode, triggerType: "admin" }));
    return;
  }

  if (action === "run-source") {
    const sourceId = body.sourceId || body.source_id || query.sourceId;
    const sources = await listSources();
    const source = sources.find((s) => s.id === sourceId || s.slug === sourceId);
    if (!source) {
      sendJson(res, 404, { ok: false, error: "source_not_found" });
      return;
    }
    sendJson(res, 200, await runSourcePipeline(source, { triggerType: "admin" }));
    return;
  }

  if (action === "dedup") {
    sendJson(res, 200, { ok: true, ...(await runDedupCleanup()) });
    return;
  }

  if (action === "source.create" || action === "source.update") {
    const result = await upsertSource(body.source || body);
    sendJson(res, result.ok ? 200 : 400, result);
    return;
  }

  if (action === "source.toggle") {
    const sources = await listSources();
    const source = sources.find((s) => s.id === body.sourceId || s.slug === body.sourceId);
    if (!source) {
      sendJson(res, 404, { ok: false, error: "not_found" });
      return;
    }
    const next = source.status === "active" ? "paused" : "active";
    sendJson(res, 200, await upsertSource({ ...source, status: next }));
    return;
  }

  sendJson(res, 400, { ok: false, error: "unknown_action", action });
}
