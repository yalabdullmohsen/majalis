import assistantHandler from "../api/assistant.js";
import { createRateLimiter } from "./rate-limit.mjs";

const assistantRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 15,
  keyPrefix: "assistant-dev",
});

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

export function majalisApiPlugin() {
  return {
    name: "majalis-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/assistant")) {
          return next();
        }

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          sendJson(res, 405, { error: "الطريقة غير مدعومة." });
          return;
        }

        assistantRateLimit(req, res, async () => {
          const body = await readJsonBody(req);
          if (body === null) {
            sendJson(res, 400, { error: "صيغة الطلب غير صالحة. أرسل JSON يحتوي على messages." });
            return;
          }

          req.body = body;
          try {
            await assistantHandler(req, res);
          } catch (error) {
            console.error("Assistant dev handler failed", error);
            if (!res.headersSent) {
              sendJson(res, 500, { error: "حدث خطأ غير متوقع في خدمة المساعد الذكي." });
            }
          }
        });
      });
    },
  };
}
