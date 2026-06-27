/**
 * Monitor trusted_lesson_sources → extract → auto-publish or review draft.
 * Only fetches configured trusted URLs — no open web search.
 */
import { importFromUrl } from "./url-importer.mjs";
import { extractLessonFromText, extractLessonFromImage, isVisionEnabled } from "./lesson-extractor.mjs";
import { matchSheikhByName } from "./sheikh-matcher.mjs";
import { listTrustedSources, updateSourceCheckStatus } from "./trusted-sources.mjs";
import { evaluateAutoPublish } from "./auto-publish-engine.mjs";
import { findDuplicateLesson, hashImageBuffer } from "./lesson-duplicate-detector.mjs";
import { writeAutomationAudit } from "./automation-audit.mjs";
import { createLessonImportDraft } from "./lesson-import-draft.mjs";
import { publishLessonDraft } from "./publish-lesson.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { discoverInstagramSource, enrichParsedFromSourceConfig, INSTAGRAM_CONNECTOR_HINTS } from "./instagram-connector.mjs";
import { resolveSheikhIdForDraft } from "./lesson-import-actions.mjs";

async function parseRssItems(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks.slice(0, 15)) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim();
    const desc = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const img = block.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1];
    if (link) items.push({ title: title || "", link, description: desc || "", imageUrl: img || "" });
  }
  return items;
}

async function fetchRemoteImageBuffer(imageUrl) {
  if (!imageUrl) return null;
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "MajalisBot/1.0 (+https://majlisilm.com)", Accept: "image/*" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) return null;
    return buf;
  } catch {
    return null;
  }
}

async function extractFromItem(item, source) {
  const sourceUrl = item.link || source.url;
  let parsed = {};
  let extractedText = "";
  let confidenceScore = 0.2;
  let imageUrl = item.imageUrl || null;
  let imageHash = null;

  try {
    const imported = await importFromUrl(sourceUrl);
    extractedText = imported.rawText || `${imported.title}\n${imported.description}`;
    imageUrl = imageUrl || imported.imageUrl || null;

    const textResult = await extractLessonFromText({
      text: extractedText || `${item.title}\n${item.description}`,
      sourceUrl,
    });
    parsed = { ...(textResult.parsed_fields || textResult.extracted || {}) };
    confidenceScore = textResult.confidence_score != null ? textResult.confidence_score : Number(parsed.confidence) || 0.3;

    if (imageUrl && isVisionEnabled()) {
      const buf = await fetchRemoteImageBuffer(imageUrl);
      if (buf) {
        imageHash = hashImageBuffer(buf);
        const vision = await extractLessonFromImage({
          imageBase64: buf.toString("base64"),
          mimeType: "image/jpeg",
        });
        if (vision.parsed_fields) {
          parsed = { ...parsed, ...vision.parsed_fields };
          confidenceScore = Math.max(confidenceScore, vision.confidence_score ?? 0);
          extractedText = vision.extracted_text || extractedText;
        }
      }
    }

    if (!parsed.title && item.title) parsed.title = item.title;
    if (!parsed.description && item.description) parsed.description = item.description;
    if (source.city && !parsed.city) parsed.city = source.city;
    if (source.country && !parsed.country) parsed.country = source.country;
    if (source.category && !parsed.category) parsed.category = source.category;
    parsed.source_url = sourceUrl;
    parsed = enrichParsedFromSourceConfig(parsed, source);
  } catch (err) {
    parsed = {
      title: item.title || "",
      description: item.description || "",
      source_url: sourceUrl,
    };
    extractedText = item.description || "";
    confidenceScore = 0.1;
    return { parsed, extractedText, confidenceScore, imageUrl, imageHash, extractError: String(err.message || err) };
  }

  return { parsed, extractedText, confidenceScore, imageUrl, imageHash };
}

export async function processAutomationItem({ source, item, connectorHint }) {
  const sourceUrl = item.link || source.url;

  if (item.connectorPending || connectorHint) {
    const draft = await createLessonImportDraft({
      sourceType: source.source_type,
      sourceUrl,
      imageUrl: null,
      extractedText: item.description || "",
      parsedPayload: enrichParsedFromSourceConfig(
        { title: item.title || source.name, description: item.description || "", source_url: sourceUrl },
        source,
      ),
      confidenceScore: 0,
      warnings: INSTAGRAM_CONNECTOR_HINTS.map((h) => ({ field: "connector", message: h })),
      missingFields: ["poster_image", "date", "lesson_time", "speaker_name"],
      createdBy: null,
      status: "needs_review",
      sourceId: source.id,
      automationStatus: "pending_review",
      decisionReason: connectorHint || "instagram_connector_required",
    });
    await writeAutomationAudit({
      sourceId: source.id,
      sourceUrl,
      extractedText: item.description || "",
      parsedPayload: { title: item.title },
      confidenceScore: 0,
      decision: "pending_review",
      reason: connectorHint || "instagram_connector_required",
      draftId: draft.draft?.id,
    });
    return {
      decision: "pending_review",
      autoPublished: false,
      draftId: draft.draft?.id,
      sourceUrl,
      title: item.title,
      reason: connectorHint || "instagram_connector_required",
      connectorRequired: true,
    };
  }

  const { parsed, extractedText, confidenceScore, imageUrl, imageHash, extractError } = await extractFromItem(item, source);
  const sheikhMatch = await matchSheikhByName(parsed.speaker_name);
  const duplicate = await findDuplicateLesson({ parsed, sourceUrl, imageHash });

  const evaluation = evaluateAutoPublish({
    source,
    parsed,
    confidenceScore,
    duplicate,
    sheikhMatch,
    sourceUrl,
    imageUrl,
  });

  let lessonId = null;
  let draftId = null;
  let decision = evaluation.decision;
  let reason = evaluation.reasons?.join(" — ") || extractError || "";

  if (evaluation.decision === "duplicate") {
    await writeAutomationAudit({
      sourceId: source.id,
      sourceUrl,
      extractedText,
      parsedPayload: parsed,
      confidenceScore,
      decision: "duplicate",
      reason: evaluation.duplicate?.message || reason,
      imageHash,
      similarityScore: duplicate.similarity_score,
    });
    return { decision: "duplicate", sourceUrl, reason: evaluation.duplicate?.message };
  }

  if (evaluation.autoPublish) {
    const draftStub = { id: null, matched_sheikh_id: sheikhMatch.matched?.id, source_url: sourceUrl };
    const sheikhId = await resolveSheikhIdForDraft(draftStub, parsed, null);

    const publish = await publishLessonDraft({
      extracted: parsed,
      sheikhId,
      imageUrl,
      sourceUrl,
      sourceId: source.id,
      confidenceScore,
      importedBy: "automation",
      posterImageHash: imageHash,
      userId: null,
      draftId: null,
    });

    if (publish.ok) {
      lessonId = publish.record.id;
      decision = "approved";
      reason = "auto_publish";
    } else {
      decision = "pending_review";
      reason = publish.validation?.errors?.map((e) => e.message).join(" — ") || publish.error || "publish_failed";
    }
  }

  if (!lessonId) {
    const draft = await createLessonImportDraft({
      sourceType: source.source_type,
      sourceUrl,
      imageUrl,
      extractedText,
      parsedPayload: parsed,
      confidenceScore,
      warnings: evaluation.reasons.map((r) => ({ field: "automation", message: r })),
      missingFields: evaluation.missing || [],
      matchedSheikhId: sheikhMatch.matched?.id || null,
      suggestedSheikh: sheikhMatch.proposedDraft,
      createdBy: null,
      status: "needs_review",
      sourceId: source.id,
      automationStatus: decision === "pending_review" ? "pending_review" : "manual",
      decisionReason: reason,
      imageHash,
    });
    draftId = draft.draft?.id;
    if (decision === "approved") decision = "pending_review";
  }

  await writeAutomationAudit({
    sourceId: source.id,
    sourceUrl,
    extractedText,
    parsedPayload: parsed,
    confidenceScore,
    decision: lessonId ? "approved" : decision,
    reason,
    lessonId,
    draftId,
    imageHash,
    similarityScore: duplicate.similarity_score,
  });

  return {
    decision: lessonId ? "approved" : decision,
    autoPublished: Boolean(lessonId),
    lessonId,
    draftId,
    sourceUrl,
    title: parsed.title,
    reason,
  };
}

async function discoverItems(source) {
  const feedUrl = source.feed_url || (source.source_type === "rss" ? source.url : null);

  if (source.source_type === "instagram") {
    const ig = await discoverInstagramSource(source);
    return { items: ig.items, connectorHint: ig.connectorRequired ? ig.hint : null, instagramLimited: ig.instagramLimited };
  }

  if (feedUrl || source.source_type === "rss") {
    const imported = await importFromUrl(feedUrl || source.url);
    const items = await parseRssItems(imported.rawText || imported.description || "");
    return {
      items: items.length ? items : [{ title: imported.title, link: source.url, description: imported.description, imageUrl: imported.imageUrl }],
      connectorHint: null,
    };
  }

  const imported = await importFromUrl(source.url);
  return {
    items: [
      {
        title: imported.title,
        link: imported.finalUrl || source.url,
        description: imported.description,
        imageUrl: imported.imageUrl,
      },
    ],
    connectorHint: null,
  };
}

export async function runLessonSourceMonitor({ dryRun = false, sourceId = null } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing", processed: 0 };

  let sources = await listTrustedSources({ activeOnly: true });
  if (sourceId) sources = sources.filter((s) => s.id === sourceId);

  const results = [];
  let published = 0;
  let review = 0;
  let duplicates = 0;
  let errors = 0;

  let connectorNeeded = 0;

  for (const source of sources) {
    try {
      const { items, connectorHint } = await discoverItems(source);
      for (const item of items) {
        if (dryRun) {
          results.push({ source: source.name, item: item.link, dryRun: true, connectorHint });
          continue;
        }
        const outcome = await processAutomationItem({ source, item, connectorHint });
        results.push({ source: source.name, ...outcome, connectorHint });
        if (outcome.connectorRequired) connectorNeeded += 1;
        if (outcome.autoPublished) published += 1;
        else if (outcome.decision === "duplicate") duplicates += 1;
        else review += 1;
      }
      await updateSourceCheckStatus(source.id, { success: true });
      if (connectorHint) {
        const admin = getSupabaseAdmin();
        await admin
          ?.from("trusted_lesson_sources")
          .update({ last_error: String(connectorHint).slice(0, 500) })
          .eq("id", source.id);
      }
    } catch (err) {
      errors += 1;
      await updateSourceCheckStatus(source.id, { success: false, error: err.message });
      results.push({ source: source.name, error: String(err.message || err) });
    }
  }

  return {
    ok: true,
    sourcesChecked: sources.length,
    published,
    pendingReview: review,
    duplicates,
    errors,
    connectorNeeded,
    results,
  };
}

/** In-memory simulation for tests (no network/DB). */
export function simulateAutoPublishScenario({ source, parsed, confidenceScore, sheikhMatch, duplicate, sourceUrl, imageUrl }) {
  return evaluateAutoPublish({ source, parsed, confidenceScore, duplicate, sheikhMatch, sourceUrl, imageUrl });
}
