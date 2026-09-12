/**
 * Thin wrappers around inventory + Path-C enrichment (safe).
 */
export { runFullInventory, summarizeInventory, loadSectionCatalog } from "./inventory.mjs";
export {
  detectTechnicalIssues,
  stripLeadingSpaceDuplicates,
  findLeadingSpaceDuplicateLines,
  classifyEnrichmentAction,
  contentHash,
} from "./enrichment-audit.mjs";

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUNNER = join(__dirname, "../../scripts/content-ops/run-enrichment-cycle.mjs");

/** Execute the canonical enrichment runner (Path-C only). */
export function runEnrichmentCycle({ dryRun = false } = {}) {
  const args = [RUNNER];
  if (dryRun) args.push("--dry-run");
  const r = spawnSync(process.execPath, args, {
    encoding: "utf8",
    cwd: join(__dirname, "../.."),
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "enrichment_cycle_failed");
  }
  return { ok: true, stdout: r.stdout };
}
