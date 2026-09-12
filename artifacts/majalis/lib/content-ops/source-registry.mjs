/**
 * Source Registry — approved sources only for Content Ops (P0).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "data", "source-registry.json");

let _cache = null;

export function loadSourceRegistry(force = false) {
  if (_cache && !force) return _cache;
  _cache = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  return _cache;
}

export function listSources({ enabledOnly = false } = {}) {
  const reg = loadSourceRegistry();
  const sources = reg.sources || [];
  return enabledOnly ? sources.filter((s) => s.enabled) : sources.slice();
}

export function getSourceById(sourceId) {
  return listSources().find((s) => s.sourceId === sourceId) ?? null;
}

export function isSourceApproved(sourceId) {
  const src = getSourceById(sourceId);
  if (!src) return false;
  if (!src.enabled) return false;
  if (src.termsStatus === "terms_disallowed") return false;
  return true;
}

export function isForbiddenSourceClass(className) {
  const reg = loadSourceRegistry();
  return (reg.forbiddenSourceClasses || []).includes(className);
}

/**
 * Rank sources: official_direct > government > owning > academic > secondary.
 * @param {Array<{sourceType:string, trustLevel?:number}>} sources
 */
export function rankSources(sources) {
  const reg = loadSourceRegistry();
  const order = reg.rankingPriority || [];
  return [...sources].sort((a, b) => {
    const ia = order.indexOf(a.sourceType);
    const ib = order.indexOf(b.sourceType);
    const ra = ia === -1 ? 999 : ia;
    const rb = ib === -1 ? 999 : ib;
    if (ra !== rb) return ra - rb;
    return (b.trustLevel ?? 0) - (a.trustLevel ?? 0);
  });
}

/**
 * Reject collecting from unapproved / forbidden sources.
 */
export function assertSourceUsable(sourceId) {
  if (!isSourceApproved(sourceId)) {
    return {
      ok: false,
      reason: "source_not_approved_or_disabled",
      sourceId,
    };
  }
  return { ok: true, source: getSourceById(sourceId) };
}

export function getSourceRegistryPath() {
  return REGISTRY_PATH;
}
