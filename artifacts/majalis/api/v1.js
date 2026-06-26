import { handleOpenPlatformRequest } from "../lib/open-platform/router.mjs";
import { generateOpenApiSpec, generateDocsHtml } from "../lib/open-platform/docs.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    if (typeof res.status === "function") res.status(405).json({ ok: false, error: "Method not allowed" });
    else { res.statusCode = 405; res.end(JSON.stringify({ ok: false })); }
    return;
  }

  if (req.query?.format === "html" || req.query?.action === "docs") {
    if (req.query?.format === "json") {
      if (typeof res.status === "function") res.status(200).json(generateOpenApiSpec("v1"));
      else { res.statusCode = 200; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(generateOpenApiSpec("v1"))); }
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(generateDocsHtml("v1"));
    return;
  }

  return handleOpenPlatformRequest(req, res, "v1");
}
