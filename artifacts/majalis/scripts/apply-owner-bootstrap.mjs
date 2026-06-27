#!/usr/bin/env node
/**
 * Apply owner_bootstrap_v1.sql only.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPgClient } from "../lib/database.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "../supabase/owner_bootstrap_v1.sql");

async function main() {
  const client = await getPgClient();
  if (!client) {
    console.error("No DATABASE_URL / Postgres connection available.");
    process.exit(1);
  }

  const sql = readFileSync(sqlPath, "utf8");
  await client.query(sql);
  await client.end();
  console.log(JSON.stringify({ ok: true, file: "owner_bootstrap_v1.sql" }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
