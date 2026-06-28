#!/usr/bin/env node
/**
 * Verify AKE RPC functions exist and are callable.
 * Usage: node scripts/verify-ake-rpc.mjs [--repair]
 */
import { getAkeRpcHealth, ensureAkeRpcFunctions } from "../lib/auto-knowledge-engine/rpc-probe.mjs";

const repair = process.argv.includes("--repair");

console.log("=== AKE RPC Verification ===\n");

let health;
if (repair) {
  const result = await ensureAkeRpcFunctions({ force: true });
  health = result.health || (await getAkeRpcHealth());
  console.log("Repair:", result.ok ? "OK" : "FAILED", result.error || "");
} else {
  health = await getAkeRpcHealth();
}

for (const fn of health.functions || []) {
  const grants = fn.grants
    ? `grants(anon=${fn.grants.anon}, auth=${fn.grants.authenticated}, svc=${fn.grants.service_role})`
    : "";
  console.log(`  ${fn.name}: ${fn.exists ? "EXISTS" : "MISSING"} ${grants}`);
}

console.log(`\nake_engine_stats callable via API: ${health.engineStatsCallable ? "YES" : "NO"}`);
console.log(`Overall: ${health.ok ? "PASS" : "FAIL"}`);

if (health.missingRequired?.length) {
  console.log(`Missing: ${health.missingRequired.join(", ")}`);
  console.log("Fix: pnpm run repair:ake-rpc  OR  curl apply-migrations?scope=ake-rpc");
}

process.exit(health.ok ? 0 : 1);
