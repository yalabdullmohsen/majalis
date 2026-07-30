/**
 * GET/POST /api/cron/source-monitor — enqueue only (202).
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("source-monitor");
