/**
 * Registered autonomous crons — expected schedules for monitoring.
 */

export const AKE_MONITORED_CRONS = [
  { name: "auto-knowledge-sync", path: "/api/cron/auto-knowledge-sync", schedule: "*/15 * * * *", label: "AKE full sync" },
  { name: "ake-queue-drain", path: "/api/cron/ake-queue-drain", schedule: "* * * * *", label: "AKE queue drain" },
  { name: "connector-health", path: "/api/cron/connector-health", schedule: "*/15 * * * *", label: "Source health" },
  { name: "autonomous-platform-cycle", path: "/api/cron/autonomous-platform-cycle", schedule: "7,22,37,52 * * * *", label: "Autonomous platform cycle" },
  { name: "ake-monitoring-eval", path: "/api/cron/ake-monitoring-eval", schedule: "5,20,35,50 * * * *", label: "Monitoring eval" },
  { name: "governance-backup", path: "/api/cron/governance-backup", schedule: "0 2 * * *", label: "Backup" },
  { name: "knowledge-sync", path: "/api/cron/knowledge-sync", schedule: "0 2 * * *", label: "Knowledge sync" },
  { name: "autonomous-platform-reindex", path: "/api/cron/autonomous-platform-reindex", schedule: "30 1 * * *", label: "Search reindex" },
  { name: "content-engines", path: "/api/cron/content-engines", schedule: "10,40 * * * *", label: "Content engines" },
  { name: "majlis-knowledge-engine", path: "/api/cron/majlis-knowledge-engine", schedule: "5,35 * * * *", label: "MKE orchestrator" },
  { name: "content-scheduler", path: "/api/cron/content-scheduler", schedule: "0 * * * *", label: "Content scheduler" },
  { name: "system-health", path: "/api/cron/system-health", schedule: "45 3 * * *", label: "System health" },
];

export const PIPELINE_STAGES = [
  "fetch",
  "parse",
  "normalize",
  "deduplicate",
  "ai_enrichment",
  "quality_gate",
  "review_queue",
  "publish",
  "search_index",
  "recommendations",
  "notifications",
];

export function getCronDefinition(name) {
  return AKE_MONITORED_CRONS.find((c) => c.name === name) || null;
}

/** Parse simple cron interval to max gap in minutes (approximate). */
export function expectedMaxGapMinutes(schedule) {
  if (!schedule) return 24 * 60;
  const parts = schedule.trim().split(/\s+/);
  if (parts.length < 5) return 24 * 60;
  const minute = parts[0];
  if (minute.startsWith("*/")) return Number(minute.slice(2)) || 15;
  if (minute.includes(",")) {
    const nums = minute.split(",").map(Number).filter((n) => !Number.isNaN(n));
    if (nums.length >= 2) return Math.max(...nums) - Math.min(...nums) + 1;
  }
  if (minute === "*") return 1;
  return 24 * 60;
}
