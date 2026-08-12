/**
 * Guard services from starting without required secrets.
 */

import { getEnvStatus } from "./env-config.mjs";

const SERVICE_REQUIREMENTS = {
  assistant: ["ANTHROPIC_API_KEY"],
  cron: ["CRON_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_URL"],
  migrations: ["DATABASE_URL", "POSTGRES_URL", "SUPABASE_ACCESS_TOKEN", "SUPABASE_SERVICE_ROLE_KEY"],
  mke: ["SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"],
  instagram: [
    "INSTAGRAM_GRAPH_ACCESS_TOKEN",
    "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  ],
  autoContent: ["SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET"],
};

export function checkServiceSecrets(serviceName) {
  const keys = SERVICE_REQUIREMENTS[serviceName] || [];
  const env = getEnvStatus();
  const missing = keys.filter((k) => !env[k]);
  const satisfied = keys.some((k) => env[k]);
  return {
    ok: missing.length === 0 || (serviceName === "migrations" && satisfied),
    missing,
    service: serviceName,
  };
}

export function assertServiceSecrets(serviceName) {
  const r = checkServiceSecrets(serviceName);
  if (!r.ok) {
    throw new Error(`[service-guard:${serviceName}] missing: ${r.missing.join(", ")}`);
  }
  return r;
}

export { SERVICE_REQUIREMENTS };
