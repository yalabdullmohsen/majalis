/**
 * Open Platform — OpenAPI 3.0 spec generator.
 */

import { OPEN_RESOURCES, WEBHOOK_EVENTS, API_VERSIONS, RATE_LIMITS } from "./config.mjs";

export function generateOpenApiSpec(version = "v1") {
  const resources = Object.entries(OPEN_RESOURCES).map(([id, r]) => ({
    name: id,
    description: `${r.label} (${r.label_en})`,
  }));

  const paths = {
    [`/api/${version}`]: {
      get: {
        summary: "API root — list available endpoints",
        tags: ["Meta"],
        security: [{ ApiKeyAuth: [] }],
        responses: { 200: { description: "API info" } },
      },
    },
    [`/api/${version}/resources`]: {
      get: {
        summary: "List all content resources",
        tags: ["Resources"],
        security: [{ ApiKeyAuth: [] }],
        responses: { 200: { description: "Resource list" } },
      },
    },
    [`/api/${version}/search`]: {
      get: {
        summary: "Unified search",
        tags: ["Search"],
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Search query" },
          { name: "mode", in: "query", schema: { type: "string", enum: ["text", "semantic", "hybrid"] } },
          { name: "type", in: "query", schema: { type: "string" }, description: "Filter by content type" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["updated_at", "created_at", "title"] } },
          { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
        ],
        responses: {
          200: { description: "Search results with pagination" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    [`/api/${version}/topics`]: {
      get: {
        summary: "List Islamic topics",
        tags: ["Topics"],
        security: [{ ApiKeyAuth: [] }],
        responses: { 200: { description: "Topic list" } },
      },
    },
    [`/api/${version}/topics/{slug}`]: {
      get: {
        summary: "Get topic content hub",
        tags: ["Topics"],
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Topic sections" } },
      },
    },
    [`/api/${version}/relations`]: {
      get: {
        summary: "Get content relations graph",
        tags: ["Relations"],
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: "ref", in: "query", required: true, schema: { type: "string" }, description: "Global ref ID" },
          { name: "depth", in: "query", schema: { type: "integer", default: 2 } },
          { name: "graph", in: "query", schema: { type: "string", enum: ["1", "0"] } },
        ],
        responses: { 200: { description: "Relations or graph" } },
      },
    },
    [`/api/${version}/sources`]: {
      get: {
        summary: "List trusted scholarly sources",
        tags: ["Sources"],
        security: [{ ApiKeyAuth: [] }],
        responses: { 200: { description: "Source registry" } },
      },
    },
  };

  for (const [id, r] of Object.entries(OPEN_RESOURCES)) {
    paths[`/api/${version}/${id}`] = {
      get: {
        summary: `List ${r.label_en}`,
        tags: ["Content"],
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "sort", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: `${r.label} list` } },
      },
    };
    paths[`/api/${version}/${id}/{id}`] = {
      get: {
        summary: `Get ${r.label_en} item`,
        tags: ["Content"],
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Single item" }, 404: { description: "Not found" } },
      },
    };
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Majalis Open Islamic Platform API",
      description: "Official API for Islamic scholarly content — Quran, Hadith, Fatwas, Lessons, and more.",
      version,
      contact: { name: "المجلس العلمي", url: "https://majalis.app" },
    },
    servers: [{ url: "https://majalis.app", description: "Production" }, { url: "http://localhost:5173", description: "Development" }],
    tags: [
      { name: "Meta", description: "API metadata" },
      { name: "Search", description: "Text and semantic search" },
      { name: "Content", description: "Content resources" },
      { name: "Topics", description: "Islamic topic hubs" },
      { name: "Relations", description: "Knowledge graph" },
      { name: "Sources", description: "Trusted sources" },
      { name: "Webhooks", description: "Event notifications" },
    ],
    paths,
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key", description: "API key (maj_...)" },
        BearerAuth: { type: "http", scheme: "bearer", description: "Bearer token (API key or OAuth)" },
      },
      schemas: {
        OpenPlatformItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            kind: { type: "string" },
            ref_id: { type: "string", example: "majalis:fatwa:123" },
            title: { type: "string" },
            summary: { type: "string" },
            author: { type: "string" },
            source_url: { type: "string" },
            verification_status: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            total_pages: { type: "integer" },
            has_next: { type: "boolean" },
            has_prev: { type: "boolean" },
          },
        },
        Error: {
          type: "object",
          properties: {
            ok: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
    "x-webhook-events": WEBHOOK_EVENTS,
    "x-rate-limits": RATE_LIMITS,
    "x-versions": API_VERSIONS,
    "x-resources": resources,
  };
}

export function generateDocsHtml(version = "v1") {
  const spec = generateOpenApiSpec(version);
  const resources = Object.entries(OPEN_RESOURCES)
    .map(([id, r]) => `<li><code>GET /api/${version}/${id}</code> — ${r.label}</li>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Majalis API Docs v${version}</title>
  <style>
    body { font-family: "Times New Roman", Times, serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
    h1 { color: #1a472a; }
    .endpoint { margin: 0.5rem 0; }
    .auth { background: #fff3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>المجلس العلمي — Open Islamic Platform API v${version}</h1>
  <div class="auth">
    <strong>المصادقة:</strong> أرسل <code>X-API-Key: maj_...</code> أو <code>Authorization: Bearer maj_...</code>
  </div>
  <h2>البحث</h2>
  <div class="endpoint"><code>GET /api/${version}/search?q=الصلاة&mode=hybrid&page=1&limit=20</code></div>
  <h2>المحتوى (${spec["x-resources"]?.length || 0} قسم)</h2>
  <ul>${resources}</ul>
  <h2>Webhooks</h2>
  <ul>${WEBHOOK_EVENTS.map((e) => `<li><code>${e}</code></li>`).join("")}</ul>
  <h2>حدود الاستهلاك</h2>
  <ul>
    <li>Free: ${RATE_LIMITS.free.requests_per_minute}/min, ${RATE_LIMITS.free.requests_per_day}/day</li>
    <li>Standard: ${RATE_LIMITS.standard.requests_per_minute}/min</li>
    <li>Partner: ${RATE_LIMITS.partner.requests_per_minute}/min</li>
  </ul>
  <p><a href="/api/${version}/docs?format=json">OpenAPI JSON</a></p>
</body>
</html>`;
}
