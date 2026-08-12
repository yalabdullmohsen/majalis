/**
 * URL-based lesson import — fetch page, extract fields, create draft.
 */
import { detectPlatform, importFromUrl, normalizeImportUrl, isSupportedImportPlatform } from "./url-importer.mjs";
import { extractLessonFromText, extractLessonFromImage, emptyLessonPayload, isVisionEnabled, buildMissingFields } from "./lesson-extractor.mjs";
import { validateLessonDraft } from "./content-validator.mjs";
import { matchSheikhByName } from "./sheikh-matcher.mjs";
import { findDuplicateSourceUrl } from "./lesson-import-draft.mjs";
import { decodeBase64Image, uploadLessonPoster, validateImageUpload } from "./image-storage.mjs";

async function fetchRemoteImage(imageUrl) {
  const res = await fetch(imageUrl, {
    headers: { "User-Agent": "MajalisBot/1.0 (+https://www.majlisilm.com)", Accept: "image/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return null;
  const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  if (!contentType.startsWith("image/")) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > 5 * 1024 * 1024) return null;
  return { buffer, mimeType: contentType };
}

function mergePageMeta(parsed, imported) {
  const out = { ...parsed };
  if (!out.title?.trim() && imported.title) out.title = imported.title;
  if (!out.description?.trim() && imported.description) out.description = imported.description;
  if (imported.url) {
    const links = Array.isArray(out.links) ? [...out.links] : [];
    if (!links.includes(imported.url)) links.unshift(imported.url);
    out.links = links;
    if (!out.registration_url) out.registration_url = imported.url;
  }
  out.platform = imported.platform;
  out.source_url = imported.url;
  return out;
}

function buildManualFallback(url, platform, reason) {
  const empty = emptyLessonPayload();
  return {
    visionEnabled: isVisionEnabled(),
    extractionFailed: true,
    fetchFailed: true,
    platform,
    url,
    message: reason || "تعذر استخراج الرابط — يمكنك إدخال البيانات يدويًا.",
    extracted: {
      ...empty,
      registration_url: url,
      links: [url],
      description: `مصدر: ${url}`,
    },
    parsed_fields: {
      ...empty,
      registration_url: url,
      links: [url],
      description: `مصدر: ${url}`,
    },
    extracted_text: "",
    confidence_score: 0,
    validation: validateLessonDraft(empty),
    missing_fields: ["title", "speaker_name", "day_of_week", "lesson_time", "mosque", "city"],
    aiSuggestions: [],
  };
}

export async function importLessonFromUrl(url, { userId } = {}) {
  const normalized = normalizeImportUrl(url);
  if (!normalized) {
    return {
      ok: false,
      error: "invalid_url",
      message: "الرابط غير صالح.",
    };
  }

  const platform = detectPlatform(normalized);
  const duplicate = await findDuplicateSourceUrl(normalized);

  let imported;
  try {
    imported = await importFromUrl(normalized);
  } catch (err) {
    const fallback = buildManualFallback(
      normalized,
      platform,
      `تعذر جلب الرابط (${String(err.message || err).slice(0, 80)}). أدخل البيانات يدويًا.`,
    );
    return {
      ok: true,
      partial: true,
      duplicate,
      platform,
      imported: { platform, url: normalized, title: "", description: "", imageUrl: "", rawText: "" },
      ...fallback,
    };
  }

  let imageUrl = imported.imageUrl || null;
  let visionFromImage = null;

  if (imported.imageUrl) {
    try {
      const remote = await fetchRemoteImage(imported.imageUrl);
      if (remote) {
        const check = validateImageUpload({ buffer: remote.buffer, mimeType: remote.mimeType });
        if (check.ok) {
          const upload = await uploadLessonPoster({
            buffer: remote.buffer,
            mimeType: check.mime,
            userId,
          });
          if (upload.ok) imageUrl = upload.url;

          if (isVisionEnabled()) {
            visionFromImage = await extractLessonFromImage({
              imageBase64: remote.buffer.toString("base64"),
              mimeType: check.mime,
            });
          }
        }
      }
    } catch {
      // Poster fetch optional — continue with text extraction
    }
  }

  let textResult;
  try {
    textResult = await extractLessonFromText({
      text: imported.rawText || `${imported.title}\n${imported.description}`,
      sourceUrl: imported.url,
    });
  } catch {
    textResult = buildManualFallback(normalized, platform);
  }

  let parsed = mergePageMeta(textResult.parsed_fields || textResult.extracted || {}, imported);

  if (visionFromImage?.parsed_fields) {
    const visionParsed = visionFromImage.parsed_fields;
    parsed = {
      ...parsed,
      ...Object.fromEntries(
        Object.entries(visionParsed).filter(([, v]) => v != null && String(v).trim() !== "" && v !== false),
      ),
    };
    if (visionFromImage.extracted_text) {
      parsed.raw_ocr_text = visionFromImage.extracted_text;
    }
  }

  if (!parsed.raw_ocr_text?.trim()) {
    parsed.raw_ocr_text = imported.rawText?.slice(0, 4000) || "";
  }

  const validation = validateLessonDraft(parsed);
  const sheikhMatch = await matchSheikhByName(parsed.speaker_name);
  const confidence =
    visionFromImage?.confidence_score ??
    textResult.confidence_score ??
    (Number(parsed.confidence) || (imported.title ? 0.35 : 0.15));

  const missing = buildMissingFields(parsed);

  const warnings = [...(validation.warnings || [])];
  if (!imported.imageUrl) {
    warnings.push({ field: "image_url", message: "لم تُعثر على صورة في الرابط — يمكنك إضافتها لاحقًا." });
  }
  if (duplicate?.draft) {
    warnings.push({
      field: "source_url",
      message: `رابط مكرر — مسودة موجودة (${duplicate.draft.status})`,
    });
  }
  if (duplicate?.lesson) {
    warnings.push({
      field: "source_url",
      message: "رابط مكرر — درس منشور مسبقًا من هذا المصدر",
    });
  }
  if (!isSupportedImportPlatform(platform) && platform !== "website") {
    warnings.push({ field: "platform", message: `المنصة "${platform}" — استخراج محدود` });
  }

  return {
    ok: true,
    partial: Boolean(textResult.extractionFailed || textResult.fetchFailed),
    duplicate,
    platform,
    imported,
    visionEnabled: isVisionEnabled(),
    extracted: parsed,
    parsed_fields: parsed,
    extracted_text: parsed.raw_ocr_text || imported.rawText || "",
    confidence_score: confidence,
    aiSuggestions: [...(textResult.aiSuggestions || []), ...(visionFromImage?.aiSuggestions || [])],
    validation: { ...validation, warnings },
    warnings,
    missing_fields: missing.length ? missing : textResult.missing_fields || [],
    sheikhMatch,
    imageUrl,
    message: textResult.message,
  };
}

export { normalizeImportUrl, isSupportedImportPlatform };
