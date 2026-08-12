/**
 * AI Knowledge Auditor — daily full-platform review.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { runScholarlyVerificationScan } from "../scholarly-verification/orchestrator.mjs";
import { runReviewCycle } from "../global-reference/review.mjs";
import { auditAllSources } from "../global-reference/sources.mjs";
import { runReviewGate } from "../scholarly-verification/review-gate.mjs";

const CHECK_TYPES = [
  "empty_page",
  "incomplete_data",
  "broken_link",
  "missing_image",
  "stale_content",
  "duplicate",
  "spelling",
  "wrong_classification",
  "unlinked_item",
];

export async function runKnowledgeAuditor(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();
  const started = new Date().toISOString();

  const audit = {
    id: runId,
    agent: "knowledge_auditor",
    status: "running",
    started_at: started,
    items_checked: 0,
    issues_found: 0,
    fixes_suggested: 0,
    findings: [],
    checks: CHECK_TYPES.map((t) => ({ type: t, count: 0 })),
  };

  const sourceAudit = await auditAllSources(admin);
  audit.items_checked += sourceAudit.length;
  for (const src of sourceAudit) {
    if (!src.ok) {
      audit.issues_found++;
      audit.checks.find((c) => c.type === "broken_link").count++;
      audit.findings.push({
        issue_type: "broken_link",
        severity: "critical",
        ref_id: `majalis:source:${src.slug}`,
        description: `مصدر ${src.name || src.slug} غير متصل`,
        suggested_fix: "تحديث الرابط أو تعطيل المصدر",
      });
    }
  }

  try {
    const scholarly = await runScholarlyVerificationScan({
      checkLinks: opts.checkLinks ?? true,
      useAi: false,
      persist: opts.persist ?? true,
      trigger: "knowledge_auditor",
    });

    if (scholarly.report) {
      audit.items_checked += scholarly.report.total_scanned || 0;
      const dupCount = scholarly.report.duplicates || 0;
      const reviewCount = scholarly.report.needs_review || 0;

      if (dupCount > 0) {
        audit.issues_found += dupCount;
        audit.checks.find((c) => c.type === "duplicate").count += dupCount;
        audit.findings.push({
          issue_type: "duplicate",
          severity: "warning",
          description: `${dupCount} عنصر مكرر`,
          suggested_fix: "دمج أو أرشفة التكرارات",
        });
      }

      if (reviewCount > 0) {
        audit.issues_found += reviewCount;
        audit.checks.find((c) => c.type === "incomplete_data").count += reviewCount;
        audit.findings.push({
          issue_type: "incomplete_data",
          severity: "warning",
          description: `${reviewCount} عنصر يحتاج مراجعة`,
          suggested_fix: "إكمال بيانات المصدر والمؤلف",
        });
      }
    }
  } catch {
    /* scholarly scan optional */
  }

  try {
    const refCycle = await runReviewCycle(admin, { checkLinks: false, type: "auditor" });
    audit.items_checked += refCycle.items_checked || 0;
    for (const issue of refCycle.issues || []) {
      audit.issues_found++;
      const checkType = issue.issue_type === "stale_content" ? "stale_content" : "incomplete_data";
      const check = audit.checks.find((c) => c.type === checkType);
      if (check) check.count++;
      audit.findings.push(issue);
    }
  } catch {
    /* ref cycle optional */
  }

  if (admin) {
    try {
      const tables = [
        { table: "fawaid", kind: "faida", titleCol: "title" },
        { table: "library_items", kind: "book", titleCol: "title" },
        { table: "qa_questions", kind: "qa", titleCol: "question" },
      ];

      for (const { table, kind, titleCol } of tables) {
        const { data: rows } = await admin.from(table).select("*").limit(50);
        for (const row of rows || []) {
          audit.items_checked++;
          const gate = await runReviewGate({ ...row, content_type: kind }, { checkLinks: false });

          if (!row[titleCol] || !row.source_url) {
            audit.issues_found++;
            audit.checks.find((c) => c.type === "empty_page").count++;
            audit.findings.push({
              issue_type: "empty_page",
              severity: "warning",
              ref_id: `majalis:${kind}:${row.id}`,
              description: `محتوى ناقص: ${row[titleCol] || "بدون عنوان"}`,
              suggested_fix: "إضافة عنوان ومصدر",
            });
          }

          if (gate.checks?.some((c) => c.id === "missing_image" && !c.passed)) {
            audit.issues_found++;
            audit.checks.find((c) => c.type === "missing_image").count++;
            audit.findings.push({
              issue_type: "missing_image",
              severity: "info",
              ref_id: `majalis:${kind}:${row.id}`,
              description: "صورة مفقودة",
              suggested_fix: "إضافة صورة أو placeholder",
            });
          }

          if (gate.checks?.some((c) => c.id === "language" && !c.passed)) {
            audit.checks.find((c) => c.type === "spelling").count++;
          }

          if (!gate.checks?.some((c) => c.id === "classification" && c.passed)) {
            audit.checks.find((c) => c.type === "wrong_classification").count++;
          }
        }
      }
    } catch {
      /* table scan optional */
    }
  }

  audit.fixes_suggested = audit.findings.filter((f) => f.suggested_fix).length;
  audit.status = "completed";
  audit.finished_at = new Date().toISOString();

  if (admin) {
    try {
      await admin.from("intelligence_runs").insert({
        id: runId,
        agent_id: "knowledge_auditor",
        status: "completed",
        items_checked: audit.items_checked,
        issues_found: audit.issues_found,
        fixes_suggested: audit.fixes_suggested,
        report: { checks: audit.checks, findings: audit.findings.slice(0, 100) },
        started_at: started,
        finished_at: audit.finished_at,
      });

      for (const finding of audit.findings.slice(0, 100)) {
        await admin.from("intelligence_audit_findings").insert({
          run_id: runId,
          agent_id: "knowledge_auditor",
          ...finding,
        });
      }
    } catch {
      /* tables may not exist */
    }
  }

  return audit;
}
