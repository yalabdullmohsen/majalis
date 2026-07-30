/**
 * GET/POST /api/cron/content-scheduler — enqueue only (202).
 * Default scheduler job = source-check; override via ?job=
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

export default createEnqueueCronHandler("content-scheduler", {
  resolveMetadata: (req) => ({
    job: req.query?.job || req.body?.job || "source-check",
  }),
});
