/**
 * Unified content engine pipeline stages.
 * Fetch → Parse → Normalize → Source validation → Deduplication →
 * AI enrichment → Category mapping → Quality Gate → Review/Publish →
 * Search indexing → SEO update → Recommendation linking → Logs
 */

import { createHash } from "node:crypto";

export const PIPELINE_STAGES = [
  "fetch",
  "parse",
  "normalize",
  "source_validation",
  "deduplication",
  "ai_enrichment",
  "category_mapping",
  "quality_gate",
  "publish_or_review",
  "search_indexing",
  "seo_update",
  "recommendation_linking",
];

export function normalizeUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(String(url).trim());
    u.hash = "";
    let path = u.pathname.replace(/\/+$/, "") || "/";
    u.pathname = path;
    return u.toString().toLowerCase();
  } catch {
    return String(url).trim().toLowerCase();
  }
}

export function contentHash(text) {
  return createHash("sha256").update(String(text || "").trim()).digest("hex");
}

export function normalizeItem(raw) {
  return {
    title: String(raw.title || raw.raw_title || "").trim(),
    body: String(raw.body || raw.raw_body || raw.description || raw.text || "").trim(),
    source_url: normalizeUrl(raw.source_url || raw.raw_url || raw.link || raw.url || ""),
    source_name: String(raw.source_name || raw.sourceName || "").trim(),
    published_at: raw.published_at || raw.publishedAt || raw.date || null,
    external_key: raw.external_key || raw.external_id || null,
    category: raw.category || raw.ai_category || null,
    scholar: raw.scholar || raw.speaker_name || raw.sheikh_name || null,
    metadata: raw.metadata || {},
  };
}

export function validateSource(item) {
  const errors = [];
  if (!item.source_url && !item.source_name) {
    errors.push({ code: "missing_source", reason: "missing_source" });
  }
  if (item.source_url && !/^https?:\/\//i.test(item.source_url)) {
    errors.push({ code: "invalid_source_url", reason: "missing_source" });
  }
  if (!item.title && !item.body) {
    errors.push({ code: "empty_content", reason: "weak_extraction" });
  }
  if (item.body && item.body.length < 20 && !item.title) {
    errors.push({ code: "body_too_short", reason: "weak_extraction" });
  }
  const lower = `${item.title} ${item.body}`.toLowerCase();
  for (const flag of ["placeholder", "demo", "test", "mock", "lorem", "تجريبي"]) {
    if (lower.includes(flag)) {
      errors.push({ code: "placeholder", reason: "low_quality" });
      break;
    }
  }
  return { passed: errors.length === 0, errors };
}

export function mapCategory(rawCategory) {
  const cats = ["عقيدة", "فقه", "حديث", "تفسير", "سيرة", "آداب", "رقائق", "قرآن"];
  const c = String(rawCategory || "").trim();
  if (cats.includes(c)) return c;
  const lower = c.toLowerCase();
  for (const cat of cats) {
    if (lower.includes(cat)) return cat;
  }
  if (/فقه|أحكام|عبادات/.test(c)) return "فقه";
  if (/عقيد|توحيد|إيمان/.test(c)) return "عقيدة";
  if (/حديث|سنة/.test(c)) return "حديث";
  if (/تفسير|قرآن|آية/.test(c)) return "تفسير";
  if (/سيرة|سيرة/.test(c)) return "سيرة";
  if (/آداب|أخلاق/.test(c)) return "آداب";
  if (/رقائق|موعظ/.test(c)) return "رقائق";
  return null;
}

export function computeHealthScore(stats) {
  const fetched = stats.items_fetched || 0;
  const published = stats.items_published || 0;
  const rejected = stats.items_rejected || 0;
  const errors = stats.errors || 0;
  if (fetched === 0 && errors === 0) return 100;
  if (errors > 0 && published === 0) return Math.max(0, 30 - errors * 5);
  const successRate = fetched > 0 ? published / fetched : 1;
  const rejectPenalty = fetched > 0 ? (rejected / fetched) * 20 : 0;
  return Math.round(Math.min(100, Math.max(0, successRate * 100 - rejectPenalty - errors * 3)));
}

export async function runPipelineStages(ctx, stages) {
  const results = { stages: {}, stats: ctx.stats };
  for (const stage of PIPELINE_STAGES) {
    const fn = stages[stage];
    if (!fn) continue;
    const t0 = Date.now();
    try {
      const out = await fn(ctx);
      results.stages[stage] = { ok: true, duration_ms: Date.now() - t0, ...out };
      if (out?.abort) break;
    } catch (err) {
      results.stages[stage] = { ok: false, error: err.message, duration_ms: Date.now() - t0 };
      ctx.stats.errors = (ctx.stats.errors || 0) + 1;
      if (ctx.log) await ctx.log(stage, "error", err.message);
      break;
    }
  }
  return results;
}
