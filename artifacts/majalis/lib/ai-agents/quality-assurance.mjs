/**
 * Quality Assurance Agent — checks duplicates, gaps, links, errors, images.
 */

import { verifySourceUrl } from "../auto-content/auto-content-utils.mjs";
import { logAgentRun, logAgentError } from "./audit.mjs";

export async function runQualityAssuranceAgent(admin, opts = {}) {
  const started = Date.now();
  const result = {
    agent: "quality_assurance",
    status: "running",
    checked: 0,
    passed: 0,
    failed: 0,
    duplicates: 0,
    broken_links: 0,
    missing_fields: 0,
    errors: [],
  };

  if (!admin) {
    result.status = "skipped";
    result.errors.push("no_admin");
    return result;
  }

  try {
    const limit = opts.limit || 50;
    const { data: items } = await admin
      .from("auto_imported_content")
      .select("*")
      .in("pipeline_stage", ["knowledge_processed", "source_verified", "needs_review"])
      .order("created_at", { ascending: false })
      .limit(limit);

    const seenKeys = new Set();

    for (const item of items || []) {
      result.checked += 1;
      const issues = [];

      if (!item.title || item.title.length < 5) issues.push("missing_title");
      if (!item.summary || item.summary.length < 20) {
        issues.push("missing_summary");
        result.missing_fields += 1;
      }

      if (item.external_key && seenKeys.has(item.external_key)) {
        issues.push("duplicate");
        result.duplicates += 1;
      } else if (item.external_key) {
        seenKeys.add(item.external_key);
      }

      const url = item.source_url || item.original_url;
      if (url) {
        const linkCheck = await verifySourceUrl(url);
        if (!linkCheck.ok) {
          issues.push("broken_link");
          result.broken_links += 1;
        }
      }

      if (issues.includes("duplicate")) {
        result.failed += 1;
        await admin.from("auto_imported_content").update({
          status: "rejected",
          verification_status: "duplicate",
          pipeline_stage: "qa_failed",
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
      } else if (issues.length === 0) {
        result.passed += 1;
        await admin.from("auto_imported_content").update({
          pipeline_stage: "qa_passed",
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
      } else {
        result.failed += 1;
        await admin.from("auto_imported_content").update({
          status: "needs_review",
          pipeline_stage: "qa_needs_review",
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
      }
    }

    result.status = "completed";
    result.duration_ms = Date.now() - started;

    await logAgentRun(admin, {
      agentId: "quality_assurance",
      outcome: "success",
      metadata: {
        checked: result.checked,
        passed: result.passed,
        failed: result.failed,
        duplicates: result.duplicates,
        broken_links: result.broken_links,
      },
    });
  } catch (err) {
    result.status = "failed";
    result.errors.push(String(err.message || err));
    result.duration_ms = Date.now() - started;
    await logAgentError(admin, "quality_assurance", err, result);
  }

  return result;
}
