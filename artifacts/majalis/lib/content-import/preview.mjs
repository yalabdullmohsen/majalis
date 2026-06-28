/**
 * Import preview — analyze file before starting background job.
 */

import { parseUniversalFile } from "./universal-csv-parser.mjs";
import { applyColumnAliases, mapDetectedColumns, findMissingRequiredFields } from "./column-aliases.mjs";
import { getContentSchema } from "./schema-loader.mjs";
import { validateAllRowsWithSchema } from "./schema-validator.mjs";
import { dedupeRows } from "./dedupe.mjs";
import { resolveContentType } from "./registry.mjs";
import { resolveImportBatchSize } from "./batch-size.mjs";

export function buildImportPreview(opts) {
  const def = resolveContentType(opts.type);
  if (!def) {
    return { ok: false, canImport: false, error: `نوع محتوى غير مدعوم: ${opts.type}` };
  }

  const schema = getContentSchema(def.type);
  let parsed;
  try {
    parsed = parseUniversalFile(opts.content, opts.filename || "upload.csv");
  } catch (err) {
    return { ok: false, canImport: false, error: `تعذر قراءة الملف: ${err.message}` };
  }

  const rawRows = parsed.rows || [];
  const rows = rawRows.map((r) => applyColumnAliases(def.type, r));
  const { validRows, validationErrors, structuredErrors, allValid } = validateAllRowsWithSchema(def.type, rows);
  const { unique, duplicates } = dedupeRows(validRows, def.type);
  const missingFields = findMissingRequiredFields(def.type, parsed.headers || [], schema);
  const batchSize = resolveImportBatchSize(rows.length);
  const rejected = rows.length - validRows.length;
  const canImport = allValid && rows.length > 0 && missingFields.length === 0;

  return {
    ok: true,
    canImport,
    contentType: def.type,
    label: def.label,
    targetTable: def.table || schema?.table,
    format: parsed.format,
    encoding: parsed.encodingLabel,
    delimiter: parsed.delimiterLabel,
    detectedColumns: mapDetectedColumns(def.type, parsed.headers || []),
    missingRequiredFields: missingFields,
    stats: {
      totalRows: rows.length,
      validRows: validRows.length,
      rejectedRows: rejected,
      duplicateRows: duplicates.length,
      importableRows: unique.length,
    },
    batchSize,
    estimatedBatches: batchSize ? Math.ceil(unique.length / batchSize) : 0,
    validationErrors: validationErrors.slice(0, 50),
    structuredErrors: structuredErrors.slice(0, 50),
    sampleRows: rows.slice(0, 3),
    warnings: missingFields.length
      ? [`أعمدة مطلوبة ناقصة: ${missingFields.join("، ")}`]
      : rejected > 0
        ? [`${rejected} صف مرفوض — أصلح الأخطاء قبل الاستيراد`]
        : [],
  };
}
