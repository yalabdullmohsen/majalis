/**
 * GET/POST /api/cron/sync-fiqh-council — enqueue only (202). Work runs via /api/cron/job-worker.
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("sync-fiqh-council");
