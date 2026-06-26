import { dispatchApiRequest, matchApiRoute, sendJson } from "../lib/api-dispatch.mjs";

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

export function majalisApiPlugin() {
  return {
    name: "majalis-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const route = matchApiRoute(req.url);
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
