/**
 * Protected Content Registry — hard reject automation edits (P0).
 */
import { readFileSync } from "node:fs";
import { dirname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "data", "protected-content-registry.json");

let _cache = null;

export function loadProtectedContentRegistry(force = false) {
  if (_cache && !force) return _cache;
  _cache = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  return _cache;
}

export function listProtectedEntities() {
  return loadProtectedContentRegistry().entities || [];
}

/** Simple glob: ** and * only, path-normalized with /. */
function matchGlob(pathLike, glob) {
  const path = normalize(String(pathLike)).split(sep).join("/");
  const g = String(glob).split(sep).join("/");
  const esc = g
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "<<<DS>>>")
    .replace(/\*/g, "[^/]*")
    .replace(/<<<DS>>>/g, ".*");
  return new RegExp(`^${esc}$`, "i").test(path);
}

/**
 * @param {{ path?: string, field?: string, contentType?: string, table?: string }} target
 */
export function findProtectionHits(target = {}) {
  const hits = [];
  const path = target.path || target.filePath || null;
  const field = target.field || target.fieldName || null;
  const contentType = target.contentType || target.kind || null;
  const table = target.table || null;

  for (const entity of listProtectedEntities()) {
    const reasons = [];
    if (path && (entity.pathGlobs || []).some((g) => matchGlob(path, g))) {
      reasons.push(`path:${path}`);
    }
    if (field && (entity.fieldPatterns || []).some((p) => String(field).toLowerCase().includes(String(p).toLowerCase()))) {
      reasons.push(`field:${field}`);
    }
    if (contentType && (entity.contentTypes || []).map((c) => c.toLowerCase()).includes(String(contentType).toLowerCase())) {
      reasons.push(`contentType:${contentType}`);
    }
    if (table && (entity.tables || []).includes(table)) {
      reasons.push(`table:${table}`);
    }
    if (reasons.length) {
      hits.push({
        entityId: entity.entityId,
        label: entity.label,
        categories: entity.categories,
        reasons,
      });
    }
  }
  return hits;
}

export function isProtectedTarget(target) {
  return findProtectionHits(target).length > 0;
}

/**
 * Attempt to touch protected content — always reject for automation.
 */
export function rejectProtectedModification(target, { changeId = null } = {}) {
  const hits = findProtectionHits(target);
  if (!hits.length) {
    return { rejected: false, hits: [] };
  }
  return {
    rejected: true,
    status: "needs_specialist_review",
    action: "reject_and_log_needs_specialist_review",
    changeId,
    hits,
    message:
      "محاولة تعديل محتوى محمي رُفضت. لا تعديل آلي ولا Staging Publish ولا Auto-Approval.",
  };
}

export function getProtectedRegistryPath() {
  return REGISTRY_PATH;
}
