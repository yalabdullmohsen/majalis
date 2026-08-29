/**
 * سياسة الصيانة التلقائية — مصدر الحقيقة لما يُصلح آليًا وما يحتاج مراجعة بشرية.
 */

/** مستويات الخطورة */
export const RISK = Object.freeze({
  SAFE_AUTO: "safe-auto",
  LOW_PR: "low-pr",
  NEEDS_REVIEW: "needs-review",
  NEEDS_CONTENT_REVIEW: "needs-content-review",
  BLOCKED: "blocked",
});

/** تسميات GitHub المرتبطة */
export const LABELS = Object.freeze({
  MAINTENANCE_SAFE: "maintenance-safe",
  SAFE_AUTO_MERGE: "safe:auto-merge",
  NEEDS_CONTENT_REVIEW: "needs-content-review",
  RISKY_MANUAL: "risky:manual-review",
  SECURITY_SAFE: "security-safe",
  BLOCKED_DANGER: "blocked:danger-path",
});

/**
 * مسارات محتوى شرعي/علمي حساس — لا تعديل تلقائي للنص بدون مصدر + تقرير.
 * يُسمح بتقارير والاقتراحات فقط.
 */
export const SHARIA_SENSITIVE_PATH_PATTERNS = Object.freeze([
  /\/quran\//i,
  /\/mushaf/i,
  /\/tafsir/i,
  /\/hadith/i,
  /\/fiqh/i,
  /\/fatwa/i,
  /\/ruling/i,
  /islamic-history/i,
  /\/adhkar/i,
  /\/dua/i,
  /prophet/i,
  /seerah/i,
  /religious/i,
  /sahih/i,
]);

/** إصلاحات ميكانيكية آمنة مسموحة تلقائيًا */
export const SAFE_AUTO_FIX_KINDS = Object.freeze([
  "broken-external-link-meta", // رابط ميت في metadata غير شرعي
  "empty-optional-url",
  "stale-report-timestamp",
  "cache-header-contract",
  "version-check-contract",
  "duplicate-whitespace",
  "orphan-redirect",
  "npm-audit-patch-only", // patch فقط — لا major
]);

/** أنواع تتطلب PR بمراجعة */
export const REVIEW_REQUIRED_KINDS = Object.freeze([
  "sharia-text-change",
  "hadith-correction",
  "fatwa-change",
  "auth-change",
  "rls-policy",
  "dependency-major",
  "workflow-change",
  "supabase-migration",
  "capacitor-native",
  "secret-rotation",
]);

/**
 * @param {string} filePath
 * @returns {boolean}
 */
export function isShariaSensitivePath(filePath) {
  const p = String(filePath || "");
  return SHARIA_SENSITIVE_PATH_PATTERNS.some((re) => re.test(p));
}

/**
 * هل يجوز تطبيق إصلاح تلقائي لهذا النوع والمسار؟
 * @param {{ kind: string, path?: string }} finding
 */
export function canAutoApply(finding) {
  const kind = String(finding?.kind || "");
  if (REVIEW_REQUIRED_KINDS.includes(kind)) return false;
  if (!SAFE_AUTO_FIX_KINDS.includes(kind)) return false;
  if (finding?.path && isShariaSensitivePath(finding.path)) {
    // حتى لو النوع آمن — لا نلمس ملفات شرعية حساسة
    return false;
  }
  return true;
}

/**
 * تصنيف خطورة إيجاد
 * @param {{ kind: string, path?: string, severity?: string }} finding
 */
export function classifyFinding(finding) {
  const kind = String(finding?.kind || "");
  if (REVIEW_REQUIRED_KINDS.includes(kind) || finding?.severity === "critical") {
    if (kind === "sharia-text-change" || kind === "hadith-correction" || kind === "fatwa-change") {
      return RISK.NEEDS_CONTENT_REVIEW;
    }
    if (kind === "dependency-major" || kind === "auth-change" || kind === "rls-policy") {
      return RISK.BLOCKED;
    }
    return RISK.NEEDS_REVIEW;
  }
  if (finding?.path && isShariaSensitivePath(finding.path) && !SAFE_AUTO_FIX_KINDS.includes(kind)) {
    return RISK.NEEDS_CONTENT_REVIEW;
  }
  if (canAutoApply(finding)) return RISK.SAFE_AUTO;
  if (SAFE_AUTO_FIX_KINDS.includes(kind)) return RISK.LOW_PR;
  return RISK.NEEDS_REVIEW;
}

/** ما يصبح تلقائيًا vs بشريًا — للنقرير النهائي */
export const AUTOMATION_CONTRACT = Object.freeze({
  automatic: [
    "مسح دوري (كاش، أسرار ظاهرة، npm audit ملخص، نظافة بيانات بنيوية، version.json)",
    "إصلاحات ميكانيكية غير شرعية ضمن SAFE_AUTO_FIX_KINDS",
    "فتح PR بصيغة auto/fix-YYYY-MM-DD-* مع تقرير",
    "دمج منخفض الخطورة عبر safe-auto-merge بعد Verify build",
    "التحقق من النشر عبر auto-deploy + /version.json",
  ],
  neverAutomatic: [
    "تعديل نص قرآن/حديث/فتوى/تفسير بدون مصدر معتمد",
    "حذف محتوى شرعي",
    "ترقية major للاعتماديات",
    "تغييرات auth / RLS / migrations",
    "تعديل Capacitor/iOS native عالي الخطورة",
  ],
  humanApproval: [
    "أي PR بوسم needs-content-review أو risky:manual-review",
    "تغييرات .github/workflows غير المدرجة في policy-path",
    "إصلاحات UX تغيّر الهوية البصرية جذريًا",
  ],
});
