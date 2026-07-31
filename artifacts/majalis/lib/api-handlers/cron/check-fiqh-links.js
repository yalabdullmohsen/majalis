/**
 * check-fiqh-links cron — enqueue only (202).
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("check-fiqh-links");
