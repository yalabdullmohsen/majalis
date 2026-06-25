import { getSupabaseAdmin } from "../supabase-admin.mjs";
import {
  aiAnalyzeContent,
  calculateQualityScore,
  createExternalKey,
  detectContentType,
  ensureUniqueSlug,
  extractRssItems,
  generateSeoMetadata,
  verifySourceUrl,
} from "./auto-content-utils.mjs";

async function logPipelineEvent(supabase, payload) {
  try {
    await supabase.from("auto_import_logs").insert(payload);
  } catch (err) {
    console.error("[auto-content] log insert failed", err);
  }
}

async function processRssItem(supabase, source, rssItem, runId) {
  const stages = [];
  const externalKey = createExternalKey(source.name, rssItem.link, rssItem.title);

  // 1. Dedup
  stages.push("dedup");
  const { data: exists } = await supabase
    .from("auto_imported_content")
    .select("id")
    .eq("external_key", externalKey)
    .maybeSingle();

  if (exists) {
    return { action: "skipped", externalKey, stages };
  }

  // 2. Source verification
  stages.push("source_verify");
  const verification = verifySourceUrl(rssItem.link, source.url, source.trust_level || 80);
  if (!verification.verified) {
    await logPipelineEvent(supabase, {
      run_id: runId,
      source_id: source.id,
      status: "skipped",
      pipeline_stage: "source_verify",
      message: "فشل التحقق من المصدر",
      error_details: { errors: verification.errors, url: rssItem.link },
      item_title: rssItem.title,
      item_external_key: externalKey,
    });
    return { action: "failed", externalKey, stages, error: "source_verify_failed" };
  }

  // 3. Classification
  stages.push("classify");
  const contentType = detectContentType(rssItem.title, rssItem.description);

  // 4. AI analysis
  stages.push("ai_analyze");
  const analysis = await aiAnalyzeContent({
    title: rssItem.title,
    description: rssItem.description,
    sourceName: source.name,
  });

  // 5. Slug
  stages.push("slug");
  const slug = await ensureUniqueSlug(supabase, rssItem.title);

  // 6. SEO metadata
  stages.push("seo");
  const category = analysis.category || source.category || "عام";
  const summary = analysis.summary || rssItem.description.slice(0, 500);
  const { seoTitle, seoDescription, structuredData } = generateSeoMetadata({
    title: rssItem.title,
    summary,
    category,
    slug,
    sourceName: source.name,
  });

  const record = {
    external_key: externalKey,
    title: rssItem.title,
    slug,
    content_type: contentType,
    category,
    summary,
    content: rssItem.description,
    source_name: source.name,
    source_url: source.url,
    original_url: rssItem.link,
    tags: Array.isArray(analysis.tags) ? analysis.tags : [],
    verification_status: "needs_review",
    status: "needs_review",
    source_verified: true,
    pipeline_stage: "ready_for_review",
    seo_title: seoTitle,
    seo_description: seoDescription,
    structured_data: structuredData,
    ai_analysis: analysis,
  };

  // 7. Quality score
  stages.push("quality");
  record.quality_score = calculateQualityScore(record);

  // 8. Save (never auto-publish)
  stages.push("save");
  const { error: insertError } = await supabase.from("auto_imported_content").insert(record);
  if (insertError) throw insertError;

  await logPipelineEvent(supabase, {
    run_id: runId,
    source_id: source.id,
    status: "success",
    pipeline_stage: "save",
    message: "تم استيراد المادة — بانتظار المراجعة",
    imported_count: 1,
    item_title: rssItem.title,
    item_external_key: externalKey,
  });

  return { action: "imported", externalKey, stages, slug };
}

export async function runAutoContentSync({ triggerType = "cron" } = {}) {
  const started = Date.now();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { ok: false, error: "Supabase not configured", imported: 0, skipped: 0, failed: 0 };
  }

  const { data: runRow, error: runError } = await supabase
    .from("auto_import_runs")
    .insert({ trigger_type: triggerType, status: "running" })
    .select("id")
    .single();

  const runId = runRow?.id || null;

  if (runError && !runError.message?.includes("does not exist")) {
    console.warn("[auto-content] run tracking unavailable:", runError.message);
  }

  const { data: sources, error: sourcesError } = await supabase
    .from("trusted_sources")
    .select("*")
    .eq("is_active", true);

  if (sourcesError) {
    if (runId) {
      await supabase.from("auto_import_runs").update({
        status: "failed",
        error_summary: sourcesError.message,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - started,
      }).eq("id", runId);
    }
    return { ok: false, error: sourcesError.message, imported: 0, skipped: 0, failed: 0, runId };
  }

  let totalImported = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let sourcesOk = 0;
  let sourcesFailed = 0;

  for (const source of sources || []) {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const sourceStarted = Date.now();

    try {
      const response = await fetch(source.url, {
        headers: { "User-Agent": "MajlisIlmBot/1.0 (+https://majlisilm.com)" },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`Source failed: ${response.status}`);
      }

      const xml = await response.text();
      const rssItems = extractRssItems(xml);

      for (const rssItem of rssItems) {
        try {
          const result = await processRssItem(supabase, source, rssItem, runId);
          if (result.action === "imported") imported++;
          else if (result.action === "skipped") skipped++;
          else if (result.action === "failed") failed++;
        } catch (itemError) {
          failed++;
          await logPipelineEvent(supabase, {
            run_id: runId,
            source_id: source.id,
            status: "failed",
            pipeline_stage: "save",
            message: itemError.message || "خطأ غير معروف",
            error_details: { stack: itemError.stack, title: rssItem.title },
            failed_count: 1,
            item_title: rssItem.title,
          });
        }
      }

      await supabase
        .from("trusted_sources")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", source.id);

      await logPipelineEvent(supabase, {
        run_id: runId,
        source_id: source.id,
        status: "success",
        message: "تمت مزامنة المصدر",
        imported_count: imported,
        skipped_count: skipped,
        failed_count: failed,
        duration_ms: Date.now() - sourceStarted,
      });

      sourcesOk++;
    } catch (error) {
      sourcesFailed++;
      failed++;

      await logPipelineEvent(supabase, {
        run_id: runId,
        source_id: source.id,
        status: "failed",
        message: error.message,
        error_details: { source: source.name, url: source.url },
        imported_count: imported,
        skipped_count: skipped,
        failed_count: failed,
        duration_ms: Date.now() - sourceStarted,
      });
    }

    totalImported += imported;
    totalSkipped += skipped;
    totalFailed += failed;
  }

  const durationMs = Date.now() - started;
  const summary = {
    ok: true,
    runId,
    imported: totalImported,
    skipped: totalSkipped,
    failed: totalFailed,
    sourcesTotal: (sources || []).length,
    sourcesOk,
    sourcesFailed,
    durationMs,
  };

  if (runId) {
    await supabase.from("auto_import_runs").update({
      status: sourcesFailed > 0 && sourcesOk === 0 ? "failed" : "completed",
      sources_total: (sources || []).length,
      sources_ok: sourcesOk,
      sources_failed: sourcesFailed,
      imported_count: totalImported,
      skipped_count: totalSkipped,
      failed_count: totalFailed,
      duration_ms: durationMs,
      finished_at: new Date().toISOString(),
    }).eq("id", runId);
  }

  return summary;
}

export async function getAutoContentPipelineStats(limit = 10) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Supabase not configured" };

  const [runsRes, logsRes, pendingRes, publishedRes, sourcesRes] = await Promise.all([
    supabase.from("auto_import_runs").select("*").order("started_at", { ascending: false }).limit(limit),
    supabase.from("auto_import_logs").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("auto_imported_content").select("id", { count: "exact", head: true }).eq("status", "needs_review"),
    supabase.from("auto_imported_content").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("trusted_sources").select("*").order("name"),
  ]);

  return {
    ok: true,
    runs: runsRes.data || [],
    logs: logsRes.data || [],
    pendingCount: pendingRes.count ?? 0,
    publishedCount: publishedRes.count ?? 0,
    sources: sourcesRes.data || [],
  };
}

export async function getPublishedAutoContentFeed({ limit = 20, contentType = null, slug = null } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Supabase not configured", items: [] };

  if (slug) {
    const { data, error } = await supabase.rpc("get_published_auto_content_by_slug", { p_slug: slug });
    if (!error && data) {
      const item = Array.isArray(data) ? data[0] : data;
      return { ok: true, items: item ? [item] : [], item: item || null };
    }

    const { data: direct, error: directError } = await supabase
      .from("auto_imported_content")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .eq("verification_status", "verified")
      .maybeSingle();

    if (directError) return { ok: false, error: directError.message, items: [] };
    return { ok: true, items: direct ? [direct] : [], item: direct || null };
  }

  const { data, error } = await supabase.rpc("get_published_auto_content", {
    p_limit: limit,
    p_content_type: contentType,
  });

  if (error) return { ok: false, error: error.message, items: [] };
  return { ok: true, items: data || [] };
}
