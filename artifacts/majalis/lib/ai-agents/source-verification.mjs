/**
 * Source Verification Agent — verifies source URL, link integrity, and trust level.
 */

import { verifySourceUrl } from "../auto-content/auto-content-utils.mjs";
import { applyScholarlyGateToAutoContentRecord } from "../scholarly-verification/bridge.mjs";
import { MIN_TRUST_FOR_PUBLISH } from "./config.mjs";
import { logAgentRun, logAgentError } from "./audit.mjs";

export async function runSourceVerificationAgent(admin, opts = {}) {
  const started = Date.now();
  const result = {
    agent: "source_verification",
    status: "running",
    verified: 0,
    rejected: 0,
    needs_review: 0,
    items: [],
    errors: [],
  };

  if (!admin) {
    result.status = "skipped";
    result.errors.push("no_admin");
    return result;
  }

  try {
    const limit = opts.limit || 50;
    const { data: pending } = await admin
      .from("auto_imported_content")
      .select("*")
      .in("status", ["pending", "needs_review", "draft"])
      .order("created_at", { ascending: false })
      .limit(limit);

    for (const item of pending || []) {
      const urlCheck = await verifySourceUrl(item.source_url || item.original_url);
      const gate = await applyScholarlyGateToAutoContentRecord(admin, {
        ...item,
        source_verified: urlCheck.ok,
        trust_level: item.trust_level || 0,
      });

      const trustOk = (item.trust_level || 0) >= MIN_TRUST_FOR_PUBLISH;
      const verified = urlCheck.ok && trustOk && gate.status !== "rejected";

      if (verified) {
        result.verified += 1;
        await admin.from("auto_imported_content").update({
          verification_status: "verified",
          pipeline_stage: "source_verified",
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
      } else if (gate.status === "rejected" || !urlCheck.ok) {
        result.rejected += 1;
        await admin.from("auto_imported_content").update({
          verification_status: "rejected",
          status: "rejected",
          pipeline_stage: "rejected",
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
      } else {
        result.needs_review += 1;
        await admin.from("auto_imported_content").update({
          verification_status: "needs_review",
          status: "needs_review",
          pipeline_stage: "source_verification",
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
      }

      result.items.push({
        id: item.id,
        title: item.title,
        url_ok: urlCheck.ok,
        trust_ok: trustOk,
        gate: gate.status,
      });

      try {
        await admin.from("verification_logs").insert({
          content_id: item.id,
          check_type: "source_verification_agent",
          status: verified ? "passed" : gate.status === "rejected" ? "failed" : "needs_review",
          details: { urlCheck, gate, trust_level: item.trust_level },
        });
      } catch {
        /* table may not exist */
      }
    }

    result.status = "completed";
    result.duration_ms = Date.now() - started;

    await logAgentRun(admin, {
      agentId: "source_verification",
      outcome: "success",
      metadata: { verified: result.verified, rejected: result.rejected, needs_review: result.needs_review },
    });
  } catch (err) {
    result.status = "failed";
    result.errors.push(String(err.message || err));
    result.duration_ms = Date.now() - started;
    await logAgentError(admin, "source_verification", err, result);
  }

  return result;
}
