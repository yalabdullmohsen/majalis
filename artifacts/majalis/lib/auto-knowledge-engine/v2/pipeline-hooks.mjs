/**
 * AKE v2 — Post-processing hooks integrated into the main pipeline.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { checkUnifiedDuplicate, registerUnifiedFingerprint, mergeSourceAttribution } from "./unified-dedup.mjs";
import { linkEntitiesForItem } from "./entity-linker.mjs";
import { detectLifecycleChange, applyLifecycleChange, recordContentCreated } from "./content-lifecycle.mjs";
import { extractStructuredFields } from "./extraction-service.mjs";
import { loadV2Settings } from "./parallel-runner.mjs";
import { cacheClear } from "../cache.mjs";

export async function ensureV2Schema(admin) {
  if (!admin) return { ok: false };
  try {
    const { error } = await admin.from("ake_v2_settings").select("id", { head: true, count: "exact" });
    if (!error) return { ok: true, skipped: true };
    const { applyMigrations } = await import("../../db-migrate.mjs");
    return await applyMigrations({
      files: ["auto_knowledge_engine_v16_v2.sql", "auto_knowledge_engine_v16_v2_production.sql"],
      continueOnError: false,
      trackApplied: true,
    });
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function preprocessItemV2(item, connectorConfig, existingItems) {
  const admin = getSupabaseAdmin();
  const settings = await loadV2Settings(admin);

  if (!settings.enable_unified_dedup) {
    return { item, skip: false };
  }

  const extraction = await extractStructuredFields(item, connectorConfig);
  item.extracted_fields = extraction.extracted_fields;
  item.analysis = item.analysis || extraction.analysis;

  const dup = await checkUnifiedDuplicate(item, connectorConfig);
  if (dup.isDuplicate && dup.action === "skip_lower_priority") {
    return { item, skip: true, reason: "lower_priority_duplicate", dup };
  }

  if (dup.isDuplicate && dup.action === "merge_source") {
    item._mergeInto = dup.knowledgeItemId;
    item._unifiedFingerprint = dup.fingerprint;
  } else {
    item._unifiedFingerprint = dup.fingerprint;
  }

  const existing = existingItems?.find((e) => e.external_id === item.external_id);
  if (existing && settings.enable_lifecycle_updates) {
    const change = detectLifecycleChange(existing, item, extraction);
    if (change) item._lifecycleChange = change;
  }

  return { item, skip: false, extraction };
}

export async function postPublishV2({
  inserted,
  item,
  connectorConfig,
  published,
  pub,
}) {
  const admin = getSupabaseAdmin();
  if (!admin || !inserted?.id) return;

  const settings = await loadV2Settings(admin);

  const lessonId = pub?.target_table === "lessons" ? pub.target_record_id : null;

  if (item._unifiedFingerprint) {
    await registerUnifiedFingerprint({
      fingerprint: item._unifiedFingerprint,
      item,
      connectorConfig,
      knowledgeItemId: inserted.id,
      lessonId,
    });

    const { data: fp } = await admin
      .from("ake_unified_fingerprints")
      .select("sources")
      .eq("fingerprint", item._unifiedFingerprint)
      .maybeSingle();
    if (fp?.sources) await mergeSourceAttribution(admin, inserted.id, fp.sources);
  }

  if (settings.enable_entity_linking) {
    await linkEntitiesForItem(admin, {
      knowledgeItemId: inserted.id,
      extractedFields: item.extracted_fields || inserted.extracted_fields,
      analysis: item.analysis,
    });
  }

  if (item.extracted_fields) {
    await admin.from("knowledge_items").update({
      extracted_fields: item.extracted_fields,
      unified_fingerprint: item._unifiedFingerprint || null,
    }).eq("id", inserted.id);
  }

  if (item._lifecycleChange) {
    await applyLifecycleChange(admin, {
      knowledgeItemId: inserted.id,
      lessonId,
      change: item._lifecycleChange,
      sourceSlug: connectorConfig.slug,
      sourceUrl: item.raw_url,
    });
  } else if (published) {
    await recordContentCreated(admin, {
      knowledgeItemId: inserted.id,
      sourceSlug: connectorConfig.slug,
      sourceUrl: item.raw_url,
    });
  }

  if (published) {
    cacheClear("ake:");
    cacheClear("seo:");
  }
}

export async function getAkeV2DashboardStats() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false };

  try {
    const { data, error } = await admin.rpc("ake_v2_dashboard_stats");
    if (!error && data) return { ok: true, ...data };
  } catch {
    /* fallback */
  }

  const { count: total } = await admin.from("ake_connectors").select("*", { count: "exact", head: true });
  const { count: active } = await admin.from("ake_connectors").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: ig } = await admin.from("ake_connectors").select("*", { count: "exact", head: true }).eq("platform", "instagram").eq("is_active", true);

  return {
    ok: true,
    connectors_total: total || 0,
    connectors_active: active || 0,
    instagram_accounts: ig || 0,
  };
}

export async function runAkeV2Cycle(options = {}) {
  await bootstrapV2();
  const { runContinuousAkeCycle } = await import("../continuous-cycle.mjs");
  return runContinuousAkeCycle({ ...options, v2: true });
}

async function bootstrapV2() {
  const { bootstrapConnectorPlugins } = await import("./plugin-registry.mjs");
  await bootstrapConnectorPlugins();
}
