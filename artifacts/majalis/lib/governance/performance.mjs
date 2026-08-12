/**
 * Enterprise Governance — performance and scalability assessment.
 */

import { cacheStats } from "../open-platform/cache.mjs";
import { getSystemHealth } from "../system-health.mjs";
import { listAvailableMigrations } from "../migration-paths.mjs";

export async function getScalabilityAssessment(admin) {
  const [health, migrations] = await Promise.all([
    getSystemHealth().catch(() => ({ ok: false })),
    Promise.resolve(listAvailableMigrations()),
  ]);

  const cache = cacheStats();

  const recommendations = [
    {
      area: "cache",
      current: "In-memory (500 entries)",
      recommendation: "Redis/Upstash for distributed cache at scale",
      impact: "high",
      enables: "millions of requests with sub-100ms repeat queries",
    },
    {
      area: "rate_limit",
      current: "In-memory per-instance",
      recommendation: "Distributed rate limiting (Upstash Redis)",
      impact: "high",
      enables: "consistent limits across serverless instances",
    },
    {
      area: "database",
      current: "Supabase Postgres + pooler",
      recommendation: "Read replicas for search-heavy workloads",
      impact: "medium",
      enables: "horizontal read scaling",
    },
    {
      area: "background_jobs",
      current: "Cron + AKE job queue",
      recommendation: "Dedicated queue worker (Inngest/BullMQ)",
      impact: "medium",
      enables: "distributed task processing",
    },
    {
      area: "indexing",
      current: "Manual SQL migrations",
      recommendation: "Auto-index advisor in governance monitoring",
      impact: "medium",
      enables: "automatic index maintenance",
    },
    {
      area: "new_sources",
      current: "OPEN_RESOURCES registry + CMS content-registry",
      recommendation: "Add new resource = 1 config entry + optional table",
      impact: "low",
      enables: "plug-and-play content sections",
    },
  ];

  return {
    score: 80,
    ok: health.ok !== false,
    cache,
    migrations_ok: migrations.ok,
    migrations_count: migrations.present?.length || 0,
    capabilities: {
      millions_of_requests: "Requires Redis cache + CDN (partially ready)",
      new_sources_without_refactor: true,
      new_sections_easily: true,
      auto_index_updates: false,
      background_task_distribution: "partial (cron + queue)",
    },
    recommendations,
    cron_jobs: health.cron?.routes?.length || 0,
  };
}
