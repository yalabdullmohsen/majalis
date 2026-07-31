/**
 * Select a bounded batch for one train run.
 */
import { MAX_CUMULATIVE_FILES, MAX_PRS_PER_TRAIN } from "./constants.mjs";

/**
 * @param {Array<{ number: number, files?: string[], fileCount?: number }>} sortedEligible
 * @param {{ maxPrs?: number, maxFiles?: number }} [limits]
 */
export function selectBatch(sortedEligible, limits = {}) {
  const maxPrs = limits.maxPrs ?? MAX_PRS_PER_TRAIN;
  const maxFiles = limits.maxFiles ?? MAX_CUMULATIVE_FILES;
  const selected = [];
  const deferred = [];
  let cumulative = 0;

  for (const pr of sortedEligible) {
    const count = pr.fileCount ?? (pr.files?.length ?? 0);
    if (selected.length >= maxPrs) {
      deferred.push({ ...pr, deferReason: `batch_full_max_prs_${maxPrs}` });
      continue;
    }
    if (selected.length > 0 && cumulative + count > maxFiles) {
      deferred.push({ ...pr, deferReason: `batch_full_max_files_${maxFiles}` });
      continue;
    }
    selected.push(pr);
    cumulative += count;
  }

  return { selected, deferred, cumulativeFiles: cumulative };
}
