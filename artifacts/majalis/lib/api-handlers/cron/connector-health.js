/**
 * connector-health cron — enqueue only (202).
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("connector-health");
