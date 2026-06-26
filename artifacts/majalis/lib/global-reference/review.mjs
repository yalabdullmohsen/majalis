/**
 * Periodic review engine — checks sources, links, completeness, duplicates.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { auditAllSources } from "./sources.mjs";
import { scoreContent } from "./quality.mjs";
import { runScholarlyVerificationScan } from "../scholarly-verification/orchestrator.mjs";

export async function runReviewCycle(admin, opts = {}) {
  const cycle = {
    id: crypto.randomUUID(),
    cycle_type: opts.type || "periodic",
    status: "running",
    started_at: new Date().toISOString(),
    items_checked: 0,
    issues_found: 0,
    fixes_suggested: 0,
    issues: [],
  };

  if (admin) {
    try {
      const { data } = await admin
        .from("reference_review_cycles")
        .insert({ cycle_type: cycle.cycle_type, status: "running" })
        .select()
        .single();
      if (data) cycle.id = data.id;
    } catch {
      /* table may not exist */
    }
  }

  const sourceAudit = await auditAllSources(admin);
  cycle.items_checked += sourceAudit.length;

  for (const src of sourceAudit) {
    if (!src.ok) {
      cycle.issues_found++;
      cycle.issues.push({
        issue_type: "broken_link",
        severity: "critical",
        description: `Source ${src.slug} connection ${src.status}`,
        suggested_fix: "Update source URL or deactivate source",
        ref_id: `majalis:source:${src.slug}`,
      });
    }
  }

  try {
    const scholarly = await runScholarlyVerificationScan({
      checkLinks: opts.checkLinks ?? true,
      useAi: false,
      persist: false,
      trigger: "review_cycle",
    });

    if (scholarly.report) {
      cycle.items_checked += scholarly.report.total_scanned || 0;
      cycle.issues_found += scholarly.report.needs_review || 0;
      cycle.issues_found += scholarly.report.duplicates || 0;

      if (scholarly.report.needs_review > 0) {
        cycle.issues.push({
          issue_type: "incomplete_data",
          severity: "warning",
          description: `${scholarly.report.needs_review} items need review`,
          suggested_fix: "Complete provenance metadata",
        });
      }
    }
  } catch {
    /* scholarly scan optional */
  }

  if (admin) {
    try {
      const { data: refs } = await admin.from("global_content_refs").select("*").limit(100);

      for (const ref of refs || []) {
        cycle.items_checked++;
        const scores = await scoreContent(admin, ref);

        if (scores.completeness_score < 70) {
          cycle.issues_found++;
          cycle.issues.push({
            issue_type: "incomplete_data",
            severity: "warning",
            ref_id: ref.ref_id,
            description: `Incomplete: ${ref.title}`,
            suggested_fix: "Add source, author, and summary",
          });
        }

        if (scores.freshness_score < 50) {
          cycle.issues.push({
            issue_type: "stale_content",
            severity: "info",
            ref_id: ref.ref_id,
            description: `Stale content: ${ref.title}`,
            suggested_fix: "Review and update content",
          });
        }
      }
    } catch {
      /* refs table may not exist */
    }
  }

  cycle.fixes_suggested = cycle.issues.filter((i) => i.suggested_fix).length;
  cycle.status = "completed";
  cycle.finished_at = new Date().toISOString();

  if (admin) {
    try {
      await admin
        .from("reference_review_cycles")
        .update({
          status: "completed",
          items_checked: cycle.items_checked,
          issues_found: cycle.issues_found,
          fixes_suggested: cycle.fixes_suggested,
          report: { issues: cycle.issues.slice(0, 50) },
          finished_at: cycle.finished_at,
        })
        .eq("id", cycle.id);

      for (const issue of cycle.issues.slice(0, 100)) {
        await admin.from("reference_review_issues").insert({
          cycle_id: cycle.id,
          ...issue,
        });
      }
    } catch {
      /* tables may not exist */
    }
  }

  return cycle;
}

export async function getReviewHistory(admin, limit = 10) {
  if (!admin) return [];

  try {
    const { data } = await admin
      .from("reference_review_cycles")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}
