/**
 * Phase 5 — Plugin-based source connector registry.
 * Add new platforms here without changing the monitor core.
 */
import { InstagramConnector } from "./instagram-connector-plugin.mjs";
import { RssConnector } from "./rss-connector.mjs";
import { WebConnector } from "./web-connector.mjs";
import { BaseSourceConnector } from "./base-connector.mjs";

const CONNECTOR_MAP = {
  instagram: InstagramConnector,
  rss: RssConnector,
  website: WebConnector,
  youtube: WebConnector,
  telegram: WebConnector,
  x: WebConnector,
  twitter: WebConnector,
  facebook: WebConnector,
  whatsapp: WebConnector,
  manual: WebConnector,
  mosque: WebConnector,
  ministry: WebConnector,
  association: WebConnector,
  scholarly: WebConnector,
};

export function createSourceConnector(source) {
  const type = String(source.source_type || source.platform || "website").toLowerCase();
  const Cls = CONNECTOR_MAP[type] || WebConnector;
  return new Cls(source);
}

export function listSupportedConnectors() {
  return Object.keys(CONNECTOR_MAP);
}

export { BaseSourceConnector, InstagramConnector, RssConnector, WebConnector };
