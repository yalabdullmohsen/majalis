/**
 * Phase 5 content pipeline — full stage flow on top of AKP/MKE.
 *
 * Fetch → Normalize → Validate → Scientific Verification → Dedup →
 * Classification → Keywords → Quality Score → Publish → Search Index
 */
import { normalizeArabicText } from "../autonomous-platform/normalize.mjs";
import { checkDuplicate } from "../autonomous-platform/dedup.mjs";
import { verifyContent, enqueueReview } from "../autonomous-platform/verification.mjs";
import { publishContentRecord } from "../autonomous-platform/publisher.mjs";
import { validateRow } from "../content-import/validators.mjs";
import { resolveContentType } from "../content-import/registry.mjs";
import { indexItem } from "../knowledge-engine/indexer.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { updateSourceStatsFromFetch } from "./sources-stats.mjs";
import { loadPlatformSettings } from "./settings.mjs";
import { logSourceOperation, logStage, enqueueRetry } from "./monitoring.mjs";

const ARABIC_STOP = new Set(["في", "من", "إلى", "على", "أن", "التي", "الذي", "هذا", "هذه", "ما", "لا", "كل", "عن", "مع", "هو", "هي", "كان", "كانت"]);

export function normalizeRecord(record, contentType) {
  const out = { ...record };
  for (const key of ["text", "body", "title", "question", "answer", "content"]) {
    if (typeof out[key] === "string") {
      out[key] = out[key].replace(/\s+/g, " ").trim();
      if (key === "text" || key === "body" || key === "question") {
        out[`${key}_normalized`] = normalizeArabicText(out[key]);
      }
    }
  }
  out._contentType = contentType;
  return out;
}

export function validateRecord(record, contentType) {
  const def = resolveContentType(contentType);
  if (!def) return { ok: false, errors: [`unknown type: ${contentType}`] };
  const result = validateRow(def.type, record, 0);
  return result.ok ? { ok: true } : { ok: false, errors: result.errors };
}

export function classifyRecord(record, source) {
  const category = record.category || record.category_name || source?.category || "general";
  const topics = [];
  const text = [record.title, record.text, record.body, record.question].filter(Boolean).join(" ");
  if (/صلا|صلو|ركو|سجود|وضو/.test(text)) topics.push("العبادات");
  if (/زكا|صدق|مال|تجار/.test(text)) topics.push("المعاملات");
  if (/حج|عمر|مك|مدينة/.test(text)) topics.push("الحج");
  if (/توح|إيمان|عقيد|قدر/.test(text)) topics.push("العقيدة");
  return { category, topics, classification: topics[0] || category };
}

export function extractKeywords(record, max = 12) {
  const text = normalizeArabicText(
    [record.title, record.text, record.body, record.question, record.answer].filter(Boolean).join(" "),
  );
  const tokens = text.split(/\s+/).filter((w) => w.length > 2 && !ARABIC_STOP.has(w));
  const freq = new Map();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

export function computeQualityScore(verification, record) {
  let score = verification.score ?? 70;
  const text = record.text || record.body || record.answer || "";
  if (text.length > 100) score += 5;
  if (text.length > 300) score += 5;
  if (record.source_url || record.reference) score += 3;
  if (verification.checks?.arabic_ratio?.ok) score += 5;
  return Math.min(100, Math.max(0, score));
}

export async function processContentItem({ record, contentType, source, runId, forcePublish = false }) {
  const stages = [];
  const started = Date.now();
  let item = { ...record };

  const stage = async (name, fn) => {
    const t0 = Date.now();
    const result = await fn();
    stages.push({ stage: name, ms: Date.now() - t0, ok: result.ok !== false });
    await logStage({ runId, pipeline: contentType, stage: name, durationMs: Date.now() - t0, status: result.ok === false ? "failed" : "completed" });
    return result;
  };

  const normalized = await stage("normalize", async () => {
    item = normalizeRecord(item, contentType);
    return { ok: true, record: item };
  });

  const validated = await stage("validate", async () => {
    const v = validateRecord(item, contentType);
    if (!v.ok) return { ok: false, reason: "validation_failed", errors: v.errors };
    return { ok: true };
  });
  if (!validated.ok) {
    return { ok: false, decision: "rejected", reason: validated.reason, stages };
  }

  const verified = await stage("scientific_verification", async () => {
    const v = await verifyContent({ contentType, record: item, source });
    return { ok: v.ok, verification: v };
  });

  const deduped = await stage("deduplication", async () => {
    const dup = await checkDuplicate({ contentType, record: item, source });
    if (dup.duplicate) return { ok: false, duplicate: true, fingerprint: dup.fingerprint };
    return { ok: true, fingerprint: dup.fingerprint };
  });
  if (!deduped.ok && deduped.duplicate) {
    return { ok: false, decision: "duplicate", stages };
  }

  const classified = await stage("classification", async () => {
    const c = classifyRecord(item, source);
    item = { ...item, ...c, ai_topic: c.topics[0] || c.category };
    return { ok: true, classification: c };
  });

  await stage("keyword_extraction", async () => {
    item.keywords = extractKeywords(item);
    return { ok: true };
  });

  const qualityScore = computeQualityScore(verified.verification || {}, item);
  item.quality_score = qualityScore;
  await logStage({ runId, pipeline: contentType, stage: "quality_score", durationMs: 0, status: "completed", metadata: { score: qualityScore } });

  const { autoPublish } = await loadPlatformSettings();
  const sourceAutoPublish = source.publication_policy?.auto_publish
    && source.trust_score >= (source.publication_policy?.min_trust ?? 80);
  const canPublish = verified.ok && (forcePublish || (autoPublish.enabled && sourceAutoPublish) || sourceAutoPublish);

  if (!verified.ok || !canPublish) {
    await enqueueReview({
      contentType,
      record: item,
      source,
      verification: verified.verification || { ok: false, blockers: ["verification_failed"] },
      pipelineRunId: runId,
    });
    return { ok: true, decision: "review_queued", qualityScore, stages, durationMs: Date.now() - started };
  }

  const published = await stage("publish", async () => {
    const pub = await publishContentRecord({
      contentType,
      record: item,
      source,
      fingerprint: deduped.fingerprint,
      pipelineRunId: runId,
    });
    if (!pub.ok) {
      await enqueueRetry({
        jobType: `publish_${contentType}`,
        payload: { record: item, sourceSlug: source.slug },
        error: pub.error,
        sourceId: source.id,
        sourceSlug: source.slug,
      });
    }
    return pub;
  });

  if (published.ok) {
    await stage("search_index", async () => {
      try {
        const admin = getSupabaseAdmin();
        if (admin && published.id) {
          await indexItem(admin, published.id, item.text || item.body || "", { kind: contentType, title: item.title });
        }
      } catch {
        /* index optional */
      }
      return { ok: true };
    });
    return { ok: true, decision: "published", id: published.id, qualityScore, stages, durationMs: Date.now() - started };
  }

  return { ok: false, decision: "failed", error: published.error, stages, durationMs: Date.now() - started };
}

export async function syncSourceNow(source, contentType, opts = {}) {
  const { fetchFromConnector } = await import("./connectors/index.mjs");
  const opId = await logSourceOperation({
    source,
    operation: "sync",
    status: "running",
    triggeredBy: opts.triggeredBy || "admin",
  });

  const started = Date.now();
  try {
    const items = await fetchFromConnector(source, contentType);
    let published = 0;
    let duplicates = 0;
    let rejected = 0;
    let reviewQueued = 0;

    for (const item of items.slice(0, opts.maxItems || 20)) {
      const result = await processContentItem({
        record: item,
        contentType,
        source,
        runId: opts.runId,
        forcePublish: opts.forcePublish,
      });
      if (result.decision === "published") published += 1;
      else if (result.decision === "duplicate") duplicates += 1;
      else if (result.decision === "review_queued") reviewQueued += 1;
      else rejected += 1;
    }

    await updateSourceStatsFromFetch(source.id, { ok: true, items: items.length });
    await logSourceOperation({
      id: opId,
      source,
      operation: "sync",
      status: "completed",
      itemsFound: items.length,
      itemsPublished: published,
      itemsDuplicate: duplicates,
      itemsRejected: rejected + reviewQueued,
      durationMs: Date.now() - started,
      triggeredBy: opts.triggeredBy || "admin",
    });

    return { ok: true, itemsFound: items.length, published, duplicates, rejected, reviewQueued };
  } catch (err) {
    await updateSourceStatsFromFetch(source.id, { ok: false, error: err.message });
    await logSourceOperation({
      id: opId,
      source,
      operation: "sync",
      status: "failed",
      errorMessage: String(err.message || err),
      durationMs: Date.now() - started,
      triggeredBy: opts.triggeredBy || "admin",
    });
    return { ok: false, error: String(err.message || err) };
  }
}

async function updateSourceStats(sourceId, { ok, published = 0, items = 0, error }) {
  await updateSourceStatsFromFetch(sourceId, { ok, items, error });
  const admin = getSupabaseAdmin();
  if (!admin || !sourceId || !ok) return;
  try {
    const { data: current } = await admin.from("akp_content_sources").select("items_published").eq("id", sourceId).maybeSingle();
    await admin.from("akp_content_sources").update({
      items_published: (current?.items_published || 0) + published,
      updated_at: new Date().toISOString(),
    }).eq("id", sourceId);
  } catch {
    /* optional */
  }
}
