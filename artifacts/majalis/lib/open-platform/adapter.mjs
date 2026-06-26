/**
 * Open Platform — normalize CMS rows to OpenPlatformItem.
 */

import { buildGlobalRef } from "../global-reference/ids.mjs";
import { OPEN_RESOURCES } from "./config.mjs";

export function normalizeItem(resource, row, version = "v1") {
  if (!row) return null;

  const config = OPEN_RESOURCES[resource] || {};
  const kind = config.kind || resource;
  const id = row.id || row.slug || row.external_key;

  const item = {
    id: String(id),
    kind,
    resource,
    ref_id: buildGlobalRef(kind, id),
    title: row[config.titleField || "title"] || row.question || row.text || row.name,
    summary: row[config.summaryField || "summary"] || row.description || row.bio,
    body: row[config.bodyField || "body"] || row.answer || row.content,
    author: row.author_name || row.author || row.speaker_name || row.scholar,
    category: row.category,
    source_url: row.source_url,
    source_name: row.source_name,
    status: row.status,
    language: row.language || "ar",
    created_at: row.created_at,
    updated_at: row.updated_at || row.last_updated,
    published_at: row.published_at,
    url: config.publicRoute ? undefined : `/${resource}/${id}`,
  };

  if (version === "v2" || version === "v3") {
    item.verification_status = row.verification_status || "needs_review";
    item.documentation_level = row.documentation_level || "partial";
    item.trust_level = row.trust_level || row.trust_score;
    item.ai_summary = row.ai_summary;
    item.ai_keywords = row.ai_keywords || row.keywords;
  }

  if (version === "v3") {
    item.relations_count = row.relations_count;
    item.quality_score = row.quality_score || row.overall_score;
    item._links = {
      self: `/api/v3/${resource}/${id}`,
      relations: `/api/v3/relations?ref=${item.ref_id}`,
    };
  }

  return item;
}

export function paginate(items, { page = 1, limit = 20 } = {}) {
  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));
  const offset = (p - 1) * l;
  const data = items.slice(offset, offset + l);
  return {
    data,
    pagination: {
      page: p,
      limit: l,
      total: items.length,
      total_pages: Math.ceil(items.length / l),
      has_next: offset + l < items.length,
      has_prev: p > 1,
    },
  };
}

export function sortItems(items, sort = "updated_at", order = "desc") {
  const dir = order === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const va = a[sort] || a.created_at || "";
    const vb = b[sort] || b.created_at || "";
    return va < vb ? -dir : va > vb ? dir : 0;
  });
}

export function filterItems(items, filters = {}) {
  let result = items;
  if (filters.category) result = result.filter((i) => i.category === filters.category);
  if (filters.author) result = result.filter((i) => (i.author || "").includes(filters.author));
  if (filters.status) result = result.filter((i) => i.status === filters.status);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    result = result.filter((i) => [i.title, i.summary, i.body, i.author].some((f) => String(f || "").toLowerCase().includes(q)));
  }
  return result;
}
