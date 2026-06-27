/**
 * Vision Intelligence — OCR, Vision AI, layout, entity recognition for Arabic posters.
 */
import { extractLessonFromImage, extractLessonFromText, isVisionEnabled } from "../cms/lesson-extractor.mjs";
import { runExtractionPipeline } from "../cms/lesson-intelligence/extractors/index.mjs";
import { VISION_MIN_CONFIDENCE, OCR_MIN_CONFIDENCE } from "./config.mjs";

const VISION_FIELDS = [
  "title", "speaker_name", "course_title", "mosque", "region", "city",
  "gregorian_date", "day_of_week", "lesson_time", "organizer", "cooperative_org",
  "live_url", "women_section", "has_women_section", "phone", "contact_phone",
  "language", "keywords", "qr_code", "logo_detected", "poster_tags",
  "registration_url", "maps_url", "is_course", "activity_type",
];

function mergeVisionFields(base, extra) {
  const out = { ...base };
  for (const k of VISION_FIELDS) {
    if (extra[k] != null && extra[k] !== "" && extra[k] !== false) {
      out[k] = extra[k];
    }
  }
  if (extra.course_title && !out.title) out.title = extra.course_title;
  if (extra.contact_phone && !out.phone) out.phone = extra.contact_phone;
  return out;
}

function detectLayoutHints(rawText = "") {
  const text = String(rawText);
  const hints = {
    has_qr_mention: /qr|باركود|رمز/i.test(text),
    has_time_pattern: /\d{1,2}[:.]?\d{0,2}\s*(ص|م|pm|am)/i.test(text) || /بعد\s+(الفجر|الظهر|العصر|المغرب|العشاء)/i.test(text),
    has_date_pattern: /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text) || /(السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)/i.test(text),
    has_mosque_keyword: /(مسجد|جامع|مصلى)/i.test(text),
    has_sheikh_keyword: /(الشيخ|فضيلة|د\.|دكتور)/i.test(text),
    arabic_char_ratio: (text.match(/[\u0600-\u06FF]/g) || []).length / Math.max(text.length, 1),
  };
  return hints;
}

function extractEntitiesFromText(text) {
  const entities = { sheikhs: [], mosques: [], organizations: [], dates: [], times: [] };
  const t = String(text || "");

  const sheikhMatches = t.match(/(?:الشيخ|فضيلة|د\.)\s+[^\n،,]{3,40}/g) || [];
  entities.sheikhs = [...new Set(sheikhMatches.map((s) => s.trim()))].slice(0, 3);

  const mosqueMatches = t.match(/(?:مسجد|جامع)\s+[^\n،,]{3,40}/g) || [];
  entities.mosques = [...new Set(mosqueMatches.map((s) => s.trim()))].slice(0, 3);

  const orgMatches = t.match(/(?:جمعية|مركز|مؤسسة|وزارة)\s+[^\n،,]{3,50}/g) || [];
  entities.organizations = [...new Set(orgMatches.map((s) => s.trim()))].slice(0, 3);

  entities.dates = [...new Set((t.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/g) || []))].slice(0, 2);
  entities.times = [...new Set((t.match(/\d{1,2}[:.]?\d{0,2}\s*(?:ص|م)/gi) || []))].slice(0, 2);

  return entities;
}

export async function analyzeImage({ imageBuffer, mimeType, sourceUrl, caption, source }) {
  const started = Date.now();
  const visionEnabled = isVisionEnabled();
  const layoutHints = detectLayoutHints(caption || "");

  let parsed = {};
  let confidence = 0;
  let rawOcr = caption || "";
  let methods = [];

  if (imageBuffer && visionEnabled) {
    const vision = await extractLessonFromImage(imageBuffer, mimeType || "image/jpeg");
    parsed = vision.parsed || vision.corrected || {};
    confidence = Number(parsed.confidence ?? vision.confidence ?? 0.5);
    rawOcr = parsed.raw_ocr_text || rawOcr;
    methods.push("claude_vision");
  } else if (caption) {
    const textResult = await extractLessonFromText(caption);
    parsed = textResult.parsed || {};
    confidence = Number(parsed.confidence ?? 0.4);
    rawOcr = caption;
    methods.push("caption_text");
  }

  const entities = extractEntitiesFromText(rawOcr);
  if (entities.sheikhs[0] && !parsed.speaker_name) parsed.speaker_name = entities.sheikhs[0].replace(/^(الشيخ|فضيلة|د\.)\s*/, "").trim();
  if (entities.mosques[0] && !parsed.mosque) parsed.mosque = entities.mosques[0];
  if (entities.organizations[0] && !parsed.organizer) parsed.organizer = entities.organizations[0];

  parsed = mergeVisionFields(parsed, {
    poster_tags: parsed.keywords || [],
    logo_detected: layoutHints.has_mosque_keyword || layoutHints.has_sheikh_keyword,
    language: layoutHints.arabic_char_ratio > 0.3 ? "ar" : "unknown",
  });

  const ocrConfidence = rawOcr.length > 50 ? Math.min(0.85, 0.35 + rawOcr.length / 500) : OCR_MIN_CONFIDENCE;
  const visionConfidence = confidence || (visionEnabled ? VISION_MIN_CONFIDENCE : 0);

  return {
    ok: true,
    parsed,
    rawOcr,
    entities,
    layoutHints,
    methods,
    metrics: {
      visionEnabled,
      ocrConfidence,
      visionConfidence,
      combinedConfidence: Math.max(visionConfidence, ocrConfidence),
      durationMs: Date.now() - started,
    },
    sourceUrl,
    sourceId: source?.id,
  };
}

export async function analyzeContentItem({ source, item }) {
  const images = item.mediaUrls || (item.imageUrl ? [item.imageUrl] : []);
  let imageBuffer = item.imageBuffer || null;
  let mimeType = item.mimeType || "image/jpeg";

  if (!imageBuffer && images[0]) {
    try {
      const res = await fetch(images[0], { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        imageBuffer = Buffer.from(await res.arrayBuffer());
        mimeType = res.headers.get("content-type") || mimeType;
      }
    } catch {
      /* skip */
    }
  }

  const vision = await analyzeImage({
    imageBuffer,
    mimeType,
    sourceUrl: item.link || item.url || source?.source_url,
    caption: item.description || item.caption || item.title || "",
    source,
  });

  // Run HTML/text extractors when URL available
  let htmlExtract = {};
  const sourceUrl = item.link || item.url;
  if (sourceUrl && !imageBuffer) {
    const pipeline = await runExtractionPipeline({
      source,
      item,
      sourceUrl,
      rawText: item.description || "",
    });
    htmlExtract = pipeline.bestParsed || {};
    if (pipeline.bestConfidence > (vision.metrics?.combinedConfidence || 0)) {
      vision.parsed = { ...vision.parsed, ...htmlExtract };
      vision.metrics.combinedConfidence = pipeline.bestConfidence;
    }
  }

  return {
    ...vision,
    htmlExtract,
    item,
  };
}

export function getVisionStatus() {
  return {
    visionEnabled: isVisionEnabled(),
    providers: {
      claude_vision: isVisionEnabled(),
      openai_vision: Boolean(process.env.OPENAI_API_KEY),
      google_vision: Boolean(process.env.GOOGLE_VISION_API_KEY),
    },
    capabilities: [
      "ocr", "vision_ai", "layout_analysis", "entity_recognition",
      "date_detection", "time_detection", "arabic_text", "logo_detection",
    ],
  };
}
