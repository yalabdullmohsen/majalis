/**
 * Open Platform — internal API client for AI agents.
 * All agents use this instead of direct DB access — single unified path.
 */

import { listResource, getResourceItem, listTopics, getTopic, listResources } from "./content.mjs";
import { openSearch } from "./search.mjs";
import { getRelations } from "../global-reference/relations.mjs";
import { getAllSources } from "../global-reference/sources.mjs";

const INTERNAL_KEY = { id: "internal", tier: "partner", scopes: ["read", "search", "relations", "admin"] };

export async function internalApi(admin, { resource, id, action, query, opts = {} }) {
  const version = opts.version || "v2";

  switch (action || (id ? "get" : resource ? "list" : "search")) {
    case "search":
      return openSearch(admin, { q: query, ...opts, version });
    case "list":
      return listResource(admin, resource, { ...opts, version });
    case "get":
      return getResourceItem(admin, resource, id, { version });
    case "topics":
      return id ? getTopic(admin, id, opts) : listTopics(admin);
    case "relations":
      return getRelations(admin, id || opts.ref);
    case "sources":
      return { ok: true, data: await getAllSources(admin) };
    case "resources":
      return listResources();
    default:
      if (resource && id) return getResourceItem(admin, resource, id, { version });
      if (resource) return listResource(admin, resource, { ...opts, version });
      if (query) return openSearch(admin, { q: query, ...opts, version });
      return listResources();
  }
}

/** Drop-in replacement for direct unifiedSearch in AI agents */
export async function agentSearch(admin, query, opts = {}) {
  return internalApi(admin, { action: "search", query, opts: { ...opts, mode: opts.mode || "hybrid" } });
}

/** Drop-in for content discovery in islamic-intelligence */
export async function agentListContent(admin, resource, opts = {}) {
  return internalApi(admin, { resource, action: "list", opts });
}

export async function agentGetContent(admin, resource, id, opts = {}) {
  return internalApi(admin, { resource, id, action: "get", opts });
}

export { INTERNAL_KEY };
