/**
 * GET/POST /api/cron/autonomous-platform* — enqueue only (202).
 * Path suffix selects job_type when recovery; otherwise autonomous-platform.
 */
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

const recovery = createEnqueueCronHandler("autonomous-platform-recovery");
const general = createEnqueueCronHandler("autonomous-platform");

export default async function handler(req, res) {
  const url = String(req.url || req.path || "");
  if (url.includes("autonomous-platform-recovery")) {
    return recovery(req, res);
  }
  return general(req, res);
}
