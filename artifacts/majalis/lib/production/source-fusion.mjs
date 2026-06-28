/**
 * Source Fusion — merge same lesson from multiple platforms into one canonical record.
 */

import { createHash } from "node:crypto";

function norm(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\u0600-\u06FFa-z0-9\s:-]/g, "");
}

/**
 * @param {object} lesson
 */
export function buildFusionKey(lesson) {
  const parts = [
    norm(lesson.speaker_name || lesson.sheikh_name),
    norm(lesson.title),
    norm(lesson.mosque),
    String(lesson.start_date || lesson.date || "").slice(0, 10),
    norm(lesson.lesson_time || lesson.time),
    norm(lesson.city),
  ].filter(Boolean);
  if (parts.length < 2) return null;
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

/**
 * @param {object[]} candidates
 */
export function fuseLessonCandidates(candidates) {
  const groups = new Map();
  for (const item of candidates) {
    const key = buildFusionKey(item);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const fused = [];
  for (const [, group] of groups) {
    if (group.length === 1) {
      fused.push({ ...group[0], source_score: scoreSource(group[0]), fused_sources: [group[0].source_type || "unknown"] });
      continue;
    }
    const best = [...group].sort((a, b) => scoreSource(b) - scoreSource(a))[0];
    const sources = [...new Set(group.map((g) => g.source_type || g.source_slug || "unknown"))];
    fused.push({
      ...best,
      source_score: scoreSource(best),
      fused_sources: sources,
      fusion_count: group.length,
      alternate_urls: group.map((g) => g.source_url || g.link).filter(Boolean),
    });
  }
  return fused;
}

function scoreSource(item) {
  const weights = { instagram_graph: 95, telegram_bot: 88, website: 82, rss: 78, youtube: 75, facebook: 70, pdf: 65, og_preview: 40 };
  const type = String(item.source_type || item.extracted_via || "").toLowerCase();
  let score = weights[type] || 50;
  if (item.imageUrl || item.mediaUrls?.length) score += 5;
  if (item.raw_body?.length > 80) score += 3;
  return score;
}
