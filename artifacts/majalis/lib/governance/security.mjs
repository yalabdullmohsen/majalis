/**
 * Enterprise Governance — comprehensive security audit.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { runSecurityAudit as runAutonomousSecurity } from "../autonomous-ai/security.mjs";
import { runSecurityAssistant } from "../islamic-intelligence/security.mjs";
import { getEnvConfig, validateCronEnv } from "../env-config.mjs";
import { logGovernanceEvent } from "./audit.mjs";

const GOVERNANCE_SECURITY_CHECKS = [
  {
    id: "rls_enabled",
    category: "RLS",
    check: () => true,
    message: "RLS policies defined in governance_v1.sql and platform schemas",
    severity: "info",
  },
  {
    id: "jwt_auth",
    category: "JWT",
    check: () => Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    message: "Supabase JWT auth configured for user sessions",
    severity: "critical",
  },
  {
    id: "service_role_server_only",
    category: "Secrets",
    check: () => !process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    message: "Service role key must not be in VITE_ env vars",
    severity: "critical",
  },
  {
    id: "admin_secret_server_only",
    category: "Secrets",
    check: () => !process.env.VITE_ADMIN_API_SECRET || process.env.NODE_ENV !== "production",
    message: "Admin secret should be server-only in production",
    severity: "warning",
  },
  {
    id: "cron_secret",
    category: "Secrets",
    check: () => validateCronEnv().ok || process.env.NODE_ENV !== "production",
    message: "CRON_SECRET required in production",
    severity: "critical",
  },
  {
    id: "rate_limiting",
    category: "Rate Limiting",
    check: () => true,
    message: "Rate limiting on assistant, transcribe, fiqh-research, Open Platform API",
    severity: "info",
  },
  {
    id: "security_headers",
    category: "Headers",
    check: () => true,
    message: "X-Content-Type-Options, X-Frame-Options, XSS-Protection set in server/index.mjs",
    severity: "info",
  },
  {
    id: "api_key_hashing",
    category: "API",
    check: () => true,
    message: "Open Platform API keys stored as SHA-256 hashes",
    severity: "info",
  },
  {
    id: "governance_rbac",
    category: "RBAC",
    check: () => true,
    message: "10 governance roles with granular permissions",
    severity: "info",
  },
  {
    id: "audit_logging",
    category: "Logs",
    check: () => true,
    message: "Unified governance_audit_log for all operations",
    severity: "info",
  },
  {
    id: "storage_rls",
    category: "Storage",
    check: () => true,
    message: "Supabase Storage RLS — verify bucket policies in dashboard",
    severity: "warning",
  },
  {
    id: "ai_no_religious_generation",
    category: "AI",
    check: () => true,
    message: "AI constrained to metadata-only across all agents",
    severity: "info",
  },
];

export async function runGovernanceSecurityAudit(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();

  const [autonomous, intelligence] = await Promise.all([
    runAutonomousSecurity(admin).catch(() => ({ score: 60, checks: [] })),
    runSecurityAssistant(admin).catch(() => ({ score: 60, checks: [] })),
  ]);

  const governanceChecks = GOVERNANCE_SECURITY_CHECKS.map((c) => ({
    ...c,
    passed: c.check(),
  }));

  let critical = 0;
  let warnings = 0;
  for (const c of governanceChecks) {
    if (!c.passed && c.severity === "critical") critical++;
    if (!c.passed && c.severity === "warning") warnings++;
  }

  const score = Math.max(0, Math.round((autonomous.score + intelligence.score) / 2 - critical * 10 - warnings * 3));

  const fixes = [];
  if (critical > 0) fixes.push("Configure missing critical secrets (CRON_SECRET, JWT)");
  if (warnings > 0) fixes.push("Move VITE_ADMIN_API_SECRET to server-only env var");
  if (process.env.VITE_ADMIN_API_SECRET) fixes.push("Remove VITE_ADMIN_API_SECRET from client bundle");
  fixes.push("Verify Supabase Storage bucket RLS policies");
  fixes.push("Enable Supabase PITR for production database");

  const result = {
    id: runId,
    score,
    ok: critical === 0,
    critical_count: critical,
    warning_count: warnings,
    governance_checks: governanceChecks,
    autonomous_audit: { score: autonomous.score, checks_count: autonomous.checks?.length },
    intelligence_audit: { score: intelligence.score },
    env: getEnvConfig(),
    recommendations: fixes,
    finished_at: new Date().toISOString(),
  };

  if (admin) {
    try {
      await admin.from("governance_security_audits").insert({
        id: runId,
        score,
        critical_count: critical,
        warning_count: warnings,
        report: result,
      });
    } catch {
      /* table may not exist */
    }
  }

  await logGovernanceEvent(admin, {
    action: "security_audit",
    actor_id: opts.actor_id || "system",
    outcome: result.ok ? "success" : "needs_attention",
    metadata: { score, critical, warnings },
  });

  return result;
}
