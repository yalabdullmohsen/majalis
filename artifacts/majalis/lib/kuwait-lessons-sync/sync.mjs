import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listActiveSources, listAllSources, summarizeRegistry } from './sources-registry.mjs';
import {
  fetchSource,
  normalizeFetchedItems,
  dedupeDrafts,
  diffDraft,
} from './connectors.mjs';
import { validateLessonDraft, canPublish } from './validate.mjs';
import { enrichDraftWithAi } from './ai-extract.mjs';
import {
  loadExistingExternalKeys,
  loadExistingLessonsMap,
  upsertLesson,
  archiveExpiredLessons,
  recordSyncRun,
  upsertSourceHealth,
  getLatestSyncRun,
  getSourceHealth,
  getRecentSyncRuns,
} from './publish.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, '../../data/lesson-sync-report.json');

function log(scope, data) {
  console.info(`[kuwait-lessons-sync:${scope}]`, JSON.stringify({ at: new Date().toISOString(), ...data }));
}

export async function runKuwaitLessonsSync(options = {}) {
  const startedAt = new Date().toISOString();
  const useAi = options.useAi !== false;
  const dryRun = Boolean(options.dryRun);

  const stats = {
    fetched: 0,
    normalized: 0,
    new: 0,
    updated: 0,
    duplicates: 0,
    review: 0,
    errors: 0,
    ai_used: 0,
    archived: 0,
    published: 0,
  };

  const sourceResults = [];
  const errors = [];
  const existingKeys = await loadExistingExternalKeys();
  const existingMap = await loadExistingLessonsMap();

  for (const source of listActiveSources()) {
    const sourceStat = {
      source_id: source.id,
      source_name: source.name,
      source_type: source.type,
      status: 'ok',
      items_fetched: 0,
      items_published: 0,
      items_review: 0,
      last_sync_at: new Date().toISOString(),
      last_success_at: null,
      last_error: null,
      meta: {},
    };

    try {
      const fetchResult = await fetchSource(source);
      sourceStat.meta = fetchResult.meta ?? {};

      if (!fetchResult.ok) {
        sourceStat.status = 'error';
        sourceStat.last_error = fetchResult.error ?? 'fetch_failed';
        stats.errors += 1;
        errors.push({ source_id: source.id, stage: 'fetch', error: sourceStat.last_error });
        sourceResults.push(sourceStat);
        continue;
      }

      if (fetchResult.skipped) {
        sourceStat.status = 'skipped';
        sourceStat.meta.reason = fetchResult.reason;
        sourceResults.push(sourceStat);
        continue;
      }

      const rawItems = fetchResult.items ?? [];
      sourceStat.items_fetched = rawItems.length;
      stats.fetched += rawItems.length;

      let drafts = normalizeFetchedItems(source, rawItems);
      stats.normalized += drafts.length;

      const enrichedDrafts = [];
      for (const draft of drafts) {
        if (useAi) {
          const { draft: enriched, ai_used: aiUsed } = await enrichDraftWithAi(draft);
          if (aiUsed) stats.ai_used += 1;
          enrichedDrafts.push(enriched);
        } else {
          enrichedDrafts.push(draft);
        }
      }

      const { unique, duplicates } = dedupeDrafts(enrichedDrafts, existingKeys);
      stats.duplicates += duplicates.length;

      for (const draft of unique) {
        const validation = validateLessonDraft(draft);
        if (!validation.valid) {
          stats.review += 1;
          sourceStat.items_review += 1;
          errors.push({
            source_id: source.id,
            external_key: draft.external_key,
            stage: 'validation',
            errors: validation.errors,
          });
          continue;
        }

        if (!canPublish(draft, validation)) {
          stats.review += 1;
          sourceStat.items_review += 1;
          continue;
        }

        if (!source.auto_publish) {
          stats.review += 1;
          sourceStat.items_review += 1;
          continue;
        }

        if (dryRun) {
          stats.published += 1;
          sourceStat.items_published += 1;
          continue;
        }

        const existing = existingMap.get(draft.external_key);
        const outcome = await upsertLesson(draft);
        if (!outcome.ok) {
          stats.errors += 1;
          sourceStat.status = 'error';
          sourceStat.last_error = outcome.error;
          errors.push({
            source_id: source.id,
            external_key: draft.external_key,
            stage: 'publish',
            error: outcome.error,
          });
          continue;
        }

        existingKeys.add(draft.external_key);
        stats.published += 1;
        sourceStat.items_published += 1;
        sourceStat.last_success_at = new Date().toISOString();

        if (existing) {
          const changes = diffDraft(existing, draft);
          if (changes.length > 0) stats.updated += 1;
        } else {
          stats.new += 1;
        }
      }

      sourceResults.push(sourceStat);
    } catch (error) {
      sourceStat.status = 'error';
      sourceStat.last_error = error instanceof Error ? error.message : String(error);
      stats.errors += 1;
      errors.push({ source_id: source.id, stage: 'source', error: sourceStat.last_error });
      sourceResults.push(sourceStat);
    }
  }

  let archiveResult = { ok: true, archived: 0 };
  if (!dryRun) {
    archiveResult = await archiveExpiredLessons();
    stats.archived = archiveResult.archived ?? 0;
  }

  const finishedAt = new Date().toISOString();
  const status = stats.errors > 0 ? 'completed_with_errors' : 'completed';

  const run = {
    started_at: startedAt,
    finished_at: finishedAt,
    status,
    stats,
    sources: sourceResults,
    errors,
    summary: buildSummary(stats),
  };

  if (!dryRun) {
    await upsertSourceHealth(sourceResults);
    await recordSyncRun(run);
  }

  writeLocalReport(run);

  log('complete', { status, stats });
  return { ok: stats.errors === 0, ...run };
}

function buildSummary(stats) {
  return {
    fetched: stats.fetched,
    new: stats.new,
    updated: stats.updated,
    duplicates: stats.duplicates,
    review: stats.review,
    errors: stats.errors,
    archived: stats.archived,
    ai_used: stats.ai_used,
  };
}

function writeLocalReport(run) {
  const registry = summarizeRegistry();
  const automationPct = computeAutomationRate(registry, run.stats);

  const report = {
    generated_at: new Date().toISOString(),
    connected_sources: registry.connected,
    pending_integrations: registry.pending_integration,
    estimated_daily_import_capacity: registry.estimated_daily_capacity,
    automation_rate_percent: automationPct,
    last_sync: {
      started_at: run.started_at,
      finished_at: run.finished_at,
      status: run.status,
      stats: run.stats,
    },
    constraints: {
      legal: [
        'لا مراقبة Instagram/Telegram — فقط قنوات رسمية أو manifest موثق',
        'يتطلب source_url أو official_url لكل إعلان',
        'مصادر pending_official تنتظر RSS/API رسمي',
      ],
      technical: [
        'يتطلب SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY للنشر',
        'استخراج AI اختياري عبر OPENAI_API_KEY',
        'official_site يستخدم heuristics HTML — يُفضّل RSS/API عند التوفر',
      ],
    },
    policy: registry.policy,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
}

function computeAutomationRate(registry, stats) {
  const active = registry.active || 0;
  const pending = registry.pending || 0;
  const total = active + pending;
  if (total === 0) return 0;

  const sourceCoverage = (active / total) * 100;
  const publishRate =
    stats.fetched > 0 ? ((stats.new + stats.updated) / stats.fetched) * 100 : sourceCoverage;

  return Math.round(Math.min(100, (sourceCoverage * 0.6 + publishRate * 0.4)));
}

export async function getLessonSyncDashboard(limit = 10) {
  const registry = summarizeRegistry();
  const latest = await getLatestSyncRun();
  const sources = await getSourceHealth();
  const recent = await getRecentSyncRuns(limit);

  let localReport = null;
  try {
    localReport = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  } catch {
    /* optional */
  }

  return {
    ok: true,
    registry,
    latest_run: latest,
    source_health: sources,
    recent_runs: recent,
    report: localReport,
  };
}

export async function generateLessonSyncReport() {
  const registry = summarizeRegistry();
  const dashboard = await getLessonSyncDashboard();
  const allSources = listAllSources();

  const report = {
    generated_at: new Date().toISOString(),
    connected_sources: registry.connected,
    pending_integrations: registry.pending_integration,
    estimated_daily_import_capacity: registry.estimated_daily_capacity,
    automation_rate_percent: dashboard.report?.automation_rate_percent ?? computeAutomationRate(registry, dashboard.latest_run ?? {}),
    sources_detail: allSources.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      active: s.active,
      auto_publish: s.auto_publish,
      official_url: s.official_url,
      estimated_daily_items: s.estimated_daily_items,
      notes: s.notes,
    })),
    last_sync: dashboard.latest_run,
    constraints: dashboard.report?.constraints ?? {},
    policy: registry.policy,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  return report;
}

export { summarizeRegistry, listAllSources, listActiveSources };
