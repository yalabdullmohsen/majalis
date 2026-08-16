/**
 * تصنيف شدة نتائج التدقيق — مصدر واحد لـ verify-pr-ready وaudit-*.
 *
 * P0: يكسر CI/الدمج (صفحات عامة خطرة، روابط مكسورة، محتوى محرّف، …)
 * P1: مهم لكن لا يمنع الدمج تلقائيًا إن لم يكن public حرجًا
 * P2: تحسينات
 * admin: داخلي — لا يصبح P0 إلا عند كسر البناء أو كشف أسرار
 */

/** @typedef {'P0'|'P1'|'P2'|'admin'} Severity */

export const SEVERITY = /** @type {const} */ ({
  P0: "P0",
  P1: "P1",
  P2: "P2",
  ADMIN: "admin",
});

/**
 * @param {Severity} severity
 * @param {string} message
 * @param {{ path?: string, code?: string }} [meta]
 */
export function finding(severity, message, meta = {}) {
  return { severity, message, ...meta };
}

/**
 * @param {Array<{ severity: string }>} findings
 */
export function countBySeverity(findings = []) {
  const out = { P0: 0, P1: 0, P2: 0, admin: 0, other: 0 };
  for (const f of findings) {
    const s = String(f.severity || "");
    if (s in out) out[s] += 1;
    else out.other += 1;
  }
  return out;
}

/**
 * Exit 1 فقط عند وجود P0.
 * @param {Array<{ severity: string }>} findings
 */
export function exitCodeFromFindings(findings = []) {
  return findings.some((f) => f.severity === "P0") ? 1 : 0;
}

/**
 * هل السطر من مخرجات أمر يبدو P0؟
 * @param {string} line
 */
export function lineLooksP0(line) {
  const s = String(line || "");
  return /\[P0\]|❌\s*\[P0\]|P0\s*[:=]|fail.*P0|مشكلات P0:\s*❌/i.test(s);
}
