/**
 * Enterprise Governance — quality monitoring KPIs per section.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { QUALITY_KPIS } from "./config.mjs";
import { runScholarlyVerificationScan } from "../scholarly-verification/orchestrator.mjs";
import { getQualityStats } from "../global-reference/quality.mjs";
import { getSearchAnalytics } from "../scholarly-intelligence/analytics.mjs";

const CONTENT_TABLES = [
  { kind: "fawaid", table: "fawaid" },
  { kind: "lesson", table: "lessons" },
  { kind: "fatwa", table: "fatwas" },
  { kind: "library", table: "library_items" },
  { kind: "qa", table: "qa_questions" },
  { kind: "fiqh_decision", table: "fiqh_council_items" },
];

export async function getQualityMetrics(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();

  const metrics = {
    completeness_pct: 0,
    verification_pct: 0,
    needs_review_pct: 0,
    duplicate_count: 0,
    broken_links_count: 0,
    update_success_rate: 90,
    by_section: {},
    kpis: QUALITY_KPIS,
  };

  let totalItems = 0;
  let completeItems = 0;
  let verifiedItems = 0;
  let needsReview = 0;

  if (admin) {
    for (const { kind, table } of CONTENT_TABLES) {
      try {
        const { count } = await admin.from(table).select("*", { count: "exact", head: true });
        const sectionTotal = count || 0;
        totalItems += sectionTotal;

        metrics.by_section[kind] = {
          total: sectionTotal,
          completeness_pct: 0,
          needs_review: 0,
        };
      } catch {
        metrics.by_section[kind] = { total: 0, error: "table_unavailable" };
      }
    }

    try {
      const { count: refCount } = await admin.from("global_content_refs").select("*", { count: "exact", head: true });
      const { count: verifiedCount } = await admin
        .from("global_content_refs")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "verified");
      const { count: reviewCount } = await admin
        .from("global_content_refs")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "needs_review");

      if (refCount) {
        verifiedItems = verifiedCount || 0;
        needsReview = reviewCount || 0;
        totalItems = Math.max(totalItems, refCount);
      }
    } catch {
      /* refs optional */
    }
  }

  try {
    const scan = await runScholarlyVerificationScan({ checkLinks: false, useAi: false, persist: false, trigger: "quality_metrics" });
    if (scan.report) {
      metrics.duplicate_count = scan.report.duplicates || 0;
      metrics.broken_links_count = scan.report.broken_links || 0;
      needsReview = Math.max(needsReview, scan.report.needs_review || 0);
    }
  } catch {
    /* scan optional */
  }

  const qualityStats = await getQualityStats(admin);
  metrics.completeness_pct = qualityStats.avg || 70;
  metrics.verification_pct = totalItems ? Math.round((verifiedItems / totalItems) * 100) : 0;
  metrics.needs_review_pct = totalItems ? Math.round((needsReview / totalItems) * 100) : 0;

  try {
    const search = await getSearchAnalytics(admin, 7);
    metrics.update_success_rate = search.quality_score || 90;
  } catch {
    /* optional */
  }

  metrics.overall_score = Math.round(
    metrics.completeness_pct * 0.25 +
      metrics.verification_pct * 0.3 +
      (100 - metrics.needs_review_pct) * 0.2 +
      metrics.update_success_rate * 0.15 +
      (metrics.duplicate_count === 0 ? 10 : Math.max(0, 10 - metrics.duplicate_count)),
  );

  return metrics;
}
