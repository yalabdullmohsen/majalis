#!/usr/bin/env node
/**
import "dotenv/config";
 * Run full platform self-bootstrap locally or in CI.
 * Requires DATABASE_URL + SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_*.
 */
import { runPlatformBootstrap, getPlatformBootstrapStatus } from "../lib/platform-bootstrap.mjs";

const action = process.argv[2] || "run";

async function main() {
  if (action === "status") {
    const status = await getPlatformBootstrapStatus();
    console.log(JSON.stringify(status, null, 2));
    process.exit(status.ok ? 0 : 1);
  }

  const result = await runPlatformBootstrap({
    forceMigrations: process.argv.includes("--force"),
    skipProductionTests: process.argv.includes("--skip-tests"),
  });

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
