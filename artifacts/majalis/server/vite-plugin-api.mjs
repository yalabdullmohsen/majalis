import assistantHandler from "../api/assistant.js";
import assistantHealthHandler from "../api/assistant/health.js";
import testAnthropicHandler from "../api/test-anthropic.js";
import transcribeHandler from "../api/transcribe.js";
import prayerTimesHandler from "../api/prayer-times.js";
import fiqhResearchAssistantHandler from "../api/fiqh-research-assistant.js";
import syncDataHandler from "../api/cron/sync-data.js";
import knowledgeSyncHandler from "../api/cron/knowledge-sync.js";
import knowledgePipelineHandler from "../api/admin/knowledge-pipeline.js";
import knowledgeSearchHandler from "../api/knowledge-search.js";
import autoContentHealthHandler from "../api/cron/auto-content-health.js";
import autoContentSyncHandler from "../api/cron/auto-content-sync.js";
import systemHealthHandler from "../api/cron/system-health.js";
import applyMigrationsHandler from "../api/cron/apply-migrations.js";
import bootstrapDatabaseHandler from "../api/cron/bootstrap-database.js";
import autoContentHandler from "../api/auto-content.js";
import autoContentAdminHandler from "../api/admin/auto-content.js";
import autoKnowledgeSyncHandler from "../api/cron/auto-knowledge-sync.js";
import connectorHealthHandler from "../api/cron/connector-health.js";
import autoKnowledgeAdminHandler from "../api/admin/auto-knowledge-engine.js";
import knowledgeRecommendationsHandler from "../api/knowledge-recommendations.js";
import intelligentSearchHandler from "../api/intelligent-search.js";
import topicContentHandler from "../api/topic-content.js";
import contentRelationsHandler from "../api/content-relations.js";
import searchAnalyticsHandler from "../api/admin/search-analytics.js";
import digitalLearningHandler from "../api/digital-learning.js";
import digitalLearningAdminHandler from "../api/admin/digital-learning.js";
import scholarlySearchHandler from "../api/scholarly-search.js";
import { createRateLimiter } from "./rate-limit.mjs";

const assistantRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 15,
  keyPrefix: "assistant-dev",
});

const transcribeRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 8,
  keyPrefix: "transcribe-dev",
});

const fiqhResearchRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "fiqh-research-dev",
});

const API_ROUTES = [
  { prefix: "/api/assistant/health", handler: assistantHealthHandler, allowGet: true, exact: true },
  { prefix: "/api/prayer-times", handler: prayerTimesHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/sync-data", handler: syncDataHandler, allowGet: true, exact: true },
  { prefix: "/api/cron/knowledge-sync", handler: knowledgeSyncHandler, allowGet: true, exact: true },
  { prefix: "/api/admin/knowledge-pipeline", handler: knowledgePipelineHandler, allowGet: true },
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
  { prefix: "/api/admin/auto-content", handler: autoContentAdminHandler, allowGet: true },
  { prefix: "/api/admin/auto-knowledge-engine", handler: autoKnowledgeAdminHandler, allowGet: true },
  { prefix: "/api/fiqh-research-assistant", handler: fiqhResearchAssistantHandler, rateLimit: fiqhResearchRateLimit, allowGet: true },
  { prefix: "/api/assistant", handler: assistantHandler, rateLimit: assistantRateLimit, allowGet: true },
  { prefix: "/api/test-anthropic", handler: testAnthropicHandler, allowGet: true },
  { prefix: "/api/transcribe", handler: transcribeHandler, rateLimit: transcribeRateLimit },
];

async function readJsonBody(req) {
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

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function matchRoute(url) {
  const path = (url || "").split("?")[0];
  return API_ROUTES.find((route) =>
    route.exact ? path === route.prefix : path === route.prefix || path.startsWith(`${route.prefix}?`),
  );
}

export function majalisApiPlugin() {
  return {
    name: "majalis-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const route = matchRoute(req.url);
        if (!route) return next();

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
            console.error(`${route.prefix} dev GET handler failed`, error);
            if (!res.headersSent) {
              sendJson(res, 200, {
                ok: false,
                message: "تعذر تشغيل المساعد الآن، حاول لاحقًا.",
                fallback: true,
              });
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
            console.error(`${route.prefix} dev handler failed`, error);
            if (!res.headersSent) {
              sendJson(res, 200, {
                ok: false,
                message: "تعذر تشغيل المساعد الآن، حاول لاحقًا.",
                fallback: true,
              });
            }
          }
        };

        if (route.rateLimit) {
          route.rateLimit(req, res, runPost);
        } else {
          await runPost();
        }
      });
    },
  };
}
