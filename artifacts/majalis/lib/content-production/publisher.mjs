/**
 * Publisher — writes validated content to target tables + tracking.
 */
import { registerDedup } from "./dedup.mjs";
import { buildDedupKeys } from "./dedup.mjs";

export async function publishToTarget(admin, pipelineId, item, stagingId = null) {
  if (!admin) throw new Error("Supabase admin required for publishing");

  const meta = item.metadata || {};
  let targetTable;
  let targetId;
  let row;

  switch (pipelineId) {
    case "questions": {
      targetTable = "platform_quiz_questions";
      row = {
        question: item.question || item.body,
        options: item.options || meta.options,
        correct_index: item.correct_index ?? meta.correct_index ?? 0,
        category: item.category || meta.category || "عام",
        topic: item.topic || meta.topic || null,
        difficulty: item.difficulty || meta.difficulty || "متوسط",
        source_name: item.source_name || meta.source_name,
        source_url: item.source_url || meta.source_url || null,
        keywords: item.keywords || meta.keywords || [],
        external_key: item.external_key || meta.external_key || null,
        status: "published",
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await admin
        .from(targetTable)
        .upsert(row, { onConflict: "external_key" })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      targetId = data?.id;
      break;
    }

    case "fawaid": {
      targetTable = "fawaid";
      row = {
        text: item.text || item.body,
        author_name: item.author_name || meta.author_name || item.source_name,
        status: "approved",
      };
      const { data, error } = await admin.from(targetTable).insert(row).select("id").maybeSingle();
      if (error) throw error;
      targetId = data?.id;
      break;
    }

    case "hadith": {
      targetTable = "verified_hadith_items";
      row = {
        id: item.external_key || item.id || `cp-${buildDedupKeys(item).content_hash.slice(0, 16)}`,
        collection: meta.collection || item.collection || null,
        hadith_number: meta.hadith_number || item.hadith_number || null,
        title: item.title || null,
        text: item.text || item.body,
        narrator: item.narrator || meta.narrator || null,
        source_name: item.source_name || meta.source_name,
        source_url: item.source_url || meta.source_url,
        grade: item.grade || meta.grade || null,
        chapter: item.chapter || meta.chapter || null,
        keywords: item.keywords || meta.keywords || [],
        explanation: item.explanation || meta.explanation || null,
        verification_status: "verified",
        quality_score: meta.quality_score || 85,
        trust_level: meta.trust_level || 90,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await admin
        .from(targetTable)
        .upsert(row, { onConflict: "id" })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      targetId = data?.id;
      break;
    }

    case "rulings": {
      targetTable = "sharia_rulings";
      row = {
        id: item.external_key || item.id,
        title: item.title,
        body: item.body,
        summary: item.summary || item.body?.slice(0, 200),
        category: item.category || meta.category,
        subcategory: meta.subcategory || null,
        keywords: item.keywords || meta.keywords || [],
        status: "approved",
        verification_status: "approved",
        source_origin: item.source_origin || meta.source_origin || "content-production",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (!row.id) {
        const { data, error } = await admin.from(targetTable).insert(row).select("id").maybeSingle();
        if (error) throw error;
        targetId = data?.id;
      } else {
        const { data, error } = await admin
          .from(targetTable)
          .upsert(row, { onConflict: "id" })
          .select("id")
          .maybeSingle();
        if (error) throw error;
        targetId = data?.id;
      }
      break;
    }

    case "articles": {
      targetTable = "auto_imported_content";
      row = {
        title: item.title,
        body: item.body,
        source_url: item.source_url || meta.source_url,
        source_name: item.source_name || meta.source_name,
        pipeline_stage: "published",
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await admin.from(targetTable).insert(row).select("id").maybeSingle();
      if (error) throw error;
      targetId = data?.id;
      break;
    }

    case "stories": {
      targetTable = "content_production_published";
      targetId = item.external_key || meta.story_id || buildDedupKeys(item).content_hash.slice(0, 16);
      row = {
        pipeline: "stories",
        staging_id: stagingId,
        target_table: "surah_stories",
        target_id: String(targetId),
        source_url: item.source_url || meta.source_url,
        metadata: {
          title: item.title,
          body: item.body,
          surah_number: meta.surah_number,
          source_name: item.source_name || meta.source_name,
        },
      };
      const { data, error } = await admin.from(targetTable).insert(row).select("id").maybeSingle();
      if (error) throw error;
      return { targetTable: "surah_stories", targetId: String(targetId), publishedRecordId: data?.id };
    }

    default:
      throw new Error(`Unknown pipeline: ${pipelineId}`);
  }

  const keys = buildDedupKeys(item);
  await registerDedup(admin, pipelineId, keys, String(targetId), item.source_url || meta.source_url);

  const { data: pub, error: pubErr } = await admin
    .from("content_production_published")
    .insert({
      pipeline: pipelineId,
      staging_id: stagingId,
      target_table: targetTable,
      target_id: String(targetId),
      source_url: item.source_url || meta.source_url,
      metadata: { title: item.title, category: item.category || meta.category },
    })
    .select("id")
    .maybeSingle();
  if (pubErr) throw pubErr;

  return { targetTable, targetId: String(targetId), publishedRecordId: pub?.id };
}

export async function bumpDailyStats(admin, pipelineId, counts) {
  if (!admin) return;
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await admin
    .from("content_production_daily_stats")
    .select("*")
    .eq("stat_date", today)
    .eq("pipeline", pipelineId)
    .maybeSingle();

  const row = {
    stat_date: today,
    pipeline: pipelineId,
    produced: (existing?.produced || 0) + (counts.produced || 0),
    published: (existing?.published || 0) + (counts.published || 0),
    rejected: (existing?.rejected || 0) + (counts.rejected || 0),
    duplicate: (existing?.duplicate || 0) + (counts.duplicate || 0),
  };

  await admin.from("content_production_daily_stats").upsert(row, { onConflict: "stat_date,pipeline" });
}
