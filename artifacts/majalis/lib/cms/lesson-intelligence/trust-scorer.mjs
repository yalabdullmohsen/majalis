/**
 * Phase 6 — Trust scoring by source type and provenance.
 */
const BASE_TRUST = {
  official_website: 100,
  mosque_official: 96,
  scholar_official: 100,
  instagram_official: 98,
  instagram_trusted: 98,
  rss_official: 95,
  telegram_official: 94,
  youtube_official: 94,
  x_official: 93,
  facebook_official: 93,
  google_calendar: 95,
  ics: 95,
  wordpress: 92,
  ghost: 92,
  drupal: 92,
  blogger: 90,
  whatsapp: 92,
  image_no_source: 60,
  pdf_no_source: 65,
  unknown: 50,
};

const SOURCE_TYPE_TRUST = {
  website: 96,
  wordpress: 92,
  ghost: 92,
  drupal: 92,
  blogger: 90,
  rss: 95,
  instagram: 98,
  x: 93,
  facebook: 93,
  telegram: 94,
  whatsapp: 92,
  youtube: 94,
  youtube_live: 94,
  youtube_community: 93,
  google_calendar: 95,
  ics: 95,
  pdf: 70,
  image: 60,
  png: 60,
  jpg: 60,
  jpeg: 60,
  webp: 60,
  manual: 75,
};

export function computeSourceTrustScore(source) {
  const config = source.config || {};
  const subtype = config.source_subtype || "";
  let score = source.trust_score ?? SOURCE_TYPE_TRUST[source.source_type] ?? 80;

  if (subtype === "scholar_official") score = Math.max(score, BASE_TRUST.scholar_official);
  if (subtype.includes("mosque_official")) score = Math.max(score, BASE_TRUST.mosque_official);
  if (subtype === "lesson_aggregator") score = Math.min(score, 98);
  if (source.source_type === "rss" && config.official) score = Math.max(score, BASE_TRUST.rss_official);

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function computeExtractionConfidence({ sourceTrust, extractionConfidence, hasImage, hasSourceUrl, fieldCompleteness }) {
  const base = Number(extractionConfidence) || 0.3;
  const trustFactor = (sourceTrust || 80) / 100;
  let score = base * 0.6 + trustFactor * 0.25 + (fieldCompleteness || 0) * 0.15;
  if (hasImage) score += 0.05;
  if (hasSourceUrl) score += 0.05;
  if (!hasSourceUrl && (sourceTrust || 0) < 70) score *= 0.85;
  return Math.min(1, Math.max(0, score));
}

export function shouldAutoPublishIntelligence({ confidence, sourceTrust, autoPublishEnabled }) {
  const conf = Number(confidence) || 0;
  const trust = Number(sourceTrust) || 0;
  return Boolean(autoPublishEnabled) && conf >= 0.95 && trust >= 95;
}

export { BASE_TRUST, SOURCE_TYPE_TRUST };
