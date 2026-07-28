/**
 * Smoke — web-vitals reporter exports (no browser APIs required beyond stubs).
 * Run: npx tsx src/lib/__tests__/web-vitals-reporter.test.ts
 */
import { startWebVitalsReporting } from "../web-vitals-reporter";

let passed = 0;
let failed = 0;

function check(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("═══ web-vitals-reporter ═══");
check(typeof startWebVitalsReporting === "function", "startWebVitalsReporting exported");
// Idempotent + safe in Node (no PerformanceObserver → no-op)
startWebVitalsReporting();
startWebVitalsReporting();
check(true, "idempotent call does not throw");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
