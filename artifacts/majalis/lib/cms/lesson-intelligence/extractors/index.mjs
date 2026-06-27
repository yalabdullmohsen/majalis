/**
 * Phase 6 — Extraction method registry (pluggable extractors).
 */
import { importFromUrl } from "../../url-importer.mjs";
import { extractLessonFromText, extractLessonFromImage, isVisionEnabled } from "../../lesson-extractor.mjs";

export const EXTRACTOR_IDS = [
  "opengraph",
  "structured_data",
  "json_ld",
  "microdata",
  "schema_org",
  "html_analyzer",
  "rss_parser",
  "ocr",
  "vision_ai",
  "openai_vision",
  "claude_vision",
  "google_vision",
  "pdf_reader",
  "instagram_graph_api",
];

function parseJsonLd(html) {
  const blocks = String(html || "").match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const out = [];
  for (const block of blocks) {
    const inner = block.replace(/<script[^>]*>|<\/script>/gi, "").trim();
    try {
      const parsed = JSON.parse(inner);
      out.push(parsed);
    } catch {
      /* skip */
    }
  }
  return out;
}

function fieldsFromStructured(data) {
  const parsed = {};
  const items = Array.isArray(data) ? data : [data];
  for (const item of items) {
    if (item.name || item.headline) parsed.title = item.name || item.headline;
    if (item.description) parsed.description = item.description;
    if (item.startDate) parsed.start_date = String(item.startDate).slice(0, 10);
    if (item.location?.name) parsed.mosque = item.location.name;
    if (item.organizer?.name) parsed.organizer = item.organizer.name;
    if (item.performer?.name) parsed.speaker_name = item.performer.name;
  }
  return parsed;
}

export async function runExtractor(extractorId, { sourceUrl, rawHtml, rawText, imageBuffer, mimeType }) {
  const t0 = Date.now();
  const result = { extractor: extractorId, parsed: {}, confidence: 0.2, text: rawText || "" };

  try {
    if (extractorId === "opengraph" || extractorId === "html_analyzer") {
      const imported = rawHtml ? { rawText: rawHtml, description: rawText } : await importFromUrl(sourceUrl);
      result.text = imported.rawText || imported.description || rawText || "";
      const ogTitle = result.text.match(/property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
      const ogDesc = result.text.match(/property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1];
      const ogImage = result.text.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
      if (ogTitle) result.parsed.title = ogTitle;
      if (ogDesc) result.parsed.description = ogDesc;
      if (ogImage) result.parsed.poster_image_url = ogImage;
      result.confidence = ogTitle ? 0.45 : 0.25;
    }

    if (extractorId === "structured_data" || extractorId === "json_ld" || extractorId === "schema_org" || extractorId === "microdata") {
      const html = rawHtml || (await importFromUrl(sourceUrl)).rawText || "";
      const ld = parseJsonLd(html);
      for (const block of ld) {
        Object.assign(result.parsed, fieldsFromStructured(block));
      }
      if (Object.keys(result.parsed).length) result.confidence = 0.55;
    }

    if (extractorId === "rss_parser" && rawText) {
      const title = rawText.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
      const link = rawText.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1];
      if (title) result.parsed.title = title.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      if (link) result.parsed.source_url = link.trim();
      result.confidence = 0.4;
    }

    if ((extractorId === "ocr" || extractorId === "vision_ai" || extractorId === "openai_vision" || extractorId === "claude_vision" || extractorId === "google_vision") && imageBuffer) {
      if (isVisionEnabled()) {
        const vision = await extractLessonFromImage({
          imageBase64: imageBuffer.toString("base64"),
          mimeType: mimeType || "image/jpeg",
        });
        result.parsed = { ...(vision.parsed_fields || {}) };
        result.text = vision.extracted_text || result.text;
        result.confidence = vision.confidence_score ?? 0.7;
      } else {
        result.confidence = 0.15;
        result.skipped = "vision_disabled";
      }
    }

    if (extractorId === "pdf_reader" && rawText) {
      const textResult = await extractLessonFromText({ text: rawText, sourceUrl });
      result.parsed = { ...(textResult.parsed_fields || textResult.extracted || {}) };
      result.confidence = textResult.confidence_score ?? 0.35;
    }

    if (result.text && !Object.keys(result.parsed).length) {
      const textResult = await extractLessonFromText({ text: result.text, sourceUrl });
      result.parsed = { ...(textResult.parsed_fields || textResult.extracted || {}) };
      result.confidence = Math.max(result.confidence, textResult.confidence_score ?? 0.3);
    }
  } catch (err) {
    result.error = String(err.message || err);
    result.confidence = 0.1;
  }

  result.durationMs = Date.now() - t0;
  return result;
}

export function selectExtractorsForSource(source) {
  const type = source.source_type || source.platform || "website";
  const map = {
    instagram: ["opengraph", "instagram_graph_api", "vision_ai"],
    x: ["opengraph", "structured_data", "vision_ai"],
    facebook: ["opengraph", "structured_data", "vision_ai"],
    telegram: ["opengraph", "html_analyzer", "vision_ai"],
    whatsapp: ["opengraph", "vision_ai"],
    youtube: ["opengraph", "structured_data", "json_ld"],
    youtube_live: ["opengraph", "structured_data"],
    youtube_community: ["opengraph", "structured_data"],
    rss: ["rss_parser", "structured_data", "html_analyzer"],
    website: ["opengraph", "structured_data", "json_ld", "schema_org", "html_analyzer"],
    wordpress: ["opengraph", "structured_data", "json_ld", "rss_parser"],
    ghost: ["opengraph", "structured_data", "json_ld"],
    drupal: ["opengraph", "structured_data", "microdata"],
    blogger: ["opengraph", "structured_data"],
    google_calendar: ["structured_data", "ics"],
    ics: ["structured_data"],
    pdf: ["pdf_reader", "ocr", "vision_ai"],
    image: ["vision_ai", "ocr"],
    png: ["vision_ai", "ocr"],
    jpg: ["vision_ai", "ocr"],
    jpeg: ["vision_ai", "ocr"],
    webp: ["vision_ai", "ocr"],
  };
  return map[type] || ["opengraph", "structured_data", "html_analyzer", "vision_ai"];
}

export async function runExtractionPipeline({ source, sourceUrl, rawHtml, rawText, imageBuffer, mimeType }) {
  const extractors = selectExtractorsForSource(source);
  let merged = {};
  let bestConfidence = 0;
  let combinedText = rawText || "";
  const steps = [];

  for (const id of extractors) {
    if (id === "instagram_graph_api") {
      steps.push({ extractor: id, status: "skip", detail: "requires_meta_credentials" });
      continue;
    }
    if (id === "ics" && !rawText?.includes("BEGIN:VCALENDAR")) {
      steps.push({ extractor: id, status: "skip" });
      continue;
    }
    const r = await runExtractor(id, { sourceUrl, rawHtml, rawText: combinedText, imageBuffer, mimeType });
    steps.push({ extractor: id, status: r.error ? "error" : r.skipped ? "skip" : "ok", confidence: r.confidence, durationMs: r.durationMs });
    merged = {
      ...merged,
      ...Object.fromEntries(Object.entries(r.parsed || {}).filter(([, v]) => v != null && String(v).trim() !== "")),
    };
    bestConfidence = Math.max(bestConfidence, r.confidence || 0);
    if (r.text) combinedText = r.text;
  }

  return { parsed: merged, confidence: bestConfidence, extractedText: combinedText, steps };
}
