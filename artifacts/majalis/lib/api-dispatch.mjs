import { createRateLimiter } from "./rate-limit.mjs";

const assistantRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 15,
  keyPrefix: "assistant",
});

const transcribeRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 8,
  keyPrefix: "transcribe",
});

const fiqhResearchRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "fiqh-research",
});

/** Route table uses dynamic imports so Vercel bundles one lightweight function entrypoint. */
export const API_ROUTES = [
  { prefix: "/api/healthz", module: "./api-handlers/healthz.js", allowGet: true, exact: true },
  { prefix: "/api/assistant/health", module: "./api-handlers/assistant/health.js", allowGet: true, exact: true },
  { prefix: "/api/prayer-times", module: "./api-handlers/prayer-times.js", allowGet: true, exact: true },
  { prefix: "/api/cron/sync-data", module: "./api-handlers/cron/sync-data.js", allowGet: true, exact: true },
  { prefix: "/api/cron/knowledge-sync", module: "./api-handlers/cron/knowledge-sync.js", allowGet: true, exact: true },
  { prefix: "/api/cron/sync-fiqh-council", module: "./api-handlers/cron/sync-fiqh-council.js", allowGet: true, exact: true },
  { prefix: "/api/cron/check-fiqh-links", module: "./api-handlers/cron/check-fiqh-links.js", allowGet: true, exact: true },
  { prefix: "/api/cron/scholarly-verification", module: "./api-handlers/cron/scholarly-verification.js", allowGet: true, exact: true },
  { prefix: "/api/admin/knowledge-pipeline", module: "./api-handlers/admin/knowledge-pipeline.js", allowGet: true },
  { prefix: "/api/admin/check-fiqh-links", module: "./api-handlers/admin/check-fiqh-links.js", allowGet: true },
  { prefix: "/api/admin/sync-fiqh-council", module: "./api-handlers/admin/sync-fiqh-council.js", allowGet: true },
  { prefix: "/api/admin/scholarly-verification", module: "./api-handlers/admin/scholarly-verification.js", allowGet: true },
  { prefix: "/api/knowledge-search", module: "./api-handlers/knowledge-search.js", allowGet: true },
  { prefix: "/api/cron/auto-content-sync", module: "./api-handlers/cron/auto-content-sync.js", allowGet: true, exact: true },
  { prefix: "/api/cron/auto-content-health", module: "./api-handlers/cron/auto-content-health.js", allowGet: true, exact: true },
  { prefix: "/api/cron/system-health", module: "./api-handlers/cron/system-health.js", allowGet: true, exact: true },
  { prefix: "/api/cron/apply-migrations", module: "./api-handlers/cron/apply-migrations.js", allowGet: true, exact: true },
  { prefix: "/api/cron/bootstrap-database", module: "./api-handlers/cron/bootstrap-database.js", allowGet: true, exact: true },
  { prefix: "/api/cron/auto-knowledge-sync", module: "./api-handlers/cron/auto-knowledge-sync.js", allowGet: true, exact: true },
  { prefix: "/api/cron/connector-health", module: "./api-handlers/cron/connector-health.js", allowGet: true, exact: true },
  { prefix: "/api/auto-content", module: "./api-handlers/auto-content.js", allowGet: true },
  { prefix: "/api/knowledge-recommendations", module: "./api-handlers/knowledge-recommendations.js", allowGet: true },
  { prefix: "/api/intelligent-search", module: "./api-handlers/intelligent-search.js", allowGet: true },
  { prefix: "/api/topic-content", module: "./api-handlers/topic-content.js", allowGet: true },
  { prefix: "/api/content-relations", module: "./api-handlers/content-relations.js", allowGet: true },
  { prefix: "/api/scholarly-search", module: "./api-handlers/scholarly-search.js", allowGet: true },
  { prefix: "/api/admin/search-analytics", module: "./api-handlers/admin/search-analytics.js", allowGet: true },
  { prefix: "/api/digital-learning", module: "./api-handlers/digital-learning.js", allowGet: true },
  { prefix: "/api/admin/digital-learning", module: "./api-handlers/admin/digital-learning.js", allowGet: true },
  { prefix: "/api/cron/autonomous-orchestrator", module: "./api-handlers/cron/autonomous-orchestrator.js", allowGet: true, exact: true },
  { prefix: "/api/admin/autonomous-ai", module: "./api-handlers/admin/autonomous-ai.js", allowGet: true },
  { prefix: "/api/daily-content", module: "./api-handlers/daily-content.js", allowGet: true },
  { prefix: "/api/global-reference", module: "./api-handlers/global-reference.js", allowGet: true },
  { prefix: "/api/admin/global-reference", module: "./api-handlers/admin/global-reference.js", allowGet: true },
  { prefix: "/api/cron/global-reference-review", module: "./api-handlers/cron/global-reference-review.js", allowGet: true, exact: true },
  { prefix: "/api/cron/islamic-intelligence", module: "./api-handlers/cron/islamic-intelligence.js", allowGet: true, exact: true },
  { prefix: "/api/admin/islamic-intelligence", module: "./api-handlers/admin/islamic-intelligence.js", allowGet: true },
  { prefix: "/api/v1", module: "./api-handlers/v1.js", allowGet: true },
  { prefix: "/api/v2", module: "./api-handlers/v2.js", allowGet: true },
  { prefix: "/api/v3", module: "./api-handlers/v3.js", allowGet: true },
  { prefix: "/api/admin/open-platform", module: "./api-handlers/admin/open-platform.js", allowGet: true },
  { prefix: "/api/admin/governance", module: "./api-handlers/admin/governance.js", allowGet: true },
  { prefix: "/api/cron/governance-backup", module: "./api-handlers/cron/governance-backup.js", allowGet: true, exact: true },
  { prefix: "/api/admin/ai-agents", module: "./api-handlers/admin/ai-agents.js", allowGet: true },
  { prefix: "/api/cron/ai-agents", module: "./api-handlers/cron/ai-agents.js", allowGet: true, exact: true },
  { prefix: "/api/admin/auto-content", module: "./api-handlers/admin/auto-content.js", allowGet: true },
  { prefix: "/api/admin/auto-knowledge-engine", module: "./api-handlers/admin/auto-knowledge-engine.js", allowGet: true },
  { prefix: "/api/fiqh-research-assistant", module: "./api-handlers/fiqh-research-assistant.js", rateLimit: fiqhResearchRateLimit, allowGet: true },
  { prefix: "/api/assistant", module: "./api-handlers/assistant.js", rateLimit: assistantRateLimit, allowGet: true },
  { prefix: "/api/test-anthropic", module: "./api-handlers/test-anthropic.js", allowGet: true },
  { prefix: "/api/transcribe", module: "./api-handlers/transcribe.js", rateLimit: transcribeRateLimit },
];

const handlerCache = new Map();

async function loadHandler(route) {
  if (handlerCache.has(route.module)) {
    return handlerCache.get(route.module);
  }
  const href = new URL(route.module, import.meta.url).href;
  const mod = await import(href);
  const handler = mod.default;
  handlerCache.set(route.module, handler);
  return handler;
}

export function resolveRequestPath(req) {
  const headerPath =
    req.headers?.["x-vercel-original-path"] ||
    req.headers?.["x-invoke-path"] ||
    req.headers?.["x-forwarded-uri"];
  const raw = headerPath || req.url || "/";
  return String(raw).split("?")[0];
}

export function matchApiRoute(urlOrReq) {
  const path =
    typeof urlOrReq === "string"
      ? urlOrReq.split("?")[0]
      : resolveRequestPath(urlOrReq);
  return API_ROUTES.find((route) =>
    route.exact ? path === route.prefix : path === route.prefix || path.startsWith(`${route.prefix}/`) || path.startsWith(`${route.prefix}?`),
  );
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.on !== "function") return {};

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function sendJson(res, status, payload) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(status).json(payload);
    return;
  }

  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export async function dispatchApiRequest(req, res) {
  const route = matchApiRoute(req);
  if (!route) {
    sendJson(res, 404, { ok: false, message: "المسار غير موجود." });
    return;
  }

  const handler = await loadHandler(route);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET" && route.allowGet) {
    req.body = {};
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`${route.prefix} GET handler failed`, error);
      if (!res.headersSent) {
        sendJson(res, 500, { ok: false, message: "تعذر تنفيذ الطلب.", fallback: true });
      }
    }
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const runPost = async () => {
    const body = await readJsonBody(req);
    if (body === null && route.prefix !== "/api/test-anthropic") {
      sendJson(res, 400, { ok: false, message: "اكتب سؤالك أولًا." });
      return;
    }

    req.body = body ?? {};
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`${route.prefix} POST handler failed`, error);
      if (!res.headersSent) {
        sendJson(res, 500, { ok: false, message: "تعذر تنفيذ الطلب.", fallback: true });
      }
    }
  };

  if (route.rateLimit) {
    await route.rateLimit(req, res, runPost);
  } else {
    await runPost();
  }
}

/** Dev server helper: resolve handler for a matched route without caching importers. */
export async function getDevRouteHandler(route) {
  const href = new URL(route.module, import.meta.url).href;
  const mod = await import(href);
  return mod.default;
}

export { assistantRateLimit, transcribeRateLimit, fiqhResearchRateLimit };
