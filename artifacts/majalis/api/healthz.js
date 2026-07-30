/**
 * Dedicated light Vercel Function for /api/healthz.
 * Avoids loading api/index → api-dispatch → rate-limit for liveness probes.
 */
export { default } from "../lib/api-handlers/healthz.js";
