export function majalisApiPlugin() {
  return {
    name: "majalis-api",
    configureServer(server) {
      let dispatchModule;

      async function getDispatch() {
        if (!dispatchModule) {
          dispatchModule = await import("../lib/api-dispatch.mjs");
        }
        return dispatchModule;
      }

      server.middlewares.use(async (req, res, next) => {
        const { matchApiRoute, sendJson, getDevRouteHandler } = await getDispatch();
        const route = matchApiRoute(req.url);
        if (!route) return next();

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        const handler = await getDevRouteHandler(route);

        if (req.method === "GET" && route.allowGet) {
          req.body = {};
          try {
            await handler(req, res);
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
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const raw = Buffer.concat(chunks).toString("utf8");
          let body = {};
          if (raw) {
            try {
              body = JSON.parse(raw);
            } catch {
              sendJson(res, 400, { ok: false, message: "اكتب سؤالك أولًا." });
              return;
            }
          }

          req.body = body;
          try {
            await handler(req, res);
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
