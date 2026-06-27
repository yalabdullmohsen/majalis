/**
 * Phase 5 — AI extraction pipeline (Vision + enrichment from official sources).
 */
import { extractLessonFromText, extractLessonFromImage, isVisionEnabled } from "./lesson-extractor.mjs";
import { importFromUrl } from "./url-importer.mjs";
import { detectCourseFromParsed, ensureCourseRecord } from "./course-handler.mjs";
import { logAutomationStep } from "./automation-step-logs.mjs";

async function fetchImageBuffer(imageUrl) {
  const res = await fetch(imageUrl, {
    headers: { "User-Agent": "MajalisBot/1.0 (+https://majlisilm.com)", Accept: "image/*" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 5 * 1024 * 1024) return null;
  return { buffer: buf, mimeType: ct.split(";")[0] };
}

export async function runAiSourcePipeline({ item, source, sourceUrl, runId }) {
  const t0 = Date.now();
  let parsed = {};
  let extractedText = "";
  let confidenceScore = 0.2;
  let imageUrl = item.imageUrl || null;
  const mediaUrls = item.mediaUrls || (imageUrl ? [imageUrl] : []);

  await logAutomationStep({ runId, sourceId: source.id, step: "download", status: "ok", detail: sourceUrl });

  try {
    const imported = await importFromUrl(sourceUrl);
    extractedText = imported.rawText || `${imported.title}\n${imported.description}`;
    imageUrl = imageUrl || imported.imageUrl || null;

    const textResult = await extractLessonFromText({ text: extractedText || `${item.title}\n${item.description}`, sourceUrl });
    parsed = { ...(textResult.parsed_fields || textResult.extracted || {}) };
    confidenceScore = textResult.confidence_score ?? (Number(parsed.confidence) || 0.3);

    await logAutomationStep({ runId, sourceId: source.id, step: "extraction", status: "ok", durationMs: Date.now() - t0 });

    if (isVisionEnabled() && mediaUrls.length) {
      const vt0 = Date.now();
      for (const url of mediaUrls.slice(0, 5)) {
        const remote = await fetchImageBuffer(url);
        if (!remote) continue;
        const vision = await extractLessonFromImage({
          imageBase64: remote.buffer.toString("base64"),
          mimeType: remote.mimeType,
        });
        if (vision.parsed_fields) {
          parsed = {
            ...parsed,
            ...Object.fromEntries(
              Object.entries(vision.parsed_fields).filter(([, v]) => v != null && String(v).trim() !== "" && v !== false),
            ),
          };
          confidenceScore = Math.max(confidenceScore, vision.confidence_score ?? 0);
          extractedText = vision.extracted_text || extractedText;
          imageUrl = url;
        }
      }
      await logAutomationStep({ runId, sourceId: source.id, step: "vision", status: "ok", durationMs: Date.now() - vt0 });
    } else {
      await logAutomationStep({ runId, sourceId: source.id, step: "vision", status: "skip", detail: "vision_disabled_or_no_image" });
    }

    if (!parsed.title && item.title) parsed.title = item.title;
    if (!parsed.description && item.description) parsed.description = item.description;
    if (source.city && !parsed.city) parsed.city = source.city;
    if (source.country && !parsed.country) parsed.country = source.country;
    if (source.category && !parsed.category) parsed.category = source.category;
    parsed.source_url = sourceUrl;

    const websiteUrl = source.config?.website_url;
    if (websiteUrl && (!parsed.description || confidenceScore < 0.5)) {
      try {
        const site = await importFromUrl(websiteUrl);
        if (site.description && !parsed.description) parsed.description = site.description.slice(0, 500);
        await logAutomationStep({ runId, sourceId: source.id, step: "enrichment", status: "ok", detail: websiteUrl });
      } catch {
        await logAutomationStep({ runId, sourceId: source.id, step: "enrichment", status: "warn", detail: "official_site_fetch_failed" });
      }
    }

    if (detectCourseFromParsed(parsed)) {
      const course = await ensureCourseRecord(parsed, { sourceId: source.id, sourceUrl });
      parsed.is_course = course.isCourse;
      if (course.courseId) parsed.course_id = course.courseId;
    }

    return { parsed, extractedText, confidenceScore, imageUrl, visionEnabled: isVisionEnabled() };
  } catch (err) {
    await logAutomationStep({ runId, sourceId: source.id, step: "extraction", status: "error", detail: String(err.message || err) });
    return {
      parsed: { title: item.title || "", description: item.description || "", source_url: sourceUrl },
      extractedText: item.description || "",
      confidenceScore: 0.1,
      imageUrl,
      extractError: String(err.message || err),
    };
  }
}
