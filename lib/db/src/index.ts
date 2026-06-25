import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const { Pool } = pg;

function resolveUrl() {
  const keys = [
    "DATABASE_URL",
    "SUPABASE_DB_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
  ];
  for (const k of keys) {
    const v = String(process.env[k] || "").trim();
    if (v) return v;
  }
  const host = process.env.POSTGRES_HOST || process.env.PGHOST;
  const user = process.env.POSTGRES_USER || process.env.PGUSER || "postgres";
  const password = process.env.POSTGRES_PASSWORD || process.env.SUPABASE_DB_PASSWORD;
  const database = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || "postgres";
  const port = process.env.POSTGRES_PORT || process.env.PGPORT || "5432";
  if (host && password) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
  }
  return "";
}

const url = resolveUrl();
if (!url) {
  throw new Error(
    "DATABASE_URL must be set (or POSTGRES_URL / POSTGRES_PASSWORD). Did you forget to provision a database?",
  );
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = url;
}

export const pool = new Pool({
  connectionString: url,
  ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
