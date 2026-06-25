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
import autoContentHandler from "../api/auto-content.js";
import autoContentAdminHandler from "../api/admin/auto-content.js";
import autoKnowledgeSyncHandler from "../api/cron/auto-knowledge-sync.js";
import connectorHealthHandler from "../api/cron/connector-health.js";
import autoKnowledgeAdminHandler from "../api/admin/auto-knowledge-engine.js";
import knowledgeRecommendationsHandler from "../api/knowledge-recommendations.js";
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
app.get("/api/cron/auto-knowledge-sync", runHandler(autoKnowledgeSyncHandler, "auto-knowledge-sync"));
app.post("/api/cron/auto-knowledge-sync", runHandler(autoKnowledgeSyncHandler, "auto-knowledge-sync"));
app.get("/api/cron/connector-health", runHandler(connectorHealthHandler, "connector-health"));
app.post("/api/cron/connector-health", runHandler(connectorHealthHandler, "connector-health"));
app.get("/api/auto-content", runHandler(autoContentHandler, "auto-content"));
app.get("/api/knowledge-recommendations", runHandler(knowledgeRecommendationsHandler, "knowledge-recommendations"));
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
