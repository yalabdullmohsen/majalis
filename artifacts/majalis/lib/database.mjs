/**
 * Unified database connection — single source for DATABASE_URL resolution.
 * Supports: pg, drizzle (lib/db), Supabase migrations, cron bootstrap.
 *
 * Supabase direct hosts (db.{ref}.supabase.co) are IPv6-only; Vercel serverless
 * is IPv4-only and fails with ENOTFOUND. Pooler URLs (Supavisor) use IPv4.
 */

import { getEnvConfig } from "./env-config.mjs";

const POOLER_PREFIXES = ["aws-1", "aws-0"];
const POOLER_REGIONS = [
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-south-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "eu-central-2",
  "eu-north-1",
  "sa-east-1",
  "ca-central-1",
  "me-central-1",
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

/** Parse postgres URL into components (password, ref, host). */
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
      port: u.port || "5432",
      database: u.pathname.replace(/^\//, "") || "postgres",
      ref: dbRefFromHost || dbRefFromUser || getProjectRef(),
      isDirectSupabaseHost: /^db\.[^.]+\.supabase\.co$/.test(host),
    };
  } catch {
    return null;
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

/** Build Supavisor pooler URLs from project ref + password. */
function buildPoolerUrls(ref, password) {
  if (!ref || !password) return [];
  const enc = encodeURIComponent(password);
  const urls = [];
  for (const prefix of POOLER_PREFIXES) {
    for (const region of POOLER_REGIONS) {
      for (const port of [6543, 5432]) {
        urls.push({
          url: `postgresql://postgres.${ref}:${enc}@${prefix}-${region}.pooler.supabase.com:${port}/postgres`,
          source: `pooler_${prefix}_${region}_${port}`,
        });
        urls.push({
          url: `postgresql://postgres:${enc}@${prefix}-${region}.pooler.supabase.com:${port}/postgres?options=reference%3D${ref}`,
          source: `pooler_options_${prefix}_${region}_${port}`,
        });
      }
    }
  }
  return urls;
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
  const seen = new Set();
  const candidates = [];

  function add(url, source) {
    if (!url || seen.has(url)) return;
    seen.add(url);
    candidates.push({ url, source });
  }

  const resolved = resolveDatabaseUrl();
  const parsed = parsePostgresUrl(resolved.url);
  const ref = parsed?.ref || getProjectRef();
  const password =
    parsed?.password ||
    pick("POSTGRES_PASSWORD", "PGPASSWORD", "SUPABASE_DB_PASSWORD", "DB_PASSWORD");

  // Prefer IPv4 pooler before direct IPv6-only Supabase host (Vercel / IPv4-only networks).
  if (ref && password) {
    for (const { url, source } of buildPoolerUrls(ref, password)) {
      add(url, source);
    }
  }

  if (resolved.url) {
    if (parsed?.isDirectSupabaseHost) {
      add(resolved.url, `${resolved.source}_ipv6_direct`);
    } else {
      add(resolved.url, resolved.source);
    }
  }

  if (ref && password) {
    add(buildDirectUrl(ref, password), "direct_db_host");
  }

  return candidates;
}

let _pool = null;

export async function getPgPool() {
  const candidates = listCandidateDatabaseUrls();
  const url = candidates[0]?.url;
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

  throw new Error(`All database connection attempts failed: ${JSON.stringify(errors.slice(0, 5))}`);
}

export async function testDatabaseConnection() {
  const started = Date.now();
  const dbResolved = resolveDatabaseUrl();
  let clientInfo;

  try {
    clientInfo = await getPgClient();
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      durationMs: Date.now() - started,
      databaseUrlExists: Boolean(dbResolved.url),
      databaseUrlSource: dbResolved.source,
      candidatesTried: listCandidateDatabaseUrls().length,
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
      databaseUrlExists: Boolean(dbResolved.url),
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
      databaseUrlExists: Boolean(dbResolved.url),
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
