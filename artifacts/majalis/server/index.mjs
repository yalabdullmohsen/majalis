import express from "express";
import compression from "compression";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assistantHandler from "../api/assistant.js";
import assistantHealthHandler from "../api/assistant/health.js";
import testAnthropicHandler from "../api/test-anthropic.js";
import transcribeHandler from "../api/transcribe.js";
import { createRateLimiter } from "./rate-limit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const distDir = path.resolve(appRoot, "dist/public");
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
  const nestedSeo = path.join(seoPrerenderDir, urlPath.slice(1), "index.html");
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
  console.log(`Majalis web server listening on http://0.0.0.0:${port}`);
});
