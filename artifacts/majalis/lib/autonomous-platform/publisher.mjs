/**
 * Auto publisher — site tables, search index, dashboard counters.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { bulkImportToSupabase } from "../content-import/bulk-importer.mjs";
import { indexItem, embedChunks } from "../knowledge-engine/indexer.mjs";
import { registerFingerprint } from "./dedup.mjs";
import { CONTENT_PIPELINES } from "./config.mjs";
import { contentHash } from "./normalize.mjs";
import { logStructured } from "./monitoring.mjs";

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]+/g, "")
    .slice(0, 80) || "item";
}

function mapToImportPayload(contentType, record, source) {
  switch (contentType) {
    case "benefits":
      return {
        text: record.text || record.body,
        author_name: record.author_name || source?.name || null,
        category: record.category || source?.category || "فوائد",
        source: record.source_name || source?.name || null,
        status: "approved",
        verification_status: "verified",
        trust_level: source?.trust_score ?? 80,
      };
    case "questions":
      return {
        question: record.question || record.title,
        answer: record.answer || record.body || record.summary,
        category_name: record.category || record.category_name || "الفقه",
        reference: record.reference || record.source_name || source?.name,
        evidence: record.evidence || null,
        status: "published",
        review_status: "approved",
      };
    case "hadith":
      return {
        id: record.id || `hadith-akp-${contentHash("hadith", [record.text, record.source_name])}`,
        text: record.text || record.body,
        title: record.title || "حديث",
        narrator: record.narrator || record.metadata?.narrator || null,
        source_name: record.source_name || source?.name || "غير محدد",
        source_url: record.source_url || record.link || source?.source_url,
        grade: record.grade || record.metadata?.grade || null,
        explanation: record.explanation || record.summary || null,
        collection: record.collection || null,
        hadith_number: record.hadith_number || null,
        verification_status: "verified",
        trust_level: source?.trust_score ?? 90,
      };
    case "rulings":
      return {
        external_key: record.external_key || contentHash("rulings", [record.title, record.category]),
        title: record.title,
        summary: record.summary || record.body?.slice(0, 300),
        body: record.body || record.summary || record.title,
        category: record.category || "فقه عام",
        subcategory: record.subcategory || null,
        keywords: record.keywords || [],
        status: "approved",
        verification_status: "approved",
      };
    case "stories":
      return {
        id: record.id || `story-akp-${contentHash("stories", [record.title, record.body])}`,
        title: record.title,
        body: record.body || record.text,
        source_name: record.source_name || source?.name,
        source_url: record.source_url || record.link,
        category: record.category || "قصص",
        topic: record.topic || null,
        summary: record.summary || record.body?.slice(0, 200),
        verification_status: "verified",
        trust_level: source?.trust_score ?? 85,
      };
    case "articles":
      return {
        title: record.title,
        content: record.content || record.body || record.summary,
        external_url: record.source_url || record.link || source?.source_url,
        category: record.category || "مقالات",
        author: record.author || source?.name,
        status: "approved",
      };
    default:
      return record;
  }
}

async function publishStories(admin, payloads) {
  let published = 0;
  for (const batch of payloads) {
    const { error } = await admin.from("akp_stories").upsert(batch, { onConflict: "id" });
    if (error) throw new Error(error.message);
    published += batch.length;
  }
  return { ok: true, imported: published };
}

async function publishHadith(admin, payloads) {
  let published = 0;
  for (const row of payloads) {
    const { error } = await admin.from("verified_hadith_items").upsert(row, { onConflict: "id" });
    if (error) throw new Error(error.message);
    published += 1;
  }
  return { ok: true, imported: published };
}

export async function publishContentRecord({ contentType, record, source, fingerprint, pipelineRunId }) {
  const pipeline = CONTENT_PIPELINES[contentType];
  if (!pipeline) return { ok: false, error: "unknown_pipeline" };

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const payload = mapToImportPayload(contentType, record, source);
  const started = Date.now();

  try {
    let result;
    if (contentType === "stories") {
      result = await publishStories(admin, [payload]);
    } else if (contentType === "hadith") {
      result = await publishHadith(admin, [payload]);
    } else {
      result = await bulkImportToSupabase(pipeline.importType, [payload]);
    }

    const targetId = payload.id || payload.external_key || fingerprint?.fingerprint_hash;
    await registerFingerprint({
      fingerprint: fingerprint || { content_type: contentType, fingerprint_hash: contentHash(contentType, [payload.text || payload.title]) },
      targetTable: pipeline.targetTable,
      targetId,
      metadata: { pipeline_run_id: pipelineRunId, source_slug: source?.slug },
    });

    const searchText = payload.text || payload.body || payload.question || payload.title || payload.content;
    if (searchText) {
      try {
        const { indexed, chunk_ids } = await indexItem(admin, targetId, searchText, { contentType, source: source?.slug });
        if (chunk_ids?.length) {
          const { data: chunks } = await admin
            .from("knowledge_chunks")
            .select("id, chunk_text")
            .in("id", chunk_ids);
          if (chunks?.length) {
            await embedChunks(
              admin,
              targetId,
              chunks.map((c) => c.id),
              chunks.map((c) => c.chunk_text),
            );
          }
        }
      } catch {
        /* search index optional — pipeline continues */
      }
    }

    await logStructured({
      level: "info",
      component: "publisher",
      event: "published",
      pipeline: contentType,
      runId: pipelineRunId,
      durationMs: Date.now() - started,
      metadata: { targetId, source: source?.slug },
    });

    return { ok: true, published: result.imported ?? 1, targetId };
  } catch (err) {
    await logStructured({
      level: "error",
      component: "publisher",
      event: "publish_failed",
      pipeline: contentType,
      runId: pipelineRunId,
      message: String(err.message || err),
    });
    return { ok: false, error: String(err.message || err) };
  }
}

export async function publishBatch({ contentType, records, source, pipelineRunId }) {
  const results = { published: 0, failed: 0, errors: [] };
  for (const record of records) {
    const r = await publishContentRecord({ contentType, record, source, pipelineRunId });
    if (r.ok) results.published += 1;
    else {
      results.failed += 1;
      results.errors.push(r.error);
    }
  }
  return results;
}
