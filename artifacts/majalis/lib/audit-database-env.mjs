/**
 * Audit all database-related environment variables — which wins, conflicts, canonical URL.
 */
import {
  describeDatabaseUrlConfig,
  parsePostgresUrl,
  redactDatabaseUrl,
  resolveDatabaseUrl,
  testDatabaseConnection,
  getProjectRef,
  getPoolerHost,
  buildTransactionPoolerUrl,
  isTransactionPoolerUrl,
} from "./database.mjs";
import { getEnvStatus } from "./env-config.mjs";

const URL_VARS = [
  "DATABASE_URL",
  "SUPABASE_DB_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
];

const PASSWORD_VARS = [
  "SUPABASE_DB_PASSWORD",
  "POSTGRES_PASSWORD",
  "PGPASSWORD",
  "DB_PASSWORD",
];

const COMPONENT_VARS = ["POSTGRES_HOST", "POSTGRES_USER", "POSTGRES_PORT", "POSTGRES_DATABASE", "PGHOST", "PGUSER", "PGPORT", "PGDATABASE"];

function pickEnv(key) {
  return String(process.env[key] || "").trim();
}

function describeUrlVar(key) {
  const raw = pickEnv(key);
  if (!raw) return { key, set: false };
  const parsed = parsePostgresUrl(raw);
  return {
    key,
    set: true,
    redacted: redactDatabaseUrl(raw),
    host: parsed?.host || null,
    port: parsed?.port || null,
    user: parsed?.user ? parsed.user.replace(/^(postgres\.)(.+)$/, "$1***") : null,
    isPooler: parsed?.isPoolerHost || false,
    isDirectHost: parsed?.isDirectSupabaseHost || false,
    isTransactionPooler: isTransactionPoolerUrl(raw),
    hasPasswordInUrl: Boolean(parsed?.password),
  };
}

function detectConflicts(entries) {
  const set = entries.filter((e) => e.set);
  const issues = [];
  const hosts = new Set(set.map((e) => e.host).filter(Boolean));
  const users = new Set(set.map((e) => e.user).filter(Boolean));
  if (hosts.size > 1) {
    issues.push({
      type: "host_mismatch",
      message: `Multiple pooler/direct hosts across env vars: ${[...hosts].join(", ")}`,
      fix: "Keep only DATABASE_URL — remove duplicate POSTGRES_* URL vars on Vercel",
    });
  }
  if (users.size > 1) {
    issues.push({
      type: "user_mismatch",
      message: `Different DB users configured — Supabase pooler requires postgres.[project-ref]`,
      fix: "Use postgresql://postgres.[ref]:[password]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
    });
  }
  const nonPooler = set.filter((e) => e.isDirectHost || (e.port && e.port !== 6543));
  if (nonPooler.length) {
    issues.push({
      type: "non_pooler_url",
      vars: nonPooler.map((e) => e.key),
      message: "POSTGRES_URL_NON_POOLING or direct db.*.supabase.co URLs fail on Vercel serverless (IPv6)",
      fix: "Remove POSTGRES_URL_NON_POOLING; set DATABASE_URL to Transaction Pooler port 6543",
    });
  }
  const barePostgres = set.filter((e) => e.user === "postgres");
  if (barePostgres.length) {
    issues.push({
      type: "wrong_username",
      vars: barePostgres.map((e) => e.key),
      message: 'Username "postgres" without project ref — pooler expects postgres.[ref]',
      fix: "Update to postgres.ngmvmlulzacrlicuagyp or let DATABASE_URL normalizer rewrite on deploy",
    });
  }
  return issues;
}

/** Which env var resolveDatabaseUrl() actually reads (first non-empty in priority order). */
export function getActiveDatabaseEnvVar() {
  for (const key of URL_VARS) {
    if (pickEnv(key)) return key;
  }
  if (pickEnv("POSTGRES_HOST") && pickEnv("POSTGRES_PASSWORD")) return "POSTGRES_* components";
  return null;
}

export async function auditDatabaseConnection(options = {}) {
  const ref = getProjectRef();
  const urlEntries = URL_VARS.map(describeUrlVar);
  const passwordEntries = PASSWORD_VARS.map((key) => ({ key, set: Boolean(pickEnv(key)) }));
  const componentEntries = COMPONENT_VARS.map((key) => ({ key, set: Boolean(pickEnv(key)) }));
  const activeVar = getActiveDatabaseEnvVar();
  const resolved = resolveDatabaseUrl();
  const urlConfig = describeDatabaseUrlConfig();
  const conflicts = detectConflicts(urlEntries);
  const expectedCanonical = ref && pickEnv("POSTGRES_PASSWORD")
    ? redactDatabaseUrl(buildTransactionPoolerUrl(ref, pickEnv("POSTGRES_PASSWORD")))
    : resolved.urlRedacted;

  let connection = null;
  if (options.testConnection !== false) {
    connection = await testDatabaseConnection();
  }

  const akeUses = {
    module: "auto-knowledge-engine/orchestrator.mjs",
    path: "Supabase REST (service role) for data; PostgreSQL via resolveDatabaseUrl() for migrations/RPC",
    activeEnvVar: activeVar,
    connectionSource: resolved.source,
    note: "AKE cron does NOT use a separate DB URL — same DATABASE_URL as all server-side pg clients",
  };

  return {
    ok: connection ? connection.ok : Boolean(resolved.url),
    at: new Date().toISOString(),
    projectRef: ref || null,
    expectedPoolerHost: getPoolerHost(),
    expectedPoolerPort: 6543,
    expectedUser: ref ? `postgres.${ref}` : "postgres.[ref]",
    activeEnvVar: activeVar,
    resolved: {
      source: resolved.source,
      urlRedacted: resolved.urlRedacted,
      normalized: resolved.normalized,
      normalizeReason: resolved.normalizeReason,
    },
    urlVariables: urlEntries,
    passwordVariables: passwordEntries,
    componentVariables: componentEntries,
    urlConfig,
    conflicts,
    expectedCanonical,
    autoKnowledgeEngine: akeUses,
    connection,
    recommendations: buildRecommendations({ activeVar, urlConfig, conflicts, connection, ref }),
  };
}

function buildRecommendations(ctx) {
  const recs = [];
  if (!ctx.activeVar) {
    recs.push({
      priority: "critical",
      action: "Set DATABASE_URL on Vercel Production",
      detail: `postgresql://postgres.${ctx.ref || "[ref]"}:[password]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres`,
    });
  }
  if (ctx.conflicts.some((c) => c.type === "wrong_username")) {
    recs.push({
      priority: "critical",
      action: "Fix username format in active DATABASE_URL",
      detail: 'Replace user "postgres" with postgres.ngmvmlulzacrlicuagyp',
    });
  }
  if (ctx.conflicts.some((c) => c.type === "non_pooler_url")) {
    recs.push({
      priority: "high",
      action: "Remove POSTGRES_URL_NON_POOLING from Vercel",
      detail: "Serverless requires Transaction Pooler (port 6543)",
    });
  }
  if (ctx.urlConfig?.hasPlaceholderPassword) {
    recs.push({
      priority: "critical",
      action: "Replace placeholder password in DATABASE_URL",
      detail: "Supabase Dashboard → Project Settings → Database → Database password",
    });
  }
  if (ctx.connection && !ctx.connection.ok) {
    const err = ctx.connection.error || "";
    recs.push({
      priority: "critical",
      action: "Update database password in DATABASE_URL",
      detail: err.includes("password authentication failed")
        ? "Password mismatch — reset in Supabase Dashboard → Database → Reset password, then update Vercel DATABASE_URL and redeploy"
        : err,
    });
  }
  if (URL_VARS.slice(1).some((k) => pickEnv(k)) && ctx.activeVar === "DATABASE_URL") {
    recs.push({
      priority: "low",
      action: "Remove redundant POSTGRES_URL / POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING",
      detail: "Only DATABASE_URL is used (first priority) — duplicates cause confusion",
    });
  }
  return recs;
}

export default auditDatabaseConnection;
