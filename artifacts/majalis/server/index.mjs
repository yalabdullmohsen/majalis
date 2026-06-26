import express from "express";
import compression from "compression";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assistantHandler from "../api/assistant.js";
import assistantHealthHandler from "../api/assistant/health.js";
import testAnthropicHandler from "../api/test-anthropic.js";
import transcribeHandler from "../api/transcribe.js";
import prayerTimesHandler from "../api/prayer-times.js";
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
import autonomousOrchestratorHandler from "../api/cron/autonomous-orchestrator.js";
import autonomousAiAdminHandler from "../api/admin/autonomous-ai.js";
import dailyContentHandler from "../api/daily-content.js";
import globalReferenceHandler from "../api/global-reference.js";
import globalReferenceAdminHandler from "../api/admin/global-reference.js";
import globalReferenceReviewHandler from "../api/cron/global-reference-review.js";
import islamicIntelligenceHandler from "../api/cron/islamic-intelligence.js";
import islamicIntelligenceAdminHandler from "../api/admin/islamic-intelligence.js";
import v1Handler from "../api/v1.js";
import v2Handler from "../api/v2.js";
import v3Handler from "../api/v3.js";
import openPlatformAdminHandler from "../api/admin/open-platform.js";
import scholarlySearchHandler from "../api/scholarly-search.js";
import fiqhResearchAssistantHandler from "../api/fiqh-research-assistant.js";
import { createRateLimiter } from "./rate-limit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const distDir = path.resolve(appRoot, "dist");
const seoPrerenderDir = path.resolve(appRoot, "seo-prerender");

const rawPort = process.env.PORT || "24216";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const app = express();
app.disable("x-powered-by");
app.use(compression());

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

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

function runHandler(handler, label) {
  return (req, res) => {
    handler(req, res).catch((error) => {
      console.error(`Unhandled ${label} error`, error);
      if (!res.headersSent) {
        const isTranscribe = label === "transcribe";
        res.status(isTranscribe ? 500 : 200).json(
          isTranscribe
            ? { error: "تعذر إكمال العملية. حاول لاحقًا." }
            : { ok: false, message: "تعذر تشغيل المساعد الآن، حاول لاحقًا.", fallback: true },
        );
      }
    });
  };
}

app.options("/api/assistant", (_req, res) => {
  res.status(204).end();
});

app.options("/api/transcribe", (_req, res) => {
  res.status(204).end();
});

app.get("/api/assistant/health", runHandler(assistantHealthHandler, "assistant-health"));
app.get("/api/assistant", runHandler(assistantHandler, "assistant"));
app.post("/api/assistant", express.json({ limit: "32kb" }), assistantRateLimit, runHandler(assistantHandler, "assistant"));
app.get("/api/test-anthropic", runHandler(testAnthropicHandler, "test-anthropic"));
app.post("/api/test-anthropic", runHandler(testAnthropicHandler, "test-anthropic"));
app.post("/api/transcribe", express.json({ limit: "2mb" }), transcribeRateLimit, runHandler(transcribeHandler, "transcribe"));

const fiqhResearchRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "fiqh-research",
});

app.get("/api/fiqh-research-assistant", runHandler(fiqhResearchAssistantHandler, "fiqh-research"));
app.post("/api/fiqh-research-assistant", express.json({ limit: "32kb" }), fiqhResearchRateLimit, runHandler(fiqhResearchAssistantHandler, "fiqh-research"));

app.get("/api/prayer-times", runHandler(prayerTimesHandler, "prayer-times"));
app.get("/api/cron/sync-data", runHandler(syncDataHandler, "cron-sync-data"));
app.post("/api/cron/sync-data", runHandler(syncDataHandler, "cron-sync-data"));
app.get("/api/cron/knowledge-sync", runHandler(knowledgeSyncHandler, "cron-knowledge-sync"));
app.post("/api/cron/knowledge-sync", runHandler(knowledgeSyncHandler, "cron-knowledge-sync"));
app.get("/api/admin/knowledge-pipeline", runHandler(knowledgePipelineHandler, "knowledge-pipeline"));
app.post("/api/admin/knowledge-pipeline", express.json({ limit: "32kb" }), runHandler(knowledgePipelineHandler, "knowledge-pipeline"));
app.get("/api/knowledge-search", runHandler(knowledgeSearchHandler, "knowledge-search"));
app.post("/api/knowledge-search", express.json({ limit: "16kb" }), runHandler(knowledgeSearchHandler, "knowledge-search"));
app.get("/api/cron/auto-content-sync", runHandler(autoContentSyncHandler, "auto-content-sync"));
app.post("/api/cron/auto-content-sync", runHandler(autoContentSyncHandler, "auto-content-sync"));
app.get("/api/cron/auto-content-health", runHandler(autoContentHealthHandler, "auto-content-health"));
app.post("/api/cron/auto-content-health", runHandler(autoContentHealthHandler, "auto-content-health"));
app.get("/api/cron/system-health", runHandler(systemHealthHandler, "system-health"));
app.post("/api/cron/system-health", runHandler(systemHealthHandler, "system-health"));
app.get("/api/cron/apply-migrations", runHandler(applyMigrationsHandler, "apply-migrations"));
app.post("/api/cron/apply-migrations", runHandler(applyMigrationsHandler, "apply-migrations"));
app.get("/api/cron/bootstrap-database", runHandler(bootstrapDatabaseHandler, "bootstrap-database"));
app.post("/api/cron/bootstrap-database", runHandler(bootstrapDatabaseHandler, "bootstrap-database"));
app.get("/api/cron/auto-knowledge-sync", runHandler(autoKnowledgeSyncHandler, "auto-knowledge-sync"));
app.post("/api/cron/auto-knowledge-sync", runHandler(autoKnowledgeSyncHandler, "auto-knowledge-sync"));
app.get("/api/cron/connector-health", runHandler(connectorHealthHandler, "connector-health"));
app.post("/api/cron/connector-health", runHandler(connectorHealthHandler, "connector-health"));
app.get("/api/auto-content", runHandler(autoContentHandler, "auto-content"));
app.get("/api/knowledge-recommendations", runHandler(knowledgeRecommendationsHandler, "knowledge-recommendations"));
app.get("/api/intelligent-search", runHandler(intelligentSearchHandler, "intelligent-search"));
app.post("/api/intelligent-search", express.json({ limit: "16kb" }), runHandler(intelligentSearchHandler, "intelligent-search"));
app.get("/api/topic-content", runHandler(topicContentHandler, "topic-content"));
app.get("/api/content-relations", runHandler(contentRelationsHandler, "content-relations"));
app.post("/api/content-relations", express.json({ limit: "8kb" }), runHandler(contentRelationsHandler, "content-relations"));
app.get("/api/scholarly-search", runHandler(scholarlySearchHandler, "scholarly-search"));
app.get("/api/admin/search-analytics", runHandler(searchAnalyticsHandler, "search-analytics"));
app.post("/api/admin/search-analytics", express.json({ limit: "8kb" }), runHandler(searchAnalyticsHandler, "search-analytics"));
app.get("/api/digital-learning", runHandler(digitalLearningHandler, "digital-learning"));
app.post("/api/digital-learning", express.json({ limit: "32kb" }), runHandler(digitalLearningHandler, "digital-learning"));
app.get("/api/admin/digital-learning", runHandler(digitalLearningAdminHandler, "digital-learning-admin"));
app.post("/api/admin/digital-learning", express.json({ limit: "16kb" }), runHandler(digitalLearningAdminHandler, "digital-learning-admin"));
app.get("/api/cron/autonomous-orchestrator", runHandler(autonomousOrchestratorHandler, "autonomous-orchestrator"));
app.post("/api/cron/autonomous-orchestrator", runHandler(autonomousOrchestratorHandler, "autonomous-orchestrator"));
app.get("/api/admin/autonomous-ai", runHandler(autonomousAiAdminHandler, "autonomous-ai-admin"));
app.post("/api/admin/autonomous-ai", express.json({ limit: "32kb" }), runHandler(autonomousAiAdminHandler, "autonomous-ai-admin"));
app.get("/api/daily-content", runHandler(dailyContentHandler, "daily-content"));
app.get("/api/global-reference", runHandler(globalReferenceHandler, "global-reference"));
app.get("/api/admin/global-reference", runHandler(globalReferenceAdminHandler, "global-reference-admin"));
app.post("/api/admin/global-reference", express.json({ limit: "32kb" }), runHandler(globalReferenceAdminHandler, "global-reference-admin"));
app.get("/api/cron/global-reference-review", runHandler(globalReferenceReviewHandler, "global-reference-review"));
app.post("/api/cron/global-reference-review", runHandler(globalReferenceReviewHandler, "global-reference-review"));
app.get("/api/cron/islamic-intelligence", runHandler(islamicIntelligenceHandler, "islamic-intelligence"));
app.post("/api/cron/islamic-intelligence", runHandler(islamicIntelligenceHandler, "islamic-intelligence"));
app.get("/api/admin/islamic-intelligence", runHandler(islamicIntelligenceAdminHandler, "islamic-intelligence-admin"));
app.post("/api/admin/islamic-intelligence", express.json({ limit: "32kb" }), runHandler(islamicIntelligenceAdminHandler, "islamic-intelligence-admin"));
const apiV1 = runHandler(v1Handler, "api-v1");
const apiV2 = runHandler(v2Handler, "api-v2");
const apiV3 = runHandler(v3Handler, "api-v3");
app.get("/api/v1", apiV1);
app.get("/api/v1/docs", apiV1);
app.get("/api/v1/search", apiV1);
app.get("/api/v1/resources", apiV1);
app.get("/api/v1/topics", apiV1);
app.get("/api/v1/topics/:id", apiV1);
app.get("/api/v1/relations", apiV1);
app.get("/api/v1/sources", apiV1);
app.get("/api/v1/:resource", apiV1);
app.get("/api/v1/:resource/:id", apiV1);
app.get("/api/v2", apiV2);
app.get("/api/v2/docs", apiV2);
app.get("/api/v2/search", apiV2);
app.get("/api/v2/:resource", apiV2);
app.get("/api/v2/:resource/:id", apiV2);
app.get("/api/v3", apiV3);
app.get("/api/v3/docs", apiV3);
app.get("/api/v3/search", apiV3);
app.get("/api/v3/relations", apiV3);
app.get("/api/v3/:resource", apiV3);
app.get("/api/v3/:resource/:id", apiV3);
app.get("/api/admin/open-platform", runHandler(openPlatformAdminHandler, "open-platform-admin"));
app.post("/api/admin/open-platform", express.json({ limit: "32kb" }), runHandler(openPlatformAdminHandler, "open-platform-admin"));
app.get("/api/admin/auto-content", runHandler(autoContentAdminHandler, "auto-content-admin"));
app.post("/api/admin/auto-content", express.json({ limit: "16kb" }), runHandler(autoContentAdminHandler, "auto-content-admin"));
app.get("/api/admin/auto-knowledge-engine", runHandler(autoKnowledgeAdminHandler, "auto-knowledge-admin"));
app.post("/api/admin/auto-knowledge-engine", express.json({ limit: "32kb" }), runHandler(autoKnowledgeAdminHandler, "auto-knowledge-admin"));

app.get("/api/healthz", (_req, res) => {
  res.json({ ok: true, service: "majalis-web" });
});

function prerenderPath(urlPath) {
  if (urlPath === "/") {
    const rootSeo = path.join(seoPrerenderDir, "index.html");
    if (existsSync(rootSeo)) return rootSeo;
    const distRootSeo = path.join(distDir, "index.seo.html");
    if (existsSync(distRootSeo)) return distRootSeo;
    return path.join(distDir, "index.html");
  }

  const normalized = urlPath.replace(/\/+$/, "") || "/";
  if (normalized.startsWith("/lessons/") && normalized !== "/lessons") {
    const lessonSeo = path.join(seoPrerenderDir, normalized.slice(1), "index.html");
    if (existsSync(lessonSeo)) return lessonSeo;
  }

  const nestedSeo = path.join(seoPrerenderDir, normalized.slice(1), "index.html");
  if (existsSync(nestedSeo)) return nestedSeo;
  return path.join(distDir, "index.html");
}

app.use(
  express.static(distDir, {
    index: false,
    maxAge: "1h",
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }
  if (req.path.startsWith("/api/")) {
    return next();
  }
  const ua = req.headers["user-agent"] || "";
  const isBot = /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot/i.test(ua);
  res.sendFile(isBot ? prerenderPath(req.path) : path.join(distDir, "index.html"));
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "المسار غير موجود." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`المجلس العلمي — الخادم يعمل على http://0.0.0.0:${port}`);
});
