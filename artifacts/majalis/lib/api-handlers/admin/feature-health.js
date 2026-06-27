import { sendJson } from "../api/_http.mjs";
import { getPlatformHealth, probeProductionRoutes } from "../../../lib/platform-health.mjs";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { classifyDelivery } from "../../../lib/release-gate.mjs";
import { grepCode } from "../../../lib/release-gate-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "../../data/feature-registry.json");

async function probeApi(base, pathname, method = "GET", body) {
  try {
    const res = await fetch(`${base}${pathname}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* ignore */
    }
    return { status: res.status, ok: res.status < 400 && json?.ok !== false, detail: json || text.slice(0, 120) };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req);
  if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });

  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const base = registry.productionUrl || "https://www.majlisilm.com";

  const health = await getPlatformHealth({ skipRemote: false });
  const routeChecks = await probeProductionRoutes(
    registry.features.flatMap((f) => f.routes || []).filter((v, i, a) => a.indexOf(v) === i),
  );

  const apiChecks = {
    healthz: await probeApi(base, "/api/healthz"),
    assistantHealth: await probeApi(base, "/api/assistant/health"),
    assistantPost: await probeApi(base, "/api/assistant", "POST", { message: "ما حكم الوضوء؟" }),
    knowledgeSearch: await probeApi(base, "/api/knowledge-search?q=صلاة"),
    productionActivate: await probeApi(base, "/api/admin/production-activate?action=health"),
  };

  const features = registry.features.map((f) => {
    const delivery = classifyDelivery(f, {
      production: true,
      codeHits: Object.fromEntries(f.codeMarkers.map((m) => [m, grepCode(m)])),
      mergedBranches: {},
      env: health.env,
      tables: Object.fromEntries(
        (f.requiredTables || []).map((t) => [t, health.services?.database?.tables?.[t] === true]),
      ),
      migrations: Object.fromEntries(
        (f.migrations || []).map((m) => [
          m,
          (f.requiredTables || []).every((t) => health.services?.database?.tables?.[t] === true),
        ]),
      ),
      prodHits: {},
      prodBlocked: {},
    });
    return { id: f.id, name: f.name, delivery: delivery.state, reason: delivery.reason, detail: delivery.detail };
  });

  return sendJson(res, health.ok ? 200 : 503, {
    ok: health.ok,
    at: health.at,
    productionUrl: base,
    blockers: health.blockers,
    env: health.env,
    secretGroups: health.secretGroups,
    services: health.services,
    tables: health.services?.database?.tables,
    routeChecks,
    apiChecks,
    features,
  });
}
