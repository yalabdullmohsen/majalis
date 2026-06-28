/**
 * Dynamic batch sizes for bulk import performance.
 */

export const BATCH_TIERS = [
  { minRows: 10_000, size: 500 },
  { minRows: 1_000, size: 250 },
  { minRows: 0, size: 100 },
];

export const UPLOAD_BATCH_SIZE = 2000;

export function resolveImportBatchSize(rowCount) {
  for (const tier of BATCH_TIERS) {
    if (rowCount >= tier.minRows) return tier.size;
  }
  return 100;
}

export function resolveUploadBatchSize(rowCount) {
  if (rowCount > 50_000) return 5000;
  if (rowCount > 10_000) return 3000;
  return UPLOAD_BATCH_SIZE;
}
