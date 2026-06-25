#!/usr/bin/env node
/**
 * Print the canonical Supabase Transaction Pooler DATABASE_URL for Vercel.
 * Usage: DATABASE_URL='postgresql://...' node scripts/print-pooler-database-url.mjs
 */

import { buildTransactionPoolerUrl, describeDatabaseUrlConfig, normalizeToTransactionPooler } from "../lib/database.mjs";

const config = describeDatabaseUrlConfig();
const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

if (!raw) {
  console.error("Set DATABASE_URL (any Supabase format) to generate the Transaction Pooler URL.");
  process.exit(1);
}

const normalized = normalizeToTransactionPooler(raw);
console.log(JSON.stringify({
  current: {
    host: config.rawHost,
    port: config.rawPort,
    isTransactionPooler: config.rawIsTransactionPooler,
    needsVercelUpdate: config.needsVercelUpdate,
  },
  vercelDatabaseUrl: normalized.url.replace(/:([^:@/]+)@/, ":***@"),
  instruction: "Set this exact Transaction Pooler URL as DATABASE_URL in Vercel Project Settings > Environment Variables",
  expectedHost: config.expectedPoolerHost,
  expectedPort: config.expectedPoolerPort,
}, null, 2));

if (normalized.url && !normalized.url.includes("***")) {
  console.error("\nFull URL (contains password — copy to Vercel only):");
  console.error(normalized.url);
}
