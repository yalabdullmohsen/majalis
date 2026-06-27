/**
 * Release Gate — shared constants and helpers.
 * A feature is "Done" only when ALL gate checks pass.
 */

export const RELEASE_GATE_CHECKS = [
  "code",
  "typescript",
  "build",
  "migration",
  "merge",
  "productionDeploy",
  "route",
  "api",
  "ui",
  "featureVerified",
];

/** Exactly three delivery states — no other labels allowed. */
export const DELIVERY_STATES = ["Production", "Ready", "Blocked"];

export const BLOCK_REASONS = [
  "Secret",
  "Migration",
  "Merge",
  "Build",
  "Bug",
  "Deploy",
  "Mock",
  "E2E",
];

export const PRODUCTION_BASE =
  process.env.MAJALIS_PRODUCTION_URL || "https://majlisilm.com";

export const USER_FACING_ROUTES = [
  "/",
  "/quran",
  "/quran/surah-stories",
  "/rulings",
  "/qa",
  "/lessons",
  "/library",
  "/miracles",
  "/fawaid",
  "/search",
  "/admin",
  "/admin/feature-status",
  "/assistant",
  "/calendar",
  "/prayer-times",
];

export const PRODUCTION_APIS = [
  { path: "/api/healthz", method: "GET", expectOk: true },
  { path: "/api/assistant/health", method: "GET", expectOk: true },
  { path: "/api/assistant", method: "POST", expectOk: true },
  { path: "/api/knowledge-search?q=صلاة", method: "GET", expectOk: true },
  { path: "/api/daily-content", method: "GET", expectOk: true },
  { path: "/api/intelligent-search?q=صلاة", method: "GET", expectOk: true },
  { path: "/api/prayer-times?city=Kuwait", method: "GET", expectOk: true },
];

export const CRON_SMOKE_PATHS = [
  "/api/cron/system-health",
  "/api/cron/auto-content-health",
  "/api/cron/connector-health",
];

/** Tables tracked by migration-paths + feature registry. */
export const CORE_DB_TABLES = [
  "lessons",
  "qa_questions",
  "qa_categories",
  "profiles",
  "trusted_lesson_sources",
  "lesson_import_drafts",
  "automation_runs",
  "automation_step_logs",
  "learning_paths",
];

export const OPTIONAL_DB_TABLES = [
  "mke_runs",
  "mke_source_plugins",
  "mke_decisions",
  "mke_queue_jobs",
  "sharia_rulings",
  "kg_nodes",
  "kg_edges",
  "auto_imported_content",
  "auto_publish_queue",
  "fiqh_council_items",
  "tkn_platform_settings",
  "tkn_source_operations_log",
  "tkn_retry_queue",
  "tkn_pipeline_stage_logs",
];

export const SECRET_GROUPS = {
  supabase: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  auth: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"],
  cron: ["CRON_SECRET", "SUPABASE_SERVICE_ROLE_KEY"],
  openai: ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  instagram: [
    "INSTAGRAM_GRAPH_ACCESS_TOKEN",
    "INSTAGRAM_BUSINESS_ACCOUNT_ID",
    "INSTAGRAM_APP_ID",
    "INSTAGRAM_APP_SECRET",
  ],
  database: ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PASSWORD"],
};

export function classifyDelivery(feature, ctx) {
  const inMain = feature.branch ? ctx.mergedBranches[feature.branch] !== false : true;
  const inCode = feature.codeMarkers.every((m) => ctx.codeHits[m]);
  const prodMarkers = feature.productionMarkers || [];
  const inProd =
    !ctx.production ||
    (prodMarkers.length === 0
      ? inMain
      : prodMarkers.every((m) => ctx.prodHits[m]) &&
        !(feature.blockedProductionMarkers || []).some((m) => ctx.prodBlocked[m]));
  const secretsMissing = (feature.requiredSecrets || []).filter((k) => !ctx.env[k]);
  const tablesMissing = (feature.requiredTables || []).filter((t) => ctx.tables?.[t] === false);
  const migrationsPending = (feature.migrations || []).filter((m) => ctx.migrations?.[m] === false);

  if (!inCode) {
    return { state: "Blocked", reason: "Merge", detail: "Code markers missing in repo" };
  }
  if (feature.branch && !inMain) {
    return { state: "Ready", reason: "Merge", detail: `Branch ${feature.branch} not merged to main` };
  }
  if (secretsMissing.length) {
    return { state: "Blocked", reason: "Secret", detail: secretsMissing.join(", ") };
  }
  if (tablesMissing.length || migrationsPending.length) {
    return {
      state: "Blocked",
      reason: "Migration",
      detail: [...tablesMissing, ...migrationsPending].join(", "),
    };
  }
  if (feature.usesMock && ctx.production) {
    return { state: "Blocked", reason: "Mock", detail: "usesMock=true — not production-complete" };
  }
  if (ctx.production && !inProd) {
    return { state: "Ready", reason: "Deploy", detail: "Merged to main but not in Production bundle" };
  }
  if (ctx.production && inProd && inMain) {
    return { state: "Production", reason: null, detail: null };
  }
  if (inMain && inCode) {
    return { state: "Ready", reason: null, detail: "On main — run --production to confirm deploy" };
  }
  return { state: "Blocked", reason: "Bug", detail: "Unclassified gate failure" };
}
