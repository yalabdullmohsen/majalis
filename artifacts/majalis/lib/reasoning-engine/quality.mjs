/**
 * Reasoning quality monitor — detect graph gaps and suggest fixes.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { runRelationInference } from "./inference.mjs";

async function upsertIssue(admin, issue) {
  if (!admin) return null;
  try {
    const { data } = await admin
      .from("reasoning_quality_issues")
      .insert({ ...issue, detected_at: new Date().toISOString() })
      .select("id")
      .maybeSingle();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export async function scanReasoningQuality(admin, opts = {}) {
  admin = admin ?? getSupabaseAdmin();
  const issues = [];
  const limit = opts.limit ?? 100;

  if (!admin) {
    return { ok: false, issues, error: "admin required" };
  }

  const { data: refs } = await admin
    .from("global_content_refs")
    .select("ref_id, content_kind, title, verification_status, references")
    .limit(limit);

  const { data: relations } = await admin
    .from("content_relations")
    .select("from_ref_id")
    .limit(5000);

  const linked = new Set((relations ?? []).map((r) => r.from_ref_id));

  for (const ref of refs ?? []) {
    if (!linked.has(ref.ref_id)) {
      const issue = {
        issue_type: "sparse_graph",
        entity_ref_id: ref.ref_id,
        entity_kind: ref.content_kind,
        severity: "medium",
        description: `العنصر «${ref.title}» بلا علاقات في الرسم المعرفي`,
        suggested_fix: "تشغيل محرك الاستدلال لإنشاء علاقات تلقائية",
        auto_fixable: true,
      };
      issues.push(issue);
      await upsertIssue(admin, issue);
    }

    const refsArr = ref.references;
    const hasSource = Array.isArray(refsArr) ? refsArr.some((r) => r?.url) : false;
    if (ref.verification_status !== "verified" && !hasSource) {
      const issue = {
        issue_type: "missing_source",
        entity_ref_id: ref.ref_id,
        entity_kind: ref.content_kind,
        severity: "high",
        description: `العنصر «${ref.title}» بلا مصدر موثق`,
        suggested_fix: "ربط بمصدر رسمي في سجل المصادر",
        auto_fixable: false,
      };
      issues.push(issue);
      await upsertIssue(admin, issue);
    }

    if (ref.verification_status === "needs_review") {
      const issue = {
        issue_type: "unverified",
        entity_ref_id: ref.ref_id,
        entity_kind: ref.content_kind,
        severity: "medium",
        description: `محتوى «${ref.title}» يحتاج مراجعة علمية`,
        auto_fixable: false,
      };
      issues.push(issue);
    }
  }

  const { count: dupHadith } = await admin
    .from("verified_hadith_items")
    .select("*", { count: "exact", head: true })
    .eq("verification_status", "duplicate")
    .catch(() => ({ count: 0 }));

  if ((dupHadith ?? 0) > 0) {
    issues.push({
      issue_type: "duplicate",
      severity: "low",
      description: `${dupHadith} أحاديث مكررة في المكتبة الموثقة`,
      auto_fixable: true,
    });
  }

  return { ok: true, issues, count: issues.length };
}

export async function autoFixQualityIssues(admin, opts = {}) {
  const scan = await scanReasoningQuality(admin, opts);
  let fixed = 0;

  if (opts.inferRelations !== false) {
    const inference = await runRelationInference(admin, { limit: opts.inferenceLimit ?? 100 });
    fixed += inference.created ?? 0;
  }

  return { ok: true, scan, relations_created: fixed };
}
