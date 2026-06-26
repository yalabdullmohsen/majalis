import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSupabaseAdmin, isMissingTableError } from '../supabase-admin.mjs';
import { runReviewGate } from './review-gate.mjs';
import { countSeedItemsByType } from './seed-scanner.mjs';
import { persistVerificationResult, upsertProvenance } from './storage.mjs';
import { buildProvenanceRow } from './provenance.mjs';
import { suggestMetadataWithAi, detectConflicts } from './ai-suggest.mjs';
import { VERIFICATION_STATUS } from './utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, '../../data/scholarly-verification-report.json');

function log(scope, data) {
  console.info(`[scholarly-verification:${scope}]`, JSON.stringify({ at: new Date().toISOString(), ...data }));
}

export async function verifyContentItem(contentType, contentId, item, context = {}) {
  const seenHashes = context.seenHashes ?? new Set();
  const gateResult = await runReviewGate(item, {
    seenHashes,
    checkLinks: context.checkLinks ?? false,
    defaults: context.defaults,
  });

  let aiSuggestions = null;
  if (context.useAi) {
    const ai = await suggestMetadataWithAi(item, { content_type: contentType });
    if (ai.ok) aiSuggestions = ai.suggestions;
    const conflicts = detectConflicts(item, context.existingItems ?? []);
    if (conflicts.length) {
      gateResult.warnings.push({
        code: 'ai_conflict',
        message: `تعارض محتمل: ${conflicts.length}`,
        severity: 'warning',
      });
    }
  }

  if (context.persist && gateResult.can_publish) {
    await persistVerificationResult(contentType, contentId, item, gateResult, context);
  }

  return { ...gateResult, ai_suggestions: aiSuggestions, content_type: contentType, content_id: contentId };
}

export async function runScholarlyVerificationScan(options = {}) {
  const startedAt = new Date().toISOString();
  const checkLinks = options.checkLinks ?? false;
  const useAi = options.useAi ?? false;
  const persist = options.persist ?? false;

  const { corpus, by_type, total } = countSeedItemsByType();
  const seenHashes = new Set();
  const sectionStats = {};
  const results = [];
  let verified = 0;
  let needsReview = 0;
  let rejected = 0;
  let duplicates = 0;
  let brokenLinks = 0;

  for (const row of corpus) {
    const result = await verifyContentItem(row.content_type, row.content_id, row.item, {
      seenHashes,
      checkLinks,
      useAi,
      persist,
      change_source: options.trigger ?? 'cron',
    });

    if (!sectionStats[row.content_type]) {
      sectionStats[row.content_type] = { total: 0, verified: 0, needs_review: 0, rejected: 0, duplicate: 0 };
    }
    const sec = sectionStats[row.content_type];
    sec.total += 1;

    if (result.verification_status === VERIFICATION_STATUS.VERIFIED) {
      verified += 1;
      sec.verified += 1;
    } else if (result.verification_status === VERIFICATION_STATUS.DUPLICATE) {
      duplicates += 1;
      sec.duplicate += 1;
    } else if (result.verification_status === VERIFICATION_STATUS.REJECTED) {
      rejected += 1;
      sec.rejected += 1;
    } else {
      needsReview += 1;
      sec.needs_review += 1;
    }

    const linkCheck = result.checks?.find((c) => c.name === 'source_link');
    if (linkCheck && !linkCheck.passed) brokenLinks += 1;

    results.push({
      content_type: row.content_type,
      content_id: row.content_id,
      title: row.item.title ?? row.item.text?.slice?.(0, 60),
      verification_status: result.verification_status,
      quality_score: result.quality_score,
      completeness_score: result.completeness_score,
      can_publish: result.can_publish,
      errors: result.errors.map((e) => e.message ?? e.code),
    });
  }

  const admin = getSupabaseAdmin();
  let dbStats = null;
  if (admin) {
    dbStats = await scanSupabaseTables(admin, { checkLinks, persist });
  }

  const finishedAt = new Date().toISOString();
  const documentationCompleteness = total > 0 ? Math.round((verified / total) * 100) : 0;

  const report = {
    generated_at: finishedAt,
    started_at: startedAt,
    items_scanned: total + (dbStats?.scanned ?? 0),
    seed_items: total,
    verified_count: verified + (dbStats?.verified ?? 0),
    needs_review_count: needsReview + (dbStats?.needs_review ?? 0),
    rejected_count: rejected + (dbStats?.rejected ?? 0),
    duplicate_count: duplicates + (dbStats?.duplicates ?? 0),
    broken_links_count: brokenLinks + (dbStats?.broken_links ?? 0),
    documentation_completeness_percent: documentationCompleteness,
    section_stats: mergeSectionStats(sectionStats, dbStats?.section_stats ?? {}),
    readiness_score: computeReadinessScore(documentationCompleteness, verified, total),
    sample_failures: results.filter((r) => !r.can_publish).slice(0, 20),
    next_priorities: buildNextPriorities(sectionStats, documentationCompleteness),
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  if (admin && persist) {
    await admin.from('scholarly_verification_runs').insert({
      trigger_type: options.trigger ?? 'cron',
      started_at: startedAt,
      finished_at: finishedAt,
      status: 'completed',
      items_scanned: report.items_scanned,
      items_verified: report.verified_count,
      items_needs_review: report.needs_review_count,
      links_checked: checkLinks ? report.items_scanned : 0,
      links_broken: report.broken_links_count,
      duplicates_found: report.duplicate_count,
      summary: report,
    });
  }

  log('complete', { verified, needsReview, rejected, duplicates });
  return { ok: true, report };
}

async function scanSupabaseTables(admin, options) {
  const tables = [
    { type: 'fawaid', table: 'fawaid', map: (r) => ({ ...r, title: r.text?.slice(0, 80), content: r.text }) },
    { type: 'lesson', table: 'lessons', map: (r) => ({ ...r, content: r.description }) },
    { type: 'library_item', table: 'library_items', map: (r) => ({ ...r, content: r.description }) },
    { type: 'qa_question', table: 'qa_questions', map: (r) => ({ ...r, title: r.question, content: r.answer }) },
    { type: 'fatwa', table: 'fatwas', map: (r) => ({ ...r, content: r.answer }) },
  ];

  let scanned = 0;
  let verified = 0;
  let needs_review = 0;
  let rejected = 0;
  let duplicates = 0;
  let broken_links = 0;
  const section_stats = {};
  const seenHashes = new Set();

  for (const { type, table, map } of tables) {
    const { data, error } = await admin.from(table).select('*').limit(200);
    if (error) {
      if (isMissingTableError(error)) continue;
      continue;
    }
    for (const row of data ?? []) {
      const item = map(row);
      scanned += 1;
      const result = await runReviewGate(item, { seenHashes, checkLinks: options.checkLinks });
      if (!section_stats[type]) section_stats[type] = { total: 0, verified: 0, needs_review: 0, rejected: 0, duplicate: 0 };
      section_stats[type].total += 1;
      if (result.verification_status === "verified") {
        verified += 1;
        section_stats[type].verified += 1;
      } else if (result.verification_status === "duplicate") {
        duplicates += 1;
        section_stats[type].duplicate += 1;
      } else if (result.verification_status === "rejected") {
        rejected += 1;
        section_stats[type].rejected += 1;
      } else {
        needs_review += 1;
        section_stats[type].needs_review += 1;
      }
      const linkCheck = result.checks?.find((c) => c.name === 'source_link');
      if (linkCheck && !linkCheck.passed) broken_links += 1;
      if (options.persist) {
        const provRow = buildProvenanceRow(type, row.id, item);
        provRow.verification_status = result.verification_status;
        provRow.quality_score = result.quality_score;
        provRow.completeness_score = result.completeness_score;
        await upsertProvenance(provRow);
      }
    }
  }

  return { scanned, verified, needs_review, rejected, duplicates, broken_links, section_stats };
}

function mergeSectionStats(a, b) {
  const merged = { ...a };
  for (const [key, val] of Object.entries(b)) {
    if (!merged[key]) merged[key] = val;
    else {
      for (const k of ['total', 'verified', 'needs_review', 'rejected', 'duplicate']) {
        merged[key][k] = (merged[key][k] ?? 0) + (val[k] ?? 0);
      }
    }
  }
  return merged;
}

function computeReadinessScore(docPct, verified, total) {
  const coverage = total > 0 ? (verified / total) * 100 : 0;
  return Math.round(docPct * 0.5 + coverage * 0.5);
}

function buildNextPriorities(sectionStats, docPct) {
  const priorities = [];
  if (docPct < 80) priorities.push('إكمال source_url و source_name لكل عنصر seed');
  for (const [type, stats] of Object.entries(sectionStats)) {
    if (stats.rejected > 0) priorities.push(`معالجة ${stats.rejected} عنصر مرفوض في ${type}`);
    if (stats.needs_review > stats.verified) priorities.push(`مراجعة ${stats.needs_review} عنصر في ${type}`);
  }
  priorities.push('تنفيذ supabase/scholarly_verification_v1.sql في الإنتاج');
  priorities.push('تفعيل فحص الروابط الدوري عبر cron');
  return priorities.slice(0, 8);
}

export async function getScholarlyDashboard() {
  const admin = getSupabaseAdmin();
  let latestRun = null;
  let provenanceStats = null;

  if (admin) {
    const { data: run } = await admin
      .from('scholarly_verification_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    latestRun = run;

    const { data: rows } = await admin.from('content_provenance').select('verification_status, content_type');
    if (rows) {
      provenanceStats = rows.reduce(
        (acc, row) => {
          acc.total += 1;
          acc[row.verification_status] = (acc[row.verification_status] ?? 0) + 1;
          acc.by_type[row.content_type] = (acc.by_type[row.content_type] ?? 0) + 1;
          return acc;
        },
        { total: 0, by_type: {} },
      );
    }
  }

  let localReport = null;
  try {
    localReport = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  } catch {
    /* optional */
  }

  if (!localReport) {
    const scan = await runScholarlyVerificationScan({ checkLinks: false, persist: false });
    localReport = scan.report;
  }

  return {
    ok: true,
    latest_run: latestRun,
    provenance_stats: provenanceStats,
    report: localReport,
  };
}

export async function searchScholarlyContent(filters = {}) {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.rpc('search_scholarly_content', {
      p_query: filters.query ?? null,
      p_source_name: filters.source_name ?? null,
      p_author: filters.author ?? null,
      p_content_type: filters.content_type ?? null,
      p_verification_status: filters.verification_status ?? null,
      p_language: filters.language ?? null,
      p_date_from: filters.date_from ?? null,
      p_date_to: filters.date_to ?? null,
      p_limit: filters.limit ?? 30,
    });
    if (!error && data) return { ok: true, results: data, source: 'supabase' };
  }

  const { corpus } = countSeedItemsByType();
  let results = corpus.map((row) => ({
    content_type: row.content_type,
    content_id: row.content_id,
    title: row.item.title ?? row.item.text?.slice(0, 80),
    source_name: row.item.source_name,
    source_url: row.item.source_url,
    verification_status: row.item.verification_status ?? 'needs_review',
    trust_level: row.item.trust_level ?? 50,
  }));

  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.source_name?.toLowerCase().includes(q) ||
        r.source_url?.toLowerCase().includes(q),
    );
  }
  if (filters.content_type) results = results.filter((r) => r.content_type === filters.content_type);
  if (filters.verification_status) {
    results = results.filter((r) => r.verification_status === filters.verification_status);
  }
  if (filters.source_name) {
    results = results.filter((r) => r.source_name?.includes(filters.source_name));
  }

  return { ok: true, results: results.slice(0, filters.limit ?? 30), source: 'seed' };
}

export { countSeedItemsByType };
