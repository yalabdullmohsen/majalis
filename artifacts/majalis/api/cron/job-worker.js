/**
 * Dedicated Vercel Function for /api/cron/job-worker.
 * Separates background claim/run from the mega /api/index cold-start graph.
 */
import "../_deps.mjs";
export { default } from "../../lib/api-handlers/cron/job-worker.js";
