import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assistantHandler from "../api/assistant.js";
import { createRateLimiter } from "./rate-limit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const distDir = path.resolve(appRoot, "dist/public");

const rawPort = process.env.PORT || "24216";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

const assistantRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 15,
  keyPrefix: "assistant",
});

function runAssistantHandler(req, res) {
  assistantHandler(req, res).catch((error) => {
    console.error("Unhandled assistant error", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "حدث خطأ غير متوقع في خدمة المساعد الذكي." });
    }
  });
}

app.options("/api/assistant", (_req, res) => {
  res.status(204).end();
});

app.post("/api/assistant", assistantRateLimit, runAssistantHandler);

app.get("/api/healthz", (_req, res) => {
  res.json({ ok: true, service: "majalis-web" });
});

app.use(express.static(distDir, { index: false, maxAge: "1h" }));

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(distDir, "index.html"));
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "المسار غير موجود." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Majalis web server listening on http://0.0.0.0:${port}`);
});
