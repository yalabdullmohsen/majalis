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
import {
  OFFICIAL_TRUSTED_SOURCES,
  MIN_AUTO_PUBLISH_QUALITY,
  MIN_AUTO_PUBLISH_TRUST,
} from "./trusted-sources-seed.mjs";
import { createPipelineLogger, SKIP_REASONS } from "./pipeline-logger.mjs";

const FETCH_RETRIES = 3;
const FETCH_TIMEOUT_MS = 20000;

async function logPipelineEvent(supabase, payload) {
  if (!supabase) return;
  try {
    await supabase.from("auto_import_logs").insert(payload);
  } catch (err) {
    console.error("[auto-content] DB log insert failed:", err.message);
  }
}

async function fetchWithRetry(url, logger, label) {
  let lastError;
  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt++) {
    try {
      logger.log("download", `Downloading ${label} (attempt ${attempt}/${FETCH_RETRIES})...`);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "MajlisIlmBot/2.0 (+https://majlisilm.com)",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error(SKIP_REASONS.AUTH_FAILED);
      }
      if (response.status === 429) {
        throw new Error(SKIP_REASONS.BLOCKED);
      }
      if (!response.ok) {
        throw new Error(`${SKIP_REASONS.FETCH_FAILED}: HTTP ${response.status}`);
      }

      const body = await response.text();
      logger.log("download", `Downloaded Successfully (${body.length} bytes)`, { detail: { url } });
      return body;
    } catch (err) {
      lastError = err;
      const reason = err.name === "TimeoutError" ? SKIP_REASONS.TIMEOUT : err.message;
      logger.warn("retry", `Retry ${attempt}/${FETCH_RETRIES} — ${reason}`);
      if (attempt < FETCH_RETRIES) {
        await new Promise((r) => setTimeout(r, attempt * 1500));
      }
    }
  }
  logger.error("download", `Source Failed after ${FETCH_RETRIES} retries`, { detail: { url, reason: lastError?.message } });
  throw lastError;
}

function classifyFeedFailure(error, xml) {
  if (!xml || xml.trim().length < 50) return SKIP_REASONS.INVALID_FEED;
  if (!xml.includes("<item") && !xml.includes("<entry")) return SKIP_REASONS.NO_RSS;
  return error?.message || SKIP_REASONS.FETCH_FAILED;
}

function shouldAutoPublish(record, source) {
  const trust = source.trust_level || 0;
  return (
    record.source_verified &&
    record.quality_score >= MIN_AUTO_PUBLISH_QUALITY &&
    trust >= MIN_AUTO_PUBLISH_TRUST
  );
}

async function ensureTrustedSources(supabase, logger) {
  const { data: existing, error } = await supabase.from("trusted_sources").select("id").limit(1);
  if (error) throw new Error(`Database error loading sources: ${error.message}`);
  if (existing && existing.length > 0) {
    logger.log("sources", `Loaded existing sources from database`);
    return false;
  }

  logger.warn("sources", "No Sources in database — seeding official trusted sources...");
  const rows = OFFICIAL_TRUSTED_SOURCES.map((s) => ({
    name: s.name,
    source_type: s.source_type,
    url: s.url,
    category: s.category,
    trust_level: s.trust_level,
    is_active: s.is_active !== false,
  }));

  const { error: seedError } = await supabase.from("trusted_sources").upsert(rows, { onConflict: "url" });
  if (seedError) throw new Error(`Failed to seed sources: ${seedError.message}`);

  logger.log("sources", `Seeded ${rows.length} official trusted sources`);
  return true;
}

async function processRssItem(supabase, source, rssItem, runId, logger) {
  const externalKey = createExternalKey(source.name, rssItem.link, rssItem.title);

  logger.log("dedup", `Checking duplicate: ${rssItem.title.slice(0, 50)}...`);
  const { data: exists } = await supabase
    .from("auto_imported_content")
    .select("id, status")
    .eq("external_key", externalKey)
    .maybeSingle();

  if (exists) {
    logger.log("dedup", `Skipped — ${SKIP_REASONS.DUPLICATE}`, { detail: { title: rssItem.title } });
    return { action: "skipped", reason: SKIP_REASONS.DUPLICATE, externalKey };
  }

  logger.log("validate", "Validating source URL...");
  const officialSite = source.official_site || source.url;
  const verification = verifySourceUrl(rssItem.link, officialSite, source.trust_level || 80);
  if (!verification.verified) {
    logger.warn("validate", `Skipped — ${SKIP_REASONS.SOURCE_VERIFY_FAILED}`, { detail: verification.errors });
    await logPipelineEvent(supabase, {
      run_id: runId,
      source_id: source.id,
      status: "skipped",
      pipeline_stage: "source_verify",
      message: SKIP_REASONS.SOURCE_VERIFY_FAILED,
      error_details: { errors: verification.errors, url: rssItem.link },
      item_title: rssItem.title,
      item_external_key: externalKey,
    });
    return { action: "failed", reason: SKIP_REASONS.SOURCE_VERIFY_FAILED, externalKey };
  }
  logger.log("validate", "Source validated successfully");

  logger.log("classify", "Detecting content category...");
  const contentType = detectContentType(rssItem.title, rssItem.description);

  logger.log("ai", "AI Started...");
  const analysis = await aiAnalyzeContent({
    title: rssItem.title,
    description: rssItem.description,
    sourceName: source.name,
  });
  logger.log("ai", "AI Finished", { detail: { category: analysis.category } });

  logger.log("slug", "Generating unique slug...");
  const slug = await ensureUniqueSlug(supabase, rssItem.title);

  logger.log("seo", "Generating SEO metadata...");
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
    source_verified: true,
    pipeline_stage: "ready_for_review",
    seo_title: seoTitle,
    seo_description: seoDescription,
    structured_data: structuredData,
    ai_analysis: analysis,
  };

  record.quality_score = calculateQualityScore(record);

  const autoPublish = shouldAutoPublish(record, source);
  if (autoPublish) {
    record.status = "published";
    record.verification_status = "verified";
    record.pipeline_stage = "published";
    record.published_at = new Date().toISOString();
    logger.log("publish", "Auto-publish approved (quality + trust threshold met)");
  } else {
    record.verification_status = "needs_review";
    record.status = "needs_review";
    logger.log("publish", `Held for review — ${SKIP_REASONS.LOW_QUALITY} or trust below ${MIN_AUTO_PUBLISH_TRUST}`, {
      detail: { quality: record.quality_score, trust: source.trust_level },
    });
  }

  logger.log("save", "Saving to Supabase...");
  const { data: inserted, error: insertError } = await supabase
    .from("auto_imported_content")
    .insert(record)
    .select("id, slug, status")
    .single();

  if (insertError) {
    logger.error("save", `Save failed: ${insertError.message}`);
    throw insertError;
  }

  logger.log("save", `Saved Successfully (id: ${inserted.id})`);
  if (autoPublish) {
    logger.log("publish", `Published — visible at /updates/auto/${inserted.slug}`);
  }

  await logPipelineEvent(supabase, {
    run_id: runId,
    source_id: source.id,
    status: autoPublish ? "published" : "success",
    pipeline_stage: autoPublish ? "published" : "save",
    message: autoPublish ? "تم النشر التلقائي" : "تم الاستيراد — بانتظار المراجعة",
    imported_count: 1,
    item_title: rssItem.title,
    item_external_key: externalKey,
  });

  return {
    action: autoPublish ? "published" : "imported",
    externalKey,
    slug: inserted.slug,
    id: inserted.id,
    bytes: JSON.stringify(record).length,
  };
}

export async function runAutoContentSync({ triggerType = "cron" } = {}) {
  const logger = createPipelineLogger();
  logger.log("start", "Cron Started");

  const envStatus = {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
    CRON_SECRET: Boolean(process.env.CRON_SECRET),
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
  };
  logger.log("env", "Loaded Environment", { detail: envStatus });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    logger.error("env", "Supabase not configured — missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return {
      ok: false,
      error: "Supabase not configured",
      reason: SKIP_REASONS.AUTH_FAILED,
      env: envStatus,
      ...logger.summary(),
      imported: 0,
      published: 0,
      skipped: 0,
      failed: 0,
    };
  }

  logger.log("database", "Database connection established");

  let runId = null;
  try {
    const { data: runRow } = await supabase
      .from("auto_import_runs")
      .insert({ trigger_type: triggerType, status: "running" })
      .select("id")
      .single();
    runId = runRow?.id || null;
    logger.runId = runId;
  } catch (err) {
    logger.warn("database", `Run tracking unavailable: ${err.message}`);
  }

  try {
    await ensureTrustedSources(supabase, logger);
  } catch (err) {
    logger.error("sources", err.message);
    return { ok: false, error: err.message, ...logger.summary(), imported: 0, published: 0, skipped: 0, failed: 0 };
  }

  const { data: sources, error: sourcesError } = await supabase
    .from("trusted_sources")
    .select("*")
    .eq("is_active", true);

  if (sourcesError) {
    logger.error("sources", sourcesError.message);
    return { ok: false, error: sourcesError.message, ...logger.summary(), imported: 0, published: 0, skipped: 0, failed: 0, runId };
  }

  if (!sources || sources.length === 0) {
    logger.error("sources", SKIP_REASONS.NO_SOURCES);
    return {
      ok: false,
      error: SKIP_REASONS.NO_SOURCES,
      reason: SKIP_REASONS.NO_SOURCES,
      ...logger.summary(),
      imported: 0,
      published: 0,
      skipped: 0,
      failed: 0,
      sourcesTotal: 0,
      runId,
    };
  }

  logger.log("sources", `Loaded ${sources.length} active trusted sources`);

  let totalImported = 0;
  let totalPublished = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalUpdated = 0;
  let totalBytes = 0;
  let sourcesOk = 0;
  let sourcesFailed = 0;
  const skipReasons = {};
  const sourceResults = [];

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const officialSite = OFFICIAL_TRUSTED_SOURCES.find((s) => s.url === source.url)?.official_site;
    source.official_site = officialSite || source.url;

    let imported = 0;
    let published = 0;
    let skipped = 0;
    let failed = 0;
    let bytes = 0;
    const sourceStarted = Date.now();

    logger.log("source", `Checking Source #${i + 1}: ${source.name}`);

    try {
      const xml = await fetchWithRetry(source.url, logger, source.name);

      logger.log("parse", "Parsing RSS feed...");
      const rssItems = extractRssItems(xml);

      if (rssItems.length === 0) {
        const reason = classifyFeedFailure(null, xml);
        logger.warn("parse", `${reason} — no items in feed`, { detail: { url: source.url } });
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
        sourcesFailed++;
        await logPipelineEvent(supabase, {
          run_id: runId,
          source_id: source.id,
          status: "failed",
          message: reason,
          error_details: { url: source.url, xmlLength: xml.length },
        });
        sourceResults.push({ name: source.name, ok: false, reason, items: 0 });
        continue;
      }

      logger.log("parse", `Parsed ${rssItems.length} items from feed`);

      for (const rssItem of rssItems) {
        try {
          const result = await processRssItem(supabase, source, rssItem, runId, logger);
          if (result.action === "published") {
            published++;
            imported++;
            bytes += result.bytes || 0;
          } else if (result.action === "imported") {
            imported++;
            bytes += result.bytes || 0;
          } else if (result.action === "skipped") {
            skipped++;
            skipReasons[result.reason || SKIP_REASONS.DUPLICATE] =
              (skipReasons[result.reason || SKIP_REASONS.DUPLICATE] || 0) + 1;
          } else if (result.action === "failed") {
            failed++;
            skipReasons[result.reason || "Unknown"] = (skipReasons[result.reason || "Unknown"] || 0) + 1;
          }
        } catch (itemError) {
          failed++;
          logger.error("save", `Item failed: ${itemError.message}`, { detail: { title: rssItem.title } });
          await logPipelineEvent(supabase, {
            run_id: runId,
            source_id: source.id,
            status: "failed",
            pipeline_stage: "save",
            message: itemError.message,
            error_details: { title: rssItem.title },
            failed_count: 1,
            item_title: rssItem.title,
          });
        }
      }

      if (imported === 0 && skipped > 0 && failed === 0) {
        logger.log("finish", `${SKIP_REASONS.NO_NEW_ARTICLES} for ${source.name} (${skipped} duplicates)`);
      }

      await supabase
        .from("trusted_sources")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", source.id);

      await logPipelineEvent(supabase, {
        run_id: runId,
        source_id: source.id,
        status: failed > 0 && imported === 0 ? "partial" : "success",
        message: `imported=${imported} published=${published} skipped=${skipped} failed=${failed}`,
        imported_count: imported,
        skipped_count: skipped,
        failed_count: failed,
        duration_ms: Date.now() - sourceStarted,
      });

      sourcesOk++;
      sourceResults.push({ name: source.name, ok: true, imported, published, skipped, failed, items: rssItems.length });
    } catch (error) {
      sourcesFailed++;
      failed++;
      const reason = error.message || SKIP_REASONS.FETCH_FAILED;
      skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      logger.error("source", `Source Failed: ${source.name} — ${reason}`);

      await logPipelineEvent(supabase, {
        run_id: runId,
        source_id: source.id,
        status: "failed",
        message: reason,
        error_details: { source: source.name, url: source.url },
        failed_count: 1,
        duration_ms: Date.now() - sourceStarted,
      });
      sourceResults.push({ name: source.name, ok: false, reason, items: 0 });
    }

    totalImported += imported;
    totalPublished += published;
    totalSkipped += skipped;
    totalFailed += failed;
    totalBytes += bytes;
  }

  const durationMs = logger.elapsed();
  const totalAttempts = totalImported + totalSkipped + totalFailed;
  const successRate = totalAttempts > 0
    ? Math.round(((totalImported + totalSkipped) / totalAttempts) * 100)
    : sourcesOk > 0 ? 100 : 0;

  if (totalImported === 0 && totalPublished === 0) {
    const primaryReason = Object.keys(skipReasons)[0] || SKIP_REASONS.NO_NEW_ARTICLES;
    logger.warn("finish", `No new content — primary reason: ${primaryReason}`, { detail: skipReasons });
  } else {
    logger.log("finish", "Finished Successfully", {
      detail: { imported: totalImported, published: totalPublished, skipped: totalSkipped, failed: totalFailed },
    });
  }

  const summary = {
    ok: sourcesOk > 0 || totalImported > 0,
    runId,
    imported: totalImported,
    published: totalPublished,
    updated: totalUpdated,
    skipped: totalSkipped,
    failed: totalFailed,
    duplicates: skipReasons[SKIP_REASONS.DUPLICATE] || totalSkipped,
    rejected: totalFailed,
    sourcesTotal: sources.length,
    sourcesOk,
    sourcesFailed,
    durationMs,
    dataBytes: totalBytes,
    successRate,
    skipReasons,
    sourceResults,
    env: envStatus,
    ...logger.summary(),
  };

  if (runId) {
    await supabase.from("auto_import_runs").update({
      status: sourcesFailed > 0 && sourcesOk === 0 ? "failed" : "completed",
      sources_total: sources.length,
      sources_ok: sourcesOk,
      sources_failed: sourcesFailed,
      imported_count: totalImported,
      skipped_count: totalSkipped,
      failed_count: totalFailed,
      duration_ms: durationMs,
      finished_at: new Date().toISOString(),
      error_summary: totalImported === 0 ? JSON.stringify(skipReasons) : null,
    }).eq("id", runId);
  }

  return summary;
}

export async function getAutoContentHealth() {
  const logger = createPipelineLogger();
  const supabase = getSupabaseAdmin();

  const env = {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
    CRON_SECRET: Boolean(process.env.CRON_SECRET),
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
  };

  const health = {
    ok: true,
    at: new Date().toISOString(),
    cron: { route: "/api/cron/auto-content-sync", vercelSchedule: "0 */6 * * *", status: env.CRON_SECRET ? "configured" : "missing_secret" },
    env,
    database: { status: "unknown" },
    ai: { openai: env.OPENAI_API_KEY ? "configured" : "missing", anthropic: env.ANTHROPIC_API_KEY ? "configured" : "unused_by_pipeline" },
    queue: { status: "inline", pending: 0 },
    cache: { status: "none" },
    workers: { status: "serverless" },
    sources: { total: 0, active: 0, healthy: 0 },
  };

  if (!supabase) {
    health.ok = false;
    health.database.status = "not_configured";
    return health;
  }

  try {
    const { count, error } = await supabase.from("trusted_sources").select("id", { count: "exact", head: true });
    health.database.status = error ? "error" : "connected";
    health.database.error = error?.message;
    health.sources.total = count ?? 0;

    const { data: activeSources } = await supabase.from("trusted_sources").select("id, name, is_active, last_synced_at").eq("is_active", true);
    health.sources.active = activeSources?.length ?? 0;

    const { data: lastRun } = await supabase.from("auto_import_runs").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle();
    health.cron.lastRun = lastRun || null;

    const { count: publishedCount } = await supabase
      .from("auto_imported_content")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    health.content = { published: publishedCount ?? 0 };

    const { count: pendingCount } = await supabase
      .from("auto_imported_content")
      .select("id", { count: "exact", head: true })
      .eq("status", "needs_review");
    health.content.pending = pendingCount ?? 0;
  } catch (err) {
    health.ok = false;
    health.database.status = "error";
    health.database.error = err.message;
  }

  return health;
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
