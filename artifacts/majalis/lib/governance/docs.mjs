/**
 * Enterprise Governance — technical documentation generator.
 */

import { writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROLES, LIFECYCLE_STAGES, REVIEW_CHECKS } from "./config.mjs";
import { listAvailableMigrations } from "../migration-paths.mjs";
import { AGENTS } from "../islamic-intelligence/config.mjs";
import { OPEN_RESOURCES, API_VERSIONS } from "../open-platform/config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

export function generateTechnicalDocs() {
  const migrations = listAvailableMigrations();

  const docs = {
    generated_at: new Date().toISOString(),
    title: "Majalis Enterprise Governance — Technical Documentation",
    architecture: {
      overview: "Monorepo with artifacts/majalis as deployable app; Supabase Postgres + Vercel serverless",
      layers: [
        { name: "Frontend", path: "src/", stack: "React + Vite + Wouter" },
        { name: "API", path: "api/", stack: "Vercel serverless + Express dev server" },
        { name: "Business Logic", path: "lib/", modules: ["governance", "open-platform", "islamic-intelligence", "global-reference", "scholarly-verification", "autonomous-ai"] },
        { name: "Database", path: "supabase/", engine: "PostgreSQL via Supabase" },
        { name: "CMS", path: "src/lib/cms/", registry: "15 content kinds" },
      ],
      deployment: "Vercel (frontend + API) + Supabase (DB + Auth + Storage)",
    },
    database_schema: {
      migrations: migrations.present || [],
      governance_tables: [
        "governance_user_roles", "governance_audit_log", "governance_content_lifecycle",
        "governance_lifecycle_history", "governance_reviews", "governance_backup_runs",
        "governance_security_audits",
      ],
      core_tables: ["profiles", "admin_audit_logs", "cms_content_index", "global_content_refs"],
    },
    apis: {
      public: ["/api/v1/*", "/api/v2/*", "/api/v3/*"],
      admin: ["/api/admin/governance", "/api/admin/open-platform", "/api/admin/islamic-intelligence"],
      legacy: ["/api/intelligent-search", "/api/global-reference", "/api/digital-learning"],
      versions: API_VERSIONS,
      resources: Object.keys(OPEN_RESOURCES).length,
    },
    cron_jobs: [
      { path: "/api/cron/sync-data", schedule: "daily" },
      { path: "/api/cron/autonomous-orchestrator", schedule: "every 6h" },
      { path: "/api/cron/islamic-intelligence", schedule: "daily" },
      { path: "/api/cron/global-reference-review", schedule: "weekly" },
      { path: "/api/cron/governance-backup", schedule: "weekly" },
      { path: "/api/cron/apply-migrations", schedule: "weekly" },
      { path: "/api/cron/scholarly-verification", schedule: "daily" },
    ],
    ai_agents: Object.values(AGENTS).map((a) => ({ id: a.id, label: a.label_ar, schedule: a.schedule })),
    rbac: {
      roles: Object.values(ROLES).map((r) => ({ id: r.id, label: r.label_ar, permissions: r.permissions })),
    },
    content_lifecycle: LIFECYCLE_STAGES,
    review_checks: REVIEW_CHECKS,
    monitoring: {
      endpoints: ["/api/admin/governance?action=monitoring", "/api/cron/system-health"],
    },
    backup: {
      strategy: "Supabase auto-backup + governance weekly export samples",
      recovery: "PITR via Supabase dashboard; sample restore from data/backups/",
    },
    security_policies: [
      "All write operations require RBAC permission check",
      "No religious text generation by AI",
      "API keys hashed SHA-256",
      "Cron protected by CRON_SECRET",
      "RLS on all governance tables",
      "Audit log for every governance action",
    ],
  };

  writeFileSync(path.join(ROOT, "data/governance-technical-docs.json"), JSON.stringify(docs, null, 2), "utf8");

  const markdown = generateMarkdownDocs(docs);
  writeFileSync(path.join(ROOT, "data/governance-technical-docs.md"), markdown, "utf8");

  return docs;
}

function generateMarkdownDocs(docs) {
  return `# ${docs.title}

Generated: ${docs.generated_at}

## Architecture

${docs.architecture.overview}

### Layers
${docs.architecture.layers.map((l) => `- **${l.name}** (\`${l.path}\`) — ${l.stack || l.registry || ""}`).join("\n")}

## RBAC Roles
${docs.rbac.roles.map((r) => `- **${r.label}** (\`${r.id}\`): ${r.permissions.join(", ")}`).join("\n")}

## Content Lifecycle
${docs.content_lifecycle.map((s) => `${s.order}. ${s.label} (\`${s.id}\`)${s.auto ? " [auto]" : ""}`).join("\n")}

## Cron Jobs
${docs.cron_jobs.map((c) => `- \`${c.path}\` — ${c.schedule}`).join("\n")}

## Security Policies
${docs.security_policies.map((p) => `- ${p}`).join("\n")}
`;
}
