/**
 * GET/POST /api/cron/import-phase2-trial — enqueue only (202). Work runs via /api/cron/job-worker.
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("import-phase2-trial");
