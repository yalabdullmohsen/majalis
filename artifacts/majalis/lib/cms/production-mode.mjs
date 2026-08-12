/** Server-side production content mode (mirrors src/lib/cms/production-config.ts). */

export function isProductionContentMode() {
  const flag =
    process.env.MAJALIS_PRODUCTION_CONTENT === "1" ||
    process.env.MAJALIS_PRODUCTION_CONTENT === "true" ||
    process.env.VITE_MAJALIS_PRODUCTION_CONTENT === "1" ||
    process.env.VITE_MAJALIS_PRODUCTION_CONTENT === "true";
  if (flag) return true;
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) return false;
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export function allowSeedFallback() {
  return !isProductionContentMode();
}
