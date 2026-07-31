/**
 * daily-benefit-rotation cron — enqueue only (202).
 * Slot matching still happens in the worker (cheap no-op when no slot).
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("daily-benefit-rotation");
