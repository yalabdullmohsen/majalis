/**
 * GET/POST /api/cron/content-scheduler — enqueue only (202). Work runs via /api/cron/job-worker.
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("content-scheduler");
