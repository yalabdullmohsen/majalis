import { resolveContentType, TYPE_REGISTRY } from "./registry.mjs";
import { validateRow } from "./validators.mjs";
import { parseContentFile, parseContentString } from "./parsers.mjs";
import { dedupeRows } from "./dedupe.mjs";
import { mapRowToPayload } from "./mappers.mjs";
import { importToSupabase, getSupabaseAdmin } from "./supabase-importer.mjs";
import { importToStaged } from "./staged.mjs";

/**
 * @param {{ rootDir: string, type: string, filePath: string, dryRun?: boolean }} opts
 */
export async function runContentImport(opts) {
  let rows;
  try {
    rows = parseContentFile(opts.filePath);
  } catch (err) {
    return {
      ok: false,
      type: opts.type,
      errors: [`تعذر قراءة الملف: ${err.message}`],
    };
  }
  return runContentImportRows({ ...opts, rows });
}

/**
 * @param {{ rootDir: string, type: string, rows: Record<string, unknown>[], dryRun?: boolean, source?: string }} opts
 */
export async function runContentImportRows(opts) {
  const def = resolveContentType(opts.type);
  if (!def) {
    return {
      ok: false,
      type: opts.type,
      errors: [`نوع محتوى غير مدعوم: ${opts.type}`, `الأنواع المتاحة: ${Object.keys(TYPE_REGISTRY).join(", ")}`],
    };
  }

  const started = Date.now();
  const rows = opts.rows || [];

  const validationErrors = [];
  const validRows = [];
  rows.forEach((row, index) => {
    const result = validateRow(def.type, row, index);
    if (result.ok) validRows.push(row);
    else validationErrors.push(...result.errors);
  });

  const { unique, duplicates } = dedupeRows(validRows, def.type);
  const payloads = unique.map((row) => mapRowToPayload(def.type, row));

  let importReport;
  if (def.target === "staged") {
    importReport = importToStaged(opts.rootDir, def.type, payloads, { dryRun: opts.dryRun });
  } else {
    const admin = getSupabaseAdmin();
    importReport = await importToSupabase(admin, def.type, payloads, { dryRun: opts.dryRun });
  }

  const ok =
    validationErrors.length === 0 &&
    (importReport.failed ?? 0) === 0 &&
    (importReport.errors?.length ?? 0) === 0;

  return {
    ok,
    type: def.type,
    label: def.label,
    target: def.target,
    dryRun: Boolean(opts.dryRun),
    file: opts.source || opts.filePath || "inline",
    duration_ms: Date.now() - started,
    stats: {
      read: rows.length,
      valid: validRows.length,
      invalid: rows.length - validRows.length,
      duplicates_in_file: duplicates.length,
      imported: importReport.imported ?? importReport.added ?? 0,
      skipped: importReport.skipped ?? 0,
      failed: importReport.failed ?? 0,
      total_staged: importReport.total ?? null,
    },
    validationErrors,
    importErrors: importReport.errors || [],
    stagedPath: importReport.stagedPath || null,
  };
}

/** @deprecated use runContentImportRows — kept for API string uploads */
export async function runContentImportFromString(opts) {
  let rows;
  try {
    rows = parseContentString(opts.content, opts.filename || "upload.json");
  } catch (err) {
    return {
      ok: false,
      type: opts.type,
      errors: [`تعذر تحليل المحتوى: ${err.message}`],
    };
  }
  return runContentImportRows({
    rootDir: opts.rootDir,
    type: opts.type,
    rows,
    dryRun: opts.dryRun,
    source: opts.filename,
  });
}

export function printImportReport(report) {
  console.log("\n══════════════════════════════════════════");
  console.log(`  Content Import — ${report.label || report.type}`);
  console.log("══════════════════════════════════════════");
  console.log(`الملف: ${report.file}`);
  console.log(`الهدف: ${report.target}${report.dryRun ? " (dry-run)" : ""}`);
  console.log(`مدة التنفيذ: ${report.duration_ms}ms`);
  console.log("──────────────────────────────────────────");
  console.log(`قرئ: ${report.stats.read}`);
  console.log(`صالح: ${report.stats.valid}`);
  console.log(`مرفوض (تحقق): ${report.stats.invalid}`);
  console.log(`مكرر في الملف: ${report.stats.duplicates_in_file}`);
  console.log(`استورد: ${report.stats.imported}`);
  console.log(`تخطى (موجود): ${report.stats.skipped}`);
  console.log(`فشل: ${report.stats.failed}`);
  if (report.stagedPath) console.log(`ملف staged: ${report.stagedPath}`);
  if (report.validationErrors.length) {
    console.log("\n⚠ أخطاء التحقق:");
    report.validationErrors.forEach((e) => console.log(`  • ${e}`));
  }
  if (report.importErrors.length) {
    console.log("\n⚠ أخطاء الاستيراد:");
    report.importErrors.forEach((e) => console.log(`  • ${e}`));
  }
  console.log(`\n${report.ok ? "✓ نجح الاستيراد" : "✗ اكتمل مع أخطاء"}\n`);
}
