/**
 * Instagram Engine — full metadata extraction for posts, reels, carousels, and course ads.
 * Enrichment chain: Caption → OCR → Vision → LLM → Metadata → Website
 */

import { extractHashtags, extractLinks, parseCourseAdFields } from "./instagram-parser.mjs";

const MEDIA_TYPES = new Set(["IMAGE", "VIDEO", "CAROUSEL_ALBUM", "REELS"]);

/**
 * Normalize a Graph API or OG post into a canonical Instagram media record.
 * @param {object} post
 * @param {object} [context]
 */
export function normalizeInstagramPost(post, context = {}) {
  const caption = post.caption || post.description || "";
  const hashtags = extractHashtags(caption);
  const links = extractLinks(caption);
  const mediaType = String(post.media_type || post.mediaType || "IMAGE").toUpperCase();
  const mediaUrls = post.mediaUrls || (post.media_url ? [post.media_url] : post.imageUrl ? [post.imageUrl] : []);

  return {
    id: post.id || post.externalId,
    permalink: post.permalink || post.link,
    caption,
    hashtags,
    links,
    media_type: MEDIA_TYPES.has(mediaType) ? mediaType : "IMAGE",
    media_urls: mediaUrls,
    thumbnail_url: post.thumbnail_url || post.thumbnailUrl || mediaUrls[0] || null,
    cover_image: post.imageUrl || post.media_url || mediaUrls[0] || null,
    timestamp: post.timestamp || post.published_at || null,
    like_count: post.like_count ?? post.likes ?? null,
    view_count: post.view_count ?? post.views ?? null,
    comment_count: post.comments_count ?? post.comment_count ?? null,
    location: post.location?.name || post.location_name || null,
    handle: context.handle || post.handle,
    extracted_via: post.fromGraphApi ? "instagram_graph" : "instagram_og",
    is_course_ad: /دورة|course|workshop|تسجيل|register/i.test(caption),
    is_lesson_ad: /درس|lesson|محاضرة|lecture/i.test(caption),
  };
}

/**
 * Extract structured course/lesson fields from caption + optional vision fields.
 * @param {object} media
 * @param {object} [visionFields]
 */
export function extractCourseAdMetadata(media, visionFields = {}) {
  const fromCaption = parseCourseAdFields(media.caption || "");
  const merged = mergeByConfidence([
    { source: "caption", fields: fromCaption, confidence: 0.55 },
    { source: "vision", fields: visionFields, confidence: visionFields.confidence || 0.75 },
    { source: "metadata", fields: buildMetadataFields(media), confidence: 0.6 },
  ]);

  return {
    ...merged,
    registration_url: merged.registration_url || merged.live_url || media.links?.[0] || null,
    poster_image_url: media.cover_image || media.thumbnail_url,
    source_url: media.permalink,
    instagram_id: media.id,
    hashtags: media.hashtags,
    media_type: media.media_type,
  };
}

function buildMetadataFields(media) {
  return {
    title: media.caption?.slice(0, 120) || null,
    start_date: media.timestamp?.slice?.(0, 10) || null,
    location: media.location,
  };
}

/**
 * Merge field maps; higher confidence wins per field.
 * @param {Array<{ source: string, fields: object, confidence: number }>} layers
 */
export function mergeByConfidence(layers) {
  const sorted = [...layers].sort((a, b) => b.confidence - a.confidence);
  const out = { _sources: {} };
  for (const layer of sorted) {
    for (const [key, value] of Object.entries(layer.fields || {})) {
      if (value == null || value === "") continue;
      if (out[key] == null) {
        out[key] = value;
        out._sources[key] = layer.source;
      }
    }
  }
  delete out._sources;
  return out;
}

/**
 * Full enrichment pipeline for an Instagram post.
 * @param {object} post
 * @param {object} [options]
 */
export async function enrichInstagramPost(post, options = {}) {
  const normalized = normalizeInstagramPost(post, options);
  let visionFields = {};

  const imageUrl = normalized.cover_image;
  if (imageUrl && (normalized.is_course_ad || normalized.is_lesson_ad)) {
    try {
      const { runExtractionPipeline } = await import("../cms/lesson-intelligence/extractors/index.mjs");
      const extraction = await runExtractionPipeline({
        source: {
          id: options.sourceId,
          source_name: options.sourceName || "Instagram",
          source_url: normalized.permalink,
          source_type: "instagram",
          config: { handle: options.handle },
        },
        item: {
          link: normalized.permalink,
          title: normalized.caption.slice(0, 120),
          description: normalized.caption,
          imageUrl,
          mediaUrls: normalized.media_urls,
        },
        imageBuffer: null,
      });
      if (extraction?.parsed) {
        visionFields = extraction.parsed;
      }
    } catch {
      /* vision/OCR optional */
    }
  }

  const extracted = extractCourseAdMetadata(normalized, visionFields);
  const confidence = computeInstagramConfidence(normalized, extracted, visionFields);

  return {
    ...normalized,
    extracted_fields: extracted,
    confidence,
    enriched: true,
  };
}

function computeInstagramConfidence(media, extracted, visionFields) {
  let score = 50;
  if (media.extracted_via === "instagram_graph") score += 15;
  if (extracted.speaker_name) score += 10;
  if (extracted.mosque) score += 8;
  if (extracted.start_date || extracted.gregorian_date) score += 8;
  if (extracted.lesson_time) score += 5;
  if (extracted.registration_url) score += 5;
  if (visionFields.confidence) score += Math.round(visionFields.confidence * 20);
  if (media.caption?.length > 40) score += 5;
  return Math.min(100, score);
}

/**
 * Map enriched post to AKE connector item shape.
 */
export function toAkeItem(enriched, connectorMeta = {}) {
  return {
    external_id: `${connectorMeta.slug || "ig"}:ig:${enriched.id || enriched.permalink}`,
    source_slug: connectorMeta.slug,
    source_attribution: connectorMeta.name,
    source_url: enriched.permalink,
    raw_url: enriched.permalink,
    raw_title: enriched.extracted_fields?.title || enriched.caption?.slice(0, 120) || connectorMeta.name,
    raw_body: enriched.caption || "",
    extracted_fields: enriched.extracted_fields,
    source_type: enriched.extracted_via,
    content_kind: enriched.is_course_ad ? "course" : enriched.is_lesson_ad ? "lesson" : "announcement",
    published_at: enriched.timestamp,
    ai_confidence: enriched.confidence,
    raw_payload: {
      handle: enriched.handle,
      imageUrl: enriched.cover_image,
      media_url: enriched.media_urls?.[0],
      media_urls: enriched.media_urls,
      media_type: enriched.media_type,
      timestamp: enriched.timestamp,
      instagram_id: enriched.id,
      hashtags: enriched.hashtags,
      like_count: enriched.like_count,
      view_count: enriched.view_count,
      location: enriched.location,
      extracted_via: enriched.extracted_via,
      extracted_fields: enriched.extracted_fields,
    },
  };
}
