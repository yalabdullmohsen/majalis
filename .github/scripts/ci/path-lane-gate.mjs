#!/usr/bin/env node
/**
 * منطق Path-lane gate (مرآة لخطوات CI المضمّنة قبل checkout).
 * تشغيل الاختبارات: node --test .github/scripts/ci/__tests__/path-lane-gate.test.mjs
 */
export function evaluatePathLaneGate({ need, build }) {
  const raw = String(need ?? "").trim().toLowerCase();
  if (raw === "") {
    return {
      ok: false,
      run: false,
      reason: "missing_need_output",
      message: "classify output NEED is empty — expected explicit true|false",
    };
  }
  if (raw !== "true" && raw !== "false") {
    return {
      ok: false,
      run: false,
      reason: "invalid_need_output",
      message: `invalid NEED='${need}' — expected true|false`,
    };
  }
  if (raw !== "true") {
    return {
      ok: true,
      run: false,
      reason: "not_required",
      message: "path-lane not required — neutral success",
    };
  }
  if (build !== "success") {
    return {
      ok: false,
      run: false,
      reason: "missing_producer_artifact",
      message: `required but producer build=${build}; artifact majalis-dist unavailable`,
    };
  }
  return {
    ok: true,
    run: true,
    reason: "required_and_build_ok",
    message: "required — proceed with artifact from build",
  };
}

/** تجميع Verify build / ci-required */
export function evaluateAggregatorRow({ name, required, result }) {
  const req = required === true || required === "true";
  if (req) {
    if (result === "success") {
      return { ok: true, reason: "required_success" };
    }
    return {
      ok: false,
      reason: result === "cancelled" ? "required_cancelled" : "required_not_success",
    };
  }
  // optional
  if (result === "failure") {
    return { ok: false, reason: "optional_failed_unexpectedly" };
  }
  // skipped / cancelled / success OK when not required
  return { ok: true, reason: "optional_skip_or_neutral" };
}
