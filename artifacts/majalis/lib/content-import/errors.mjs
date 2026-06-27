/** Map internal errors to user-facing messages (never expose raw permission_denied). */

const ERROR_MAP = {
  permission_denied: {
    code: "missing_permission",
    message: "Missing database permission.",
    messageAr: "ليس لديك صلاحية استيراد المحتوى. تواصل مع مدير النظام لمنحك دور «مدير محتوى» أو «محرر».",
  },
  forbidden: {
    code: "forbidden",
    message: "Missing database permission.",
    messageAr: "حسابك لا يملك صلاحية الوصول إلى لوحة الاستيراد.",
  },
  unauthorized: {
    code: "unauthorized",
    message: "Session expired or not signed in.",
    messageAr: "انتهت الجلسة — سجّل الدخول مجدداً كمسؤول.",
  },
  missing_type: {
    code: "invalid_request",
    message: "Content type was not specified.",
    messageAr: "لم يُحدَّد نوع المحتوى.",
  },
  supabase_admin_missing: {
    code: "supabase_unavailable",
    message: "Supabase Storage is unavailable.",
    messageAr: "خدمة Supabase غير متاحة — تحقق من SUPABASE_SERVICE_ROLE_KEY على الخادم.",
  },
  invalid_encoding: {
    code: "invalid_encoding",
    message: "CSV encoding is invalid.",
    messageAr: "ترميز الملف غير صالح — استخدم UTF-8.",
  },
  invalid_csv: {
    code: "invalid_csv",
    message: "Invalid CSV structure.",
    messageAr: "بنية ملف CSV غير صالحة.",
  },
  file_too_large: {
    code: "file_too_large",
    message: "The uploaded file exceeds the maximum allowed size.",
    messageAr: "حجم الملف أكبر من الحد المسموح.",
  },
  too_many_rows: {
    code: "too_many_rows",
    message: "The file exceeds the maximum row limit (100,000).",
    messageAr: "عدد الصفوف يتجاوز الحد الأقصى (100,000).",
  },
};

export function mapImportError(err, fallback = "The uploaded file could not be processed.") {
  const key = typeof err === "string" ? err : err?.error || err?.code || err?.message;
  const mapped = ERROR_MAP[key];
  if (mapped) {
    return {
      ok: false,
      error: mapped.code,
      userMessage: mapped.message,
      userMessageAr: mapped.messageAr,
      reason: mapped.message,
    };
  }

  const msg = String(err?.message || err || fallback);
  if (/permission|denied|403/i.test(msg)) {
    return { ok: false, error: "missing_permission", userMessage: "Missing database permission.", userMessageAr: ERROR_MAP.permission_denied.messageAr, reason: msg };
  }
  if (/encoding|utf/i.test(msg)) {
    return { ok: false, error: "invalid_encoding", userMessage: "CSV encoding is invalid.", userMessageAr: ERROR_MAP.invalid_encoding.messageAr, reason: msg };
  }
  if (/csv|column|header/i.test(msg)) {
    return { ok: false, error: "invalid_csv", userMessage: "Invalid CSV structure.", userMessageAr: ERROR_MAP.invalid_csv.messageAr, reason: msg };
  }
  if (/supabase|service.?role|admin/i.test(msg)) {
    return { ok: false, error: "supabase_unavailable", userMessage: "Supabase Storage is unavailable.", userMessageAr: ERROR_MAP.supabase_admin_missing.messageAr, reason: msg };
  }

  return {
    ok: false,
    error: "import_failed",
    userMessage: fallback,
    userMessageAr: "تعذّر معالجة الملف المرفوع.",
    reason: msg,
  };
}

export function apiErrorResponse(err, status = 500) {
  const mapped = mapImportError(err);
  console.error("[content-import]", mapped.reason || err);
  return { status, body: mapped };
}
