/**
 * Citation formatting for grounded reasoning answers.
 */

import { buildGlobalRef } from "../global-reference/ids.mjs";

export function resolveHref(item) {
  if (item.href) return item.href;
  if (item.url) return item.url;
  const kind = item.content_kind || item.kind || item.content_type;
  const id = item.slug || item.id || item.content_id;
  const routes = {
    lesson: `/lessons/${id}`,
    lessons: `/lessons/${id}`,
    hadith: `/arbaeen-nawawi#${id}`,
    verified_hadith: `/arbaeen-nawawi#${id}`,
    adhkar: `/adhkar`,
    verified_adhkar: `/adhkar`,
    fatwa: `/rulings`,
    fiqh_decision: `/fiqh-council/${id}`,
    fiqh_council: `/fiqh-council/${id}`,
    ruling: `/rulings/${id}`,
    library: `/library`,
    book: `/library`,
    sheikh: `/sheikhs/${id}`,
    fawaid: `/fawaid`,
    qa: `/qa`,
    course: `/annual-courses/${id}`,
    miracle: `/miracles`,
    quran: `/quran`,
  };
  return routes[kind] || `/search?q=${encodeURIComponent(item.title || "")}`;
}

export function computeTrustScore(item) {
  let score = 50;
  if (item.verification_status === "verified") score += 25;
  if (item.trust_level) score += Math.min(20, Math.round(item.trust_level / 5));
  if (item.source_url && item.source_name) score += 10;
  if (item.quality_score) score += Math.min(10, Math.round(item.quality_score / 10));
  return Math.min(100, score);
}

export function toCitation(item, tier = null) {
  const kind = item.content_kind || item.kind || item.content_type || "content";
  const title = item.title || item.text?.slice(0, 80) || item.name || "—";
  const excerpt = String(
    item.excerpt || item.summary || item.text || item.description || item.ruling_text || "",
  ).slice(0, 280);

  return {
    ref_id: item.ref_id || item.global_ref_id || buildGlobalRef(kind, item.id || item.content_id),
    content_kind: kind,
    content_id: String(item.id || item.content_id || item.slug || ""),
    title,
    excerpt,
    href: resolveHref(item),
    source_name: item.source_name || item.publisher || item.author || null,
    source_url: item.source_url || null,
    trust_score: computeTrustScore(item),
    tier: tier?.tier ?? null,
    tier_label: tier?.label ?? null,
    updated_at: item.updated_at || item.last_updated || null,
    verification_status: item.verification_status || null,
    book_title: item.book_title || item.source_name || null,
    author_name: item.author_name || item.author || item.scholar || null,
    edition: item.edition || null,
    volume: item.volume || null,
    page: item.page || null,
    chapter: item.chapter || item.category || null,
    hadith_number: item.hadith_number || item.number || null,
    ayah_ref: item.ayah_ref || null,
    hadith_grade: item.hadith_grade || item.grade || null,
    verification: item.verification || item.verification_status || null,
  };
}

export function aggregateConfidence(citations) {
  if (!citations.length) return 0;
  const avg = citations.reduce((s, c) => s + (c.trust_score || 0), 0) / citations.length;
  const diversityBonus = Math.min(15, new Set(citations.map((c) => c.content_kind)).size * 3);
  return Math.min(100, Math.round(avg + diversityBonus));
}
