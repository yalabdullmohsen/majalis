/**
 * AKE v2 — Structured extraction service (AI + OCR bridge).
 * Delegates to existing lesson intelligence extractors — no fabrication.
 */
import { analyzeContent } from "../../knowledge-engine/ai-analyzer.mjs";
import { isFutureOrCurrentMonth, currentMonthWindow } from "../../content-engines/sync-window.mjs";

export async function extractStructuredFields(item, connectorConfig) {
  const rawTitle = item.raw_title || "";
  const rawBody = item.raw_body || item.raw_payload?.caption || "";
  const imageUrl = item.raw_payload?.imageUrl || item.raw_payload?.image_url || item.raw_payload?.media_url;

  let ocrText = item.raw_payload?.ocr_text || "";
  let visionFields = item.raw_payload?.extracted_fields || {};

  if (imageUrl && !ocrText && !visionFields.title) {
    try {
      const { runExtractionPipeline } = await import("../../cms/lesson-intelligence/extractors/index.mjs");
      const source = {
        id: connectorConfig.id,
        source_name: connectorConfig.name,
        source_url: connectorConfig.official_url,
        source_type: connectorConfig.connector_type || connectorConfig.platform,
        config: connectorConfig.api_config || {},
      };
      const extraction = await runExtractionPipeline({
        source,
        item: {
          link: item.raw_url,
          title: rawTitle,
          description: rawBody,
          imageUrl,
          mediaUrls: [imageUrl],
        },
        imageBuffer: null,
      });
      if (extraction?.parsed) {
        visionFields = extraction.parsed;
        ocrText = extraction.parsed.raw_ocr_text || ocrText;
      }
    } catch {
      /* OCR/vision optional */
    }
  }

  const analysis = item.analysis || (await analyzeContent(rawTitle, `${rawBody}\n${ocrText}`, {
    source_name: connectorConfig.name,
    source_url: item.raw_url || connectorConfig.official_url,
    content_kind: item.content_kind,
  }));

  const extracted = {
    title: visionFields.title || analysis.title || rawTitle,
    speaker_name: visionFields.speaker_name || analysis.scholar || null,
    mosque: visionFields.mosque || null,
    course_name: visionFields.organizer || visionFields.cooperative_org || null,
    gregorian_date: visionFields.gregorian_date || item.published_at?.slice?.(0, 10) || null,
    lesson_time: visionFields.lesson_time || null,
    day_of_week: visionFields.day_of_week || null,
    city: visionFields.city || connectorConfig.city || null,
    region: visionFields.region || null,
    maps_url: visionFields.maps_url || null,
    live_url: visionFields.live_url || null,
    registration_url: visionFields.registration_url || null,
    phone: visionFields.phone || null,
    description: visionFields.description || analysis.summary || rawBody,
    language: analysis.language || "ar",
    category: analysis.category || visionFields.category || null,
    content_type: detectContentType(rawTitle, rawBody, visionFields),
    images: imageUrl ? [imageUrl] : [],
    links: visionFields.links || [],
    keywords: analysis.keywords || visionFields.keywords || [],
    seo_title: analysis.seo_title,
    seo_description: analysis.seo_description,
    confidence: Math.max(analysis.confidence || 0, (visionFields.confidence || 0) * 100),
    needs_human_review: analysis.needs_human_review,
    ocr_text: ocrText || null,
  };

  return { extracted_fields: extracted, analysis, visionFields };
}

function detectContentType(title, body, fields) {
  const text = `${title} ${body} ${fields.activity_type || ""}`;
  if (/إلغاء|أُلغي/i.test(text)) return "cancelled";
  if (/دورة|program/i.test(text) || fields.is_course) return "course";
  if (/ندوة|seminar/i.test(text)) return "seminar";
  if (/محاضرة|lecture/i.test(text)) return "lecture";
  if (/خطبة|khutbah/i.test(text)) return "sermon";
  if (/فائدة|benefit/i.test(text)) return "benefit";
  if (/إعلان|announcement/i.test(text)) return "announcement";
  if (/درس|lesson/i.test(text)) return "lesson";
  return fields.activity_type || "lesson";
}

export function filterCurrentMonthItems(items) {
  const win = currentMonthWindow();
  return items.filter((item) => {
    const d = item.published_at || item.raw_payload?.published_at || item.raw_payload?.timestamp;
    if (!d) return true;
    return isFutureOrCurrentMonth(d);
  });
}
