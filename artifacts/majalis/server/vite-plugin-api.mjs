import assistantHandler from "../api/assistant.js";
import transcribeHandler from "../api/transcribe.js";
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

const API_ROUTES = [
  { prefix: "/api/assistant", handler: assistantHandler, rateLimit: assistantRateLimit },
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
  return API_ROUTES.find((route) => url?.startsWith(route.prefix));
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

        if (req.method === "GET" && route.prefix === "/api/assistant") {
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

        route.rateLimit(req, res, async () => {
          const body = await readJsonBody(req);
          if (body === null) {
            sendJson(res, 400, { ok: false, message: "اكتب سؤالك أولًا." });
            return;
          }

          req.body = body;
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
        });
      });
    },
  };
}
