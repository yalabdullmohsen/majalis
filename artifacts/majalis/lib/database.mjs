/**
 * Unified database connection — single source for DATABASE_URL resolution.
 * Supports: pg, drizzle (lib/db), Supabase migrations, cron bootstrap.
 */

import { getEnvConfig } from "./env-config.mjs";

const POOLER_REGIONS = [
  "us-east-1",
  "us-west-1",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
  "ap-northeast-1",
  "sa-east-1",
];

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

/** Build DATABASE_URL from POSTGRES_* component env vars (Vercel Supabase integration). */
function buildFromPostgresComponents() {
  const host = pick("POSTGRES_HOST", "PGHOST");
  const user = pick("POSTGRES_USER", "PGUSER");
  const password = pick("POSTGRES_PASSWORD", "PGPASSWORD", "SUPABASE_DB_PASSWORD", "DB_PASSWORD");
  const database = pick("POSTGRES_DATABASE", "PGDATABASE") || "postgres";
  const port = pick("POSTGRES_PORT", "PGPORT") || "5432";

  if (host && user && password) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
  }
  return "";
}

/** Build pooler URL from project ref + password. */
function buildPoolerUrls(ref, password) {
  if (!ref || !password) return [];
  const enc = encodeURIComponent(password);
  return POOLER_REGIONS.flatMap((region) => [
    `postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:6543/postgres?sslmode=require`,
    `postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:5432/postgres?sslmode=require`,
  ]);
}

/** Build direct connection URL. */
function buildDirectUrl(ref, password) {
  if (!ref || !password) return "";
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres?sslmode=require`;
}

export function resolveDatabaseUrl() {
  const direct = pick(
    "DATABASE_URL",
    "SUPABASE_DB_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
  );
  if (direct) return { url: direct, source: "direct_env" };

  const fromComponents = buildFromPostgresComponents();
  if (fromComponents) return { url: fromComponents, source: "postgres_components" };

  const { databaseUrl } = getEnvConfig();
  if (databaseUrl) return { url: databaseUrl, source: "env_config" };

  return { url: "", source: "none" };
}

export function listCandidateDatabaseUrls() {
  const ref = getProjectRef();
  const password = pick("POSTGRES_PASSWORD", "PGPASSWORD", "SUPABASE_DB_PASSWORD", "DB_PASSWORD");
  const candidates = [];

  const resolved = resolveDatabaseUrl();
  if (resolved.url) candidates.push(resolved);

  if (ref && password) {
    candidates.push({ url: buildDirectUrl(ref, password), source: "direct_db_host" });
    for (const url of buildPoolerUrls(ref, password)) {
      candidates.push({ url, source: "pooler" });
    }
  }

  return candidates;
}

let _pool = null;

export async function getPgPool() {
  const { url } = resolveDatabaseUrl();
  if (!url) return null;
  if (_pool) return _pool;
  const pg = await import("pg");
  _pool = new pg.default.Pool({
    connectionString: url,
    ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  });
  return _pool;
}

export async function getPgClient() {
  const candidates = listCandidateDatabaseUrls();
  if (candidates.length === 0) {
    throw new Error("DATABASE_URL not configured — set DATABASE_URL or POSTGRES_URL or POSTGRES_PASSWORD on Vercel");
  }

  const pg = await import("pg");
  const errors = [];

  for (const { url, source } of candidates) {
    const client = new pg.default.Client({
      connectionString: url,
      ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 8_000,
    });
    try {
      await client.connect();
      return { client, source, url: url.replace(/:([^:@/]+)@/, ":***@") };
    } catch (err) {
      errors.push({ source, error: err.message });
      await client.end().catch(() => {});
    }
  }

  throw new Error(`All database connection attempts failed: ${JSON.stringify(errors.slice(0, 3))}`);
}

export async function testDatabaseConnection() {
  const started = Date.now();
  const { client, source } = await getPgClient();

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
    return { ok: false, source, error: err.message, durationMs: Date.now() - started };
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
