/**
 * GET/POST /api/cron/auto-content-sync — enqueue only (202). Work runs via /api/cron/job-worker.
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("auto-content-sync");
