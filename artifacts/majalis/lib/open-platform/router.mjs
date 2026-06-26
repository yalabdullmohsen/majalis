/**
 * Open Platform — versioned API router (v1/v2/v3).
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { API_VERSIONS, SUPPORTED_VERSIONS, ERROR_CODES } from "./config.mjs";
import { validateApiKey } from "./auth.mjs";
import { checkRateLimit } from "./rate-limit.mjs";
import { logApiRequest } from "./audit.mjs";
import { listResource, getResourceItem, listTopics, getTopic, listResources } from "./content.mjs";
import { openSearch } from "./search.mjs";
import { getRelations, getRelationGraph } from "../global-reference/relations.mjs";
import { getAllSources } from "../global-reference/sources.mjs";
import { resolveGlobalRef } from "../global-reference/ids.mjs";
import { generateOpenApiSpec } from "./docs.mjs";

function getClientIp(req) {
  return req.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

export async function handleOpenPlatformRequest(req, res, version = "v1") {
  const started = Date.now();
  const versionMeta = API_VERSIONS[version];

  if (!SUPPORTED_VERSIONS.includes(version)) {
    return formatError(res, ERROR_CODES.BAD_REQUEST, { message: `Unsupported version: ${version}` });
  }

  if (versionMeta?.deprecated) {
    return formatError(res, ERROR_CODES.VERSION_DEPRECATED, { sunset: versionMeta.sunset });
  }

  const path = req.query?.path || req.url?.split("?")[0]?.replace(`/api/${version}`, "").replace(/^\//, "") || "";
  const segments = path.split("/").filter(Boolean);
  const resource = req.params?.resource || segments[0] || req.query?.resource;
  const id = req.params?.id || segments[1] || req.query?.id;
  const action = req.query?.action;

  const admin = getSupabaseAdmin();

  const auth = await validateApiKey(req, { requiredScope: resource === "search" ? "search" : "read", resource });
  if (!auth.ok) {
    await logApiRequest(admin, { path: `/${version}/${resource}`, version, status_code: auth.error.status, ip: getClientIp(req), error: auth.error.message });
    return formatError(res, auth.error);
  }

  const rateCheck = checkRateLimit(auth.keyRecord.id, auth.keyRecord.tier);
  if (!rateCheck.ok) {
    res.setHeader("Retry-After", String(Math.ceil(rateCheck.retry_after)));
    return formatError(res, ERROR_CODES.RATE_LIMITED, { retry_after: rateCheck.retry_after, window: rateCheck.window });
  }

  res.setHeader("X-RateLimit-Remaining-Minute", String(rateCheck.remaining?.minute ?? 0));
  res.setHeader("X-RateLimit-Remaining-Day", String(rateCheck.remaining?.day ?? 0));
  res.setHeader("X-API-Version", version);

  let result;
  const opts = {
    version,
    page: Number(req.query?.page || 1),
    limit: Number(req.query?.limit || 20),
    sort: req.query?.sort,
    order: req.query?.order,
    filters: {
      category: req.query?.category,
      author: req.query?.author,
      status: req.query?.status,
      q: req.query?.q,
    },
  };

  try {
    if (resource === "docs" || action === "docs") {
      result = { ok: true, spec: generateOpenApiSpec(version) };
    } else if (resource === "resources") {
      result = listResources();
    } else if (resource === "search") {
      result = await openSearch(admin, {
        q: req.query?.q,
        mode: req.query?.mode || (version === "v3" ? "hybrid" : "text"),
        filters: opts.filters,
        page: opts.page,
        limit: opts.limit,
        sort: opts.sort,
        order: opts.order,
        version,
      });
    } else if (resource === "topics" && !id) {
      result = await listTopics(admin);
    } else if (resource === "topics" && id) {
      result = await getTopic(admin, id, opts);
    } else if (resource === "sources") {
      const sources = await getAllSources(admin);
      result = { ok: true, data: sources };
    } else if (resource === "relations") {
      const ref = req.query?.ref || id;
      if (version === "v3" && req.query?.graph === "1") {
        const graph = await getRelationGraph(admin, ref, Number(req.query?.depth || 2));
        result = { ok: true, ...graph };
      } else {
        const relations = await getRelations(admin, ref);
        result = { ok: true, data: relations };
      }
    } else if (resource === "refs" && id) {
      const ref = await resolveGlobalRef(admin, id);
      result = ref ? { ok: true, data: ref } : { ok: false, error: "not_found" };
    } else if (resource && id) {
      result = await getResourceItem(admin, resource, id, opts);
    } else if (resource) {
      result = await listResource(admin, resource, opts);
    } else {
      result = {
        ok: true,
        version,
        message: "Open Islamic Platform API",
        resources: listResources().data,
        endpoints: {
          search: `/api/${version}/search?q=`,
          resources: `/api/${version}/resources`,
          content: `/api/${version}/{resource}`,
          item: `/api/${version}/{resource}/{id}`,
          topics: `/api/${version}/topics`,
          relations: `/api/${version}/relations?ref=`,
          docs: `/api/${version}/docs`,
        },
      };
    }

    const statusCode = result.ok === false ? (result.error === "not_found" ? 404 : 400) : 200;
    await logApiRequest(admin, {
      key_id: auth.keyRecord.id,
      path: `/${version}/${resource || ""}${id ? `/${id}` : ""}`,
      version,
      resource,
      status_code: statusCode,
      response_ms: Date.now() - started,
      ip: getClientIp(req),
      user_agent: req.headers?.["user-agent"],
    });

    return sendPlatformJson(res, statusCode, { ...result, api_version: version, rate_limit: rateCheck.remaining });
  } catch (error) {
    await logApiRequest(admin, {
      key_id: auth.keyRecord?.id,
      path: `/${version}/${resource}`,
      version,
      status_code: 500,
      response_ms: Date.now() - started,
      ip: getClientIp(req),
      error: error.message,
    });
    return formatError(res, ERROR_CODES.INTERNAL, { message: error.message });
  }
}

function sendPlatformJson(res, status, payload) {
  if (typeof res.status === "function") {
    res.status(status).json(payload);
    return;
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function formatError(res, errorDef, extra = {}) {
  const status = errorDef.status || 400;
  sendPlatformJson(res, status, {
    ok: false,
    error: {
      code: Object.entries(ERROR_CODES).find(([, v]) => v === errorDef)?.[0] || "ERROR",
      message: extra.message || errorDef.message,
      ...extra,
    },
  });
}

export { sendPlatformJson, formatError };
