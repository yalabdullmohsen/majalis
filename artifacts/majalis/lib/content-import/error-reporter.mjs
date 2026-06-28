/**
 * Smart error reporting for import operations.
 */

/**
 * @typedef {{
 *   line: number;
 *   field: string;
 *   fieldLabel?: string;
 *   value?: unknown;
 *   reason: string;
 *   suggestion: string;
 *   message: string;
 *   errorType?: string;
 * }} StructuredImportError
 */

/**
 * @param {object} opts
 */
export function formatValidationError(opts) {
  const fieldLabel = opts.fieldLabel || opts.field;
  const valueStr =
    opts.value == null || opts.value === ""
      ? "فارغة"
      : String(opts.value).slice(0, 120);

  const message = [
    `السطر ${opts.line}`,
    `الحقل: ${fieldLabel}`,
    `القيمة: ${valueStr}`,
    `السبب: ${opts.reason}`,
    `الحل: ${opts.suggestion}`,
  ].join("\n");

  return {
    line: opts.line,
    field: opts.field,
    fieldLabel,
    value: opts.value,
    reason: opts.reason,
    suggestion: opts.suggestion,
    message,
    errorType: opts.errorType || "validation",
  };
}

/**
 * @param {object} opts
 */
export function formatImportSummary(opts) {
  const stats = opts.stats || {};
  return {
    ok: Boolean(opts.ok),
    jobId: opts.jobId || null,
    contentType: opts.contentType || null,
    targetTable: opts.targetTable || null,
    totalRows: stats.read ?? stats.totalRows ?? 0,
    imported: stats.imported ?? 0,
    skipped: stats.skipped ?? 0,
    duplicates: stats.duplicates_in_file ?? stats.duplicates ?? 0,
    rejected: stats.invalid ?? stats.rejected ?? 0,
    failed: stats.failed ?? 0,
    executionTimeMs: opts.durationMs ?? opts.timings?.total_ms ?? 0,
    warnings: opts.warnings || [],
    validationErrors: opts.validationErrors || [],
    importErrors: opts.importErrors || [],
    structuredErrors: opts.structuredErrors || [],
    timings: opts.timings || null,
  };
}
