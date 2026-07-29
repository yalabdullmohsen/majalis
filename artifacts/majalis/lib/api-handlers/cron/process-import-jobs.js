/**
 * GET/POST /api/cron/process-import-jobs — enqueue only (202). Work runs via /api/cron/job-worker.
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("process-import-jobs");
