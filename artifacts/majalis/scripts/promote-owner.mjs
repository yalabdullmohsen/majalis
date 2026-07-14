#!/usr/bin/env node
/**
 * Promote bootstrap owner account(s) in Supabase.
 * Usage: pnpm --filter @workspace/majalis run promote:owner
 *        pnpm --filter @workspace/majalis run promote:owner -- owner@example.com
 */

import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";
import { promoteAllBootstrapOwners, promoteOwnerByEmail } from "../lib/owner-promotion.mjs";

const emailArg = process.argv[2]?.trim();

async function main() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL required.");
    process.exit(1);
  }

  const result = emailArg
    ? await promoteOwnerByEmail(admin, emailArg)
    : await promoteAllBootstrapOwners(admin);

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
