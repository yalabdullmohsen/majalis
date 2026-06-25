/**
 * Unified database connection — Supabase Transaction Pooler (IPv4) only.
 *
 * Vercel serverless cannot reach Supabase direct hosts (db.{ref}.supabase.co — IPv6-only).
 * DATABASE_URL must use the Transaction Pooler (port 6543, *.pooler.supabase.com).
 */

import { getEnvConfig } from "./env-config.mjs";

/** Supabase Transaction Pooler port (serverless / edge). */
export const TRANSACTION_POOLER_PORT = 6543;

/** Default pooler for project ngmvmlulzacrlicuagyp (ap-northeast-1). Override via SUPABASE_POOLER_HOST. */
const DEFAULT_POOLER_HOST = "aws-1-ap-northeast-1.pooler.supabase.com";

function pick(...keys) {
  for (const k of keys) {
    const v = String(process.env[k] || "").trim();
    if (v) return v;
  }
  return "";
}

export function getProjectRef() {
  const url = getEnvConfig().supabaseUrl;
  if (!url) return "";
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return "";
  }
}

export function getPoolerHost() {
  return pick("SUPABASE_POOLER_HOST", "POSTGRES_HOST") || DEFAULT_POOLER_HOST;
}

/** Parse postgres URL into components. */
export function parsePostgresUrl(urlStr) {
  if (!urlStr) return null;
  try {
    const u = new URL(urlStr);
    const user = decodeURIComponent(u.username || "");
    const password = decodeURIComponent(u.password || "");
    const host = u.hostname;
    const dbRefFromHost = host.match(/^db\.([^.]+)\.supabase\.co$/)?.[1] || "";
    const dbRefFromUser = user.match(/^postgres\.(.+)$/)?.[1] || "";
    return {
      user,
      password,
      host,
      port: Number(u.port || 5432),
      database: u.pathname.replace(/^\//, "") || "postgres",
      ref: dbRefFromHost || dbRefFromUser || getProjectRef(),
      isDirectSupabaseHost: /^db\.[^.]+\.supabase\.co$/.test(host),
      isPoolerHost: host.includes(".pooler.supabase.com"),
    };
  } catch {
    return null;
  }
}

/** True when URL is Supabase Transaction Pooler (port 6543, pooler host, postgres.{ref} user). */
export function isTransactionPoolerUrl(urlStr) {
  const parsed = parsePostgresUrl(urlStr);
  if (!parsed) return false;
  return (
    parsed.isPoolerHost &&
    parsed.port === TRANSACTION_POOLER_PORT &&
    /^postgres\.[^.]+$/.test(parsed.user)
  );
}

/** Build canonical Transaction Pooler connection string. */
export function buildTransactionPoolerUrl(ref, password, options = {}) {
  const host = options.host || getPoolerHost();
  const enc = encodeURIComponent(password);
  return `postgresql://postgres.${ref}:${enc}@${host}:${TRANSACTION_POOLER_PORT}/postgres`;
}

/** Normalize any Supabase DATABASE_URL to Transaction Pooler format. */
export function normalizeToTransactionPooler(urlStr) {
  if (!urlStr) {
    return { url: "", source: "none", normalized: false, reason: "empty" };
  }

  const parsed = parsePostgresUrl(urlStr);
  if (!parsed?.ref || !parsed.password) {
    return { url: urlStr, source: "direct_env", normalized: false, reason: "unparsed" };
  }

  if (isTransactionPoolerUrl(urlStr)) {
    const expectedHost = getPoolerHost();
    if (parsed.host === expectedHost) {
      return { url: urlStr, source: "pooler_env", normalized: false, reason: "already_correct" };
    }
    const url = buildTransactionPoolerUrl(parsed.ref, parsed.password, { host: expectedHost });
    return { url, source: "pooler_env", normalized: true, reason: "host_corrected", fromHost: parsed.host };
  }

  const url = buildTransactionPoolerUrl(parsed.ref, parsed.password);
  return {
    url,
    source: "pooler_normalized",
    normalized: true,
    reason: parsed.isDirectSupabaseHost ? "direct_ipv6_rewritten" : "non_pooler_rewritten",
    fromHost: parsed.host,
    fromPort: parsed.port,
  };
}

/** Describe DATABASE_URL configuration for health checks (no secrets). */
export function describeDatabaseUrlConfig() {
  const raw = pick(
    "DATABASE_URL",
    "SUPABASE_DB_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
  );
  const parsed = parsePostgresUrl(raw);
  const expected = parsed?.ref && parsed?.password
    ? buildTransactionPoolerUrl(parsed.ref, parsed.password)
    : "";
  const resolved = normalizeToTransactionPooler(raw);

  return {
    configured: Boolean(raw),
    rawIsTransactionPooler: isTransactionPoolerUrl(raw),
    rawHost: parsed?.host || null,
    rawPort: parsed?.port || null,
    rawUser: parsed?.user ? parsed.user.replace(/^(postgres\.)(.+)$/, "$1***") : null,
    expectedPoolerHost: getPoolerHost(),
    expectedPoolerPort: TRANSACTION_POOLER_PORT,
    matchesExpectedPooler: Boolean(raw && expected && raw.replace(/:[^:@/]+@/, ":***@") === expected.replace(/:[^:@/]+@/, ":***@")),
    needsVercelUpdate: Boolean(raw && !isTransactionPoolerUrl(raw)),
    normalized: resolved.normalized,
    normalizeReason: resolved.reason || null,
    connectionSource: resolved.source,
  };
}

function pickRawDatabaseUrl() {
  return pick(
    "DATABASE_URL",
    "SUPABASE_DB_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
  );
}

/** Build DATABASE_URL from POSTGRES_* component env vars. */
function buildFromPostgresComponents() {
  const host = pick("POSTGRES_HOST", "PGHOST");
  const user = pick("POSTGRES_USER", "PGUSER");
  const password = pick("POSTGRES_PASSWORD", "PGPASSWORD", "SUPABASE_DB_PASSWORD", "DB_PASSWORD");
  const database = pick("POSTGRES_DATABASE", "PGDATABASE") || "postgres";
  const port = pick("POSTGRES_PORT", "PGPORT") || String(TRANSACTION_POOLER_PORT);

  if (host && user && password) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }
  return "";
}

export function resolveDatabaseUrl() {
  const raw = pickRawDatabaseUrl() || buildFromPostgresComponents();
  if (raw) {
    const normalized = normalizeToTransactionPooler(raw);
    return {
      url: normalized.url,
      source: normalized.source,
      rawConfigured: Boolean(raw),
      normalized: normalized.normalized,
      normalizeReason: normalized.reason,
    };
  }

  const { databaseUrl } = getEnvConfig();
  if (databaseUrl) {
    const normalized = normalizeToTransactionPooler(databaseUrl);
    return {
      url: normalized.url,
      source: normalized.source,
      rawConfigured: true,
      normalized: normalized.normalized,
      normalizeReason: normalized.reason,
    };
  }

  return { url: "", source: "none", rawConfigured: false, normalized: false };
}

let _pool = null;

function pgSsl(url) {
  return url.includes("supabase") ? { rejectUnauthorized: false } : undefined;
}

export async function getPgPool() {
  const { url } = resolveDatabaseUrl();
  if (!url) return null;
  if (_pool) return _pool;
  const pg = await import("pg");
  _pool = new pg.default.Pool({
    connectionString: url,
    ssl: pgSsl(url),
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  });
  return _pool;
}

export async function getPgClient() {
  const { url, source } = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL not configured — set Transaction Pooler URL on Vercel: " +
      "postgresql://postgres.[ref]:[password]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
    );
  }

  const pg = await import("pg");
  const client = new pg.default.Client({
    connectionString: url,
    ssl: pgSsl(url),
    connectionTimeoutMillis: 8_000,
  });

  try {
    await client.connect();
    return { client, source, url: url.replace(/:([^:@/]+)@/, ":***@") };
  } catch (err) {
    await client.end().catch(() => {});
    err.connectionSource = source;
    throw err;
  }
}

export async function testDatabaseConnection() {
  const started = Date.now();
  const dbResolved = resolveDatabaseUrl();
  const urlConfig = describeDatabaseUrlConfig();

  let clientInfo;
  try {
    clientInfo = await getPgClient();
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      stack: err.stack,
      durationMs: Date.now() - started,
      databaseUrlExists: dbResolved.rawConfigured,
      databaseUrlSource: dbResolved.source,
      urlConfig,
    };
  }

  const { client, source } = clientInfo;

  try {
    const { rows: ping } = await client.query("SELECT 1 AS ok");
    const { rows: version } = await client.query("SELECT version()");
    const { rows: tables } = await client.query(`
      SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'
    `);

    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS _db_connection_test (
        id serial PRIMARY KEY,
        tested_at timestamptz DEFAULT now()
      )
    `);
    await client.query("INSERT INTO _db_connection_test DEFAULT VALUES");
    const { rows: inserted } = await client.query("SELECT id FROM _db_connection_test ORDER BY id DESC LIMIT 1");
    await client.query("UPDATE _db_connection_test SET tested_at = now() WHERE id = $1", [inserted[0].id]);
    await client.query("DELETE FROM _db_connection_test WHERE id = $1", [inserted[0].id]);
    await client.query("COMMIT");

    return {
      ok: true,
      source,
      durationMs: Date.now() - started,
      databaseUrlExists: dbResolved.rawConfigured,
      databaseUrlSource: dbResolved.source,
      urlConfig,
      ping: ping[0]?.ok === 1,
      version: String(version[0]?.version || "").slice(0, 60),
      publicTables: tables[0]?.n ?? 0,
      read: true,
      write: true,
      update: true,
      delete: true,
      transaction: true,
    };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      ok: false,
      source,
      error: err.message,
      stack: err.stack,
      durationMs: Date.now() - started,
      databaseUrlExists: dbResolved.rawConfigured,
      urlConfig,
    };
  } finally {
    await client.end().catch(() => {});
  }
}

export async function closePool() {
  if (_pool) {
    await _pool.end().catch(() => {});
    _pool = null;
  }
}
