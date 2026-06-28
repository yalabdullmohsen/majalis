/**
 * Structured import API errors — always return actionable messages to the admin UI.
 */

import { resolveContentType } from "./registry.mjs";

const ERROR_MESSAGES_AR = {
  unsupported_type: "نوع المحتوى غير مدعوم",
  missing_type: "نوع المحتوى مطلوب",
  missing_job_id: "معرّف المهمة مطلوب",
  missing_job_or_rows: "معرّف المهمة والصفوف مطلوبان",
  job_not_found: "مهمة الاستيراد غير موجودة",
  job_failed: "مهمة الاستيراد فشلت سابقاً — أنشئ مهمة جديدة",
  job_closed: "مهمة الاستيراد مغلقة — أنشئ مهمة جديدة",
  empty_job: "لا توجد صفوف للاستيراد — تأكد من رفع الملف قبل commit",
  schema_not_ready: "جداول الاستيراد غير جاهزة — طبّق migration content_import_jobs_v1",
  permission_denied: "ليس لديك صلاحية استيراد المحتوى",
  unauthorized: "انتهت الجلسة — سجّل الدخول مجدداً",
  stage_failed: "فشل رفع دفعة البيانات إلى staging",
  job_create_failed: "تعذّر إنشاء مهمة الاستيراد في قاعدة البيانات",
  validation_failed: "بعض الصفوف تحتاج مراجعة — تم استيراد الصفوف الصالحة",
  import_failed: "فشل إدراج البيانات في الجدول الهدف",
};

/**
 * @param {object} opts
 * @param {string} opts.code
 * @param {string} [opts.detail]
 * @param {string} [opts.failedAt]
 * @param {string} [opts.contentType]
 * @param {string} [opts.targetTable]
 * @param {object} [opts.report]
 * @param {string} [opts.error]
 */
export function buildImportApiError(opts) {
  const code = opts.code || "import_failed";
  const typeDef = opts.contentType ? resolveContentType(opts.contentType) : null;
  const normalizedType = typeDef?.type || opts.contentType || null;
  const targetTable = opts.targetTable || typeDef?.table || null;

  const validationMsg =
    opts.report?.validationErrors?.[0] ||
    opts.report?.validation_errors?.[0] ||
    null;
  const importMsg =
    opts.report?.importErrors?.[0] ||
    opts.report?.import_errors?.[0] ||
    null;

  const baseAr = ERROR_MESSAGES_AR[code] || opts.error || code;
  const parts = [baseAr];
  if (validationMsg) parts.push(validationMsg);
  else if (importMsg) parts.push(importMsg);
  else if (opts.detail) parts.push(String(opts.detail));
  else if (opts.error && opts.error !== code) parts.push(String(opts.error));

  if (targetTable) parts.push(`الجدول: ${targetTable}`);
  if (normalizedType) parts.push(`النوع: ${normalizedType}`);

  return {
    ok: false,
    code,
    error: parts.join(" — "),
    detail: opts.detail || validationMsg || importMsg || opts.error || null,
    failedAt: opts.failedAt || null,
    contentType: opts.contentType || null,
    normalizedType,
    targetTable,
    validationErrors: opts.report?.validationErrors || opts.report?.validation_errors || [],
    importErrors: opts.report?.importErrors || opts.report?.import_errors || [],
  };
}

/**
 * @param {Response} res
 * @param {unknown} json
 * @param {string} fallback
 */
export function formatImportClientError(res, json, fallback) {
  const body = json && typeof json === "object" ? json : {};
  const report = body.report && typeof body.report === "object" ? body.report : {};

  const validationMsg =
    body.validationErrors?.[0] ||
    report.validationErrors?.[0] ||
    body.validation_errors?.[0] ||
    report.validation_errors?.[0] ||
    null;
  const importMsg =
    body.importErrors?.[0] ||
    report.importErrors?.[0] ||
    body.import_errors?.[0] ||
    report.import_errors?.[0] ||
    null;

  const detail =
    body.userMessageAr ||
    body.error ||
    body.detail ||
    validationMsg ||
    importMsg ||
    body.message ||
    null;

  if (detail) {
    const prefix = res?.status && !res.ok ? `[HTTP ${res.status}] ` : "";
    return `${prefix}${detail}`;
  }

  if (res && !res.ok) {
    return `[HTTP ${res.status}] ${fallback}`;
  }

  return fallback;
}
