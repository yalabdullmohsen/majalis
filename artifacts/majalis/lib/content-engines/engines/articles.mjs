/**
 * Article Engine — RSS/websites via AKE (one connector per cron tick).
 * Auto-content sync has its own dedicated cron (/api/cron/auto-content-sync).
 */
import { runAutoKnowledgeEngine } from "../../auto-knowledge-sync.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { startEngineRun, finishEngineRun, createRunLogger } from "../run-manager.mjs";
import { CRON_BUDGET_MS, cronMaxItems, isCronRun, budgetExceeded } from "../budget.mjs";
import { getEngineCursor, saveEngineCursor } from "../work-queue.mjs";

const ENGINE_ID = "articles";
const RSS_SLUGS = [
  "islamweb-news",
  "alukah-articles",
  "iifa-oic",
  "kuwait-lessons",
  "kfas-sharia",
  "web-drhayaalsabah",
  "web-othmanalkamees",
  "web-awqaf-kw",
];

export async function run({ runType = "incremental", maxItems = 20, budgetMs = CRON_BUDGET_MS, connectorSlug } = {}) {
  const admin = getSupabaseAdmin();
  const { runId, startedAt } = await startEngineRun(ENGINE_ID, runType);
  const log = createRunLogger(runId, ENGINE_ID);
  const stats = {
    items_fetched: 0,
    items_parsed: 0,
    items_enriched: 0,
    items_duplicate: 0,
    items_rejected: 0,
    items_review: 0,
    items_published: 0,
    items_indexed: 0,
    errors: 0,
  };

  try {
    const perConnector = cronMaxItems(runType, maxItems, 4);
    let slug = connectorSlug;

    if (isCronRun(runType) && admin && !slug) {
      const cursor = await getEngineCursor(admin, ENGINE_ID, "connectorCursor");
      slug = RSS_SLUGS[cursor % RSS_SLUGS.length];
    }

    await log("fetch", "info", `AKE articles connector: ${slug || "due-batch"}`, {
      metadata: { slug, perConnector, runType },
    });

    if (budgetExceeded(startedAt, budgetMs)) {
      await finishEngineRun(runId, ENGINE_ID, stats, startedAt, {
        report: { skipped: "budget_precheck" },
      });
      return { ok: true, engineId: ENGINE_ID, runId, stats, resumed: true };
    }

    const akeResult = await runAutoKnowledgeEngine({
      triggerType: runType === "manual" ? "manual" : "cron",
      importMode: runType === "backfill" ? "backfill" : "incremental",
      maxItemsPerConnector: perConnector,
      maxConnectors: slug ? 1 : isCronRun(runType) ? 2 : 6,
      connectorSlug: slug || undefined,
      engineOnly: true,
      continuous: false,
    });

    const summary = akeResult.autoKnowledgeEngine || akeResult;
    const connectorResults = summary.connectorResults || [];
    for (const cr of connectorResults) {
      stats.items_fetched += cr.fetched || cr.rawFetched || 0;
      stats.items_parsed += cr.parsed || cr.processed || 0;
      stats.items_published += cr.published || 0;
      stats.items_review += cr.review || 0;
      stats.items_duplicate += cr.duplicate || 0;
      stats.items_rejected += cr.rejected || 0;
    }
    stats.items_enriched = stats.items_parsed;
    if (summary.errors?.length) stats.errors += summary.errors.length;

    if (isCronRun(runType) && admin && slug) {
      const cursor = await getEngineCursor(admin, ENGINE_ID, "connectorCursor");
      await saveEngineCursor(admin, ENGINE_ID, (cursor + 1) % RSS_SLUGS.length, "connectorCursor");
    }

    if (stats.items_fetched === 0 && stats.items_published === 0) {
      await log("outcome", "info", "no_content", { metadata: { outcome: "no_content", connector: slug } });
    }

    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, {
      report: {
        connector: slug,
        outcome: stats.items_published ? "published" : stats.items_fetched ? "processed" : "no_content",
        ake: { connectors: connectorResults.length, published: stats.items_published },
      },
    });
    return {
      ok: true,
      engineId: ENGINE_ID,
      runId,
      stats,
      connector: slug,
      outcome: stats.items_published ? "published" : stats.items_fetched ? "processed" : "no_content",
      resumed: isCronRun(runType),
    };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
