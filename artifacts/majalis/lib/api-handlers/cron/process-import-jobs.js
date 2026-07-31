/**
 * Process-import-jobs cron — enqueue only (202). Work via /api/cron/job-worker.
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("process-import-jobs");
