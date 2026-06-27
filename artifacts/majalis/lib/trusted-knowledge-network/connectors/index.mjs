/**
 * Connector registry — plugin-based source fetchers.
 * Add new source types by registering a connector module; no core code changes.
 */
import * as rss from "./rss.mjs";
import * as json from "./json.mjs";
import * as xml from "./xml.mjs";
import * as rest from "./rest.mjs";
import * as csv from "./csv.mjs";
import * as markdown from "./markdown.mjs";
import * as html from "./html.mjs";
import * as database from "./database.mjs";
import { PERFORMANCE } from "../../majlis-knowledge-engine/config.mjs";

const REGISTRY = {
  rss,
  json,
  xml,
  rest,
  csv,
  markdown,
  html,
  database,
};

const FETCH_TIMEOUT = PERFORMANCE.fetchTimeoutMs || 20000;

export function listConnectors() {
  return Object.keys(REGISTRY).map((type) => ({
    type,
    label: type.toUpperCase(),
  }));
}

export function resolveConnector(source) {
  const type = source.parser || source.source_type || "rss";
  const connector = REGISTRY[type];
  if (!connector) {
    return REGISTRY.rss;
  }
  return connector;
}

async function fetchText(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      method: opts.method || "GET",
      headers: {
        "User-Agent": "MajlisIlm-TKN/5.0 (+https://www.majlisilm.com)",
        ...(opts.headers || {}),
      },
      body: opts.body,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, opts = {}) {
  const text = await fetchText(url, opts);
  return JSON.parse(text);
}

export async function fetchFromConnector(source, contentType) {
  const connector = resolveConnector(source);
  const ctx = { fetchText, fetchJson };
  const items = await connector.fetch(source, contentType, ctx);
  return Array.isArray(items) ? items : [];
}

export { REGISTRY };
