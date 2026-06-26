import assistantHandler from "./api-handlers/assistant.js";
import assistantHealthHandler from "./api-handlers/assistant/health.js";
import testAnthropicHandler from "./api-handlers/test-anthropic.js";
import transcribeHandler from "./api-handlers/transcribe.js";
import prayerTimesHandler from "./api-handlers/prayer-times.js";
import fiqhResearchAssistantHandler from "./api-handlers/fiqh-research-assistant.js";
import syncDataHandler from "./api-handlers/cron/sync-data.js";
import knowledgeSyncHandler from "./api-handlers/cron/knowledge-sync.js";
import knowledgePipelineHandler from "./api-handlers/admin/knowledge-pipeline.js";
import knowledgeSearchHandler from "./api-handlers/knowledge-search.js";
import autoContentHealthHandler from "./api-handlers/cron/auto-content-health.js";
import autoContentSyncHandler from "./api-handlers/cron/auto-content-sync.js";
import systemHealthHandler from "./api-handlers/cron/system-health.js";
import applyMigrationsHandler from "./api-handlers/cron/apply-migrations.js";
import bootstrapDatabaseHandler from "./api-handlers/cron/bootstrap-database.js";
import autoContentHandler from "./api-handlers/auto-content.js";
import autoContentAdminHandler from "./api-handlers/admin/auto-content.js";
import autoKnowledgeSyncHandler from "./api-handlers/cron/auto-knowledge-sync.js";
import connectorHealthHandler from "./api-handlers/cron/connector-health.js";
import autoKnowledgeAdminHandler from "./api-handlers/admin/auto-knowledge-engine.js";
import knowledgeRecommendationsHandler from "./api-handlers/knowledge-recommendations.js";
import intelligentSearchHandler from "./api-handlers/intelligent-search.js";
import topicContentHandler from "./api-handlers/topic-content.js";
import contentRelationsHandler from "./api-handlers/content-relations.js";
import searchAnalyticsHandler from "./api-handlers/admin/search-analytics.js";
import digitalLearningHandler from "./api-handlers/digital-learning.js";
import digitalLearningAdminHandler from "./api-handlers/admin/digital-learning.js";
import autonomousOrchestratorHandler from "./api-handlers/cron/autonomous-orchestrator.js";
import autonomousAiAdminHandler from "./api-handlers/admin/autonomous-ai.js";
import dailyContentHandler from "./api-handlers/daily-content.js";
import globalReferenceHandler from "./api-handlers/global-reference.js";
import globalReferenceAdminHandler from "./api-handlers/admin/global-reference.js";
import globalReferenceReviewHandler from "./api-handlers/cron/global-reference-review.js";
import islamicIntelligenceHandler from "./api-handlers/cron/islamic-intelligence.js";
import islamicIntelligenceAdminHandler from "./api-handlers/admin/islamic-intelligence.js";
import v1Handler from "./api-handlers/v1.js";
import v2Handler from "./api-handlers/v2.js";
import v3Handler from "./api-handlers/v3.js";
import openPlatformAdminHandler from "./api-handlers/admin/open-platform.js";
import governanceAdminHandler from "./api-handlers/admin/governance.js";
import governanceBackupHandler from "./api-handlers/cron/governance-backup.js";
import aiAgentsAdminHandler from "./api-handlers/admin/ai-agents.js";
import aiAgentsCronHandler from "./api-handlers/cron/ai-agents.js";
import scholarlySearchHandler from "./api-handlers/scholarly-search.js";
import scholarlyVerificationAdminHandler from "./api-handlers/admin/scholarly-verification.js";
import scholarlyVerificationCronHandler from "./api-handlers/cron/scholarly-verification.js";
import checkFiqhLinksAdminHandler from "./api-handlers/admin/check-fiqh-links.js";
import checkFiqhLinksCronHandler from "./api-handlers/cron/check-fiqh-links.js";
import syncFiqhCouncilAdminHandler from "./api-handlers/admin/sync-fiqh-council.js";
import syncFiqhCouncilCronHandler from "./api-handlers/cron/sync-fiqh-council.js";
import healthzHandler from "./api-handlers/healthz.js";
import { createRateLimiter } from "../server/rate-limit.mjs";

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

export const API_ROUTES = [
  { prefix: "/api/healthz", handler: healthzHandler, allowGet: true, exact: true },
  { prefix: "/api/assistant/health", handler: assistantHealthHandler, allowGet: true, exact: true },
  { prefix: "/api/prayer-times", handler: prayerTimesHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/sync-data", handler: syncDataHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/knowledge-sync", handler: knowledgeSyncHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/sync-fiqh-council", handler: syncFiqhCouncilCronHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/check-fiqh-links", handler: checkFiqhLinksCronHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/scholarly-verification", handler: scholarlyVerificationCronHandler, allowGet: true, exact: true },
  { prefix: "/api/admin/knowledge-pipeline", handler: knowledgePipelineHandler, allowGet: true },
  { prefix: "/api/admin/check-fiqh-links", handler: checkFiqhLinksAdminHandler, allowGet: true },
  { prefix: "/api/admin/sync-fiqh-council", handler: syncFiqhCouncilAdminHandler, allowGet: true },
  { prefix: "/api/admin/scholarly-verification", handler: scholarlyVerificationAdminHandler, allowGet: true },
  { prefix: "/api/knowledge-search", handler: knowledgeSearchHandler, allowGet: true },
  { prefix: "/api/cron/auto-content-sync", handler: autoContentSyncHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/auto-content-health", handler: autoContentHealthHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/system-health", handler: systemHealthHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/apply-migrations", handler: applyMigrationsHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/bootstrap-database", handler: bootstrapDatabaseHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/auto-knowledge-sync", handler: autoKnowledgeSyncHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/connector-health", handler: connectorHealthHandler, allowGet: true, exact: true },
  { prefix: "/api/auto-content", handler: autoContentHandler, allowGet: true },
  { prefix: "/api/knowledge-recommendations", handler: knowledgeRecommendationsHandler, allowGet: true },
  { prefix: "/api/intelligent-search", handler: intelligentSearchHandler, allowGet: true },
  { prefix: "/api/topic-content", handler: topicContentHandler, allowGet: true },
  { prefix: "/api/content-relations", handler: contentRelationsHandler, allowGet: true },
  { prefix: "/api/scholarly-search", handler: scholarlySearchHandler, allowGet: true },
  { prefix: "/api/admin/search-analytics", handler: searchAnalyticsHandler, allowGet: true },
  { prefix: "/api/digital-learning", handler: digitalLearningHandler, allowGet: true },
  { prefix: "/api/admin/digital-learning", handler: digitalLearningAdminHandler, allowGet: true },
  { prefix: "/api/cron/autonomous-orchestrator", handler: autonomousOrchestratorHandler, allowGet: true, exact: true },
  { prefix: "/api/admin/autonomous-ai", handler: autonomousAiAdminHandler, allowGet: true },
  { prefix: "/api/daily-content", handler: dailyContentHandler, allowGet: true },
  { prefix: "/api/global-reference", handler: globalReferenceHandler, allowGet: true },
  { prefix: "/api/admin/global-reference", handler: globalReferenceAdminHandler, allowGet: true },
  { prefix: "/api/cron/global-reference-review", handler: globalReferenceReviewHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/islamic-intelligence", handler: islamicIntelligenceHandler, allowGet: true, exact: true },
  { prefix: "/api/admin/islamic-intelligence", handler: islamicIntelligenceAdminHandler, allowGet: true },
  { prefix: "/api/v1", handler: v1Handler, allowGet: true },
  { prefix: "/api/v2", handler: v2Handler, allowGet: true },
  { prefix: "/api/v3", handler: v3Handler, allowGet: true },
  { prefix: "/api/admin/open-platform", handler: openPlatformAdminHandler, allowGet: true },
  { prefix: "/api/admin/governance", handler: governanceAdminHandler, allowGet: true },
  { prefix: "/api/cron/governance-backup", handler: governanceBackupHandler, allowGet: true, exact: true },
  { prefix: "/api/admin/ai-agents", handler: aiAgentsAdminHandler, allowGet: true },
  { prefix: "/api/cron/ai-agents", handler: aiAgentsCronHandler, allowGet: true, exact: true },
  { prefix: "/api/admin/auto-content", handler: autoContentAdminHandler, allowGet: true },
  { prefix: "/api/admin/auto-knowledge-engine", handler: autoKnowledgeAdminHandler, allowGet: true },
  { prefix: "/api/fiqh-research-assistant", handler: fiqhResearchAssistantHandler, rateLimit: fiqhResearchRateLimit, allowGet: true },
  { prefix: "/api/assistant", handler: assistantHandler, rateLimit: assistantRateLimit, allowGet: true },
  { prefix: "/api/test-anthropic", handler: testAnthropicHandler, allowGet: true },
  { prefix: "/api/transcribe", handler: transcribeHandler, rateLimit: transcribeRateLimit },
];

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

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET" && route.allowGet) {
    req.body = {};
    try {
      await route.handler(req, res);
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
      await route.handler(req, res);
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
