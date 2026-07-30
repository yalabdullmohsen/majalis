/**
 * GET/POST /api/cron/lesson-source-monitor — enqueue only (202).
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("lesson-source-monitor");
