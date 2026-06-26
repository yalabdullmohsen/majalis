import { handleOpenPlatformRequest } from "../lib/open-platform/router.mjs";
import { generateOpenApiSpec, generateDocsHtml } from "../lib/open-platform/docs.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    if (typeof res.status === "function") res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (req.query?.format === "html" || req.query?.action === "docs") {
    if (req.query?.format === "json") {
      if (typeof res.status === "function") return res.status(200).json(generateOpenApiSpec("v3"));
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(generateOpenApiSpec("v3")));
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(generateDocsHtml("v3"));
  }

  return handleOpenPlatformRequest(req, res, "v3");
}
