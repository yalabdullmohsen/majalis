/**
 * REST API connector — configurable HTTP method + JSON path.
 */
export const type = "rest";

export async function fetch(source, contentType, { fetchText, fetchJson }) {
  const cfg = source.connector_config || source.metadata?.connector_config || {};
  const method = (cfg.method || "GET").toUpperCase();
  const headers = { ...(cfg.headers || {}), Accept: "application/json" };
  const url = source.source_url;

  let data;
  if (fetchJson) {
    data = await fetchJson(url, { method, headers, body: cfg.body ? JSON.stringify(cfg.body) : undefined });
  } else {
    const text = await fetchText(url, { method, headers, body: cfg.body ? JSON.stringify(cfg.body) : undefined });
    data = JSON.parse(text);
  }

  const { fetch: jsonFetch } = await import("./json.mjs");
  return jsonFetch({ ...source, connector_config: cfg }, contentType, {
    fetchText: async () => JSON.stringify(data),
  });
}
