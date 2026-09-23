/**
 * وحدة علامات الإقلاع — لا تُفعَّل في بيئة الاختبار (بلا DEV window flag).
 * تشغيل: node --import tsx src/lib/__tests__/startup-performance-marks.test.ts
 */
import assert from "node:assert/strict";
import {
  STARTUP_MARKS,
  markStartup,
  measureStartup,
  readStartupMarksSnapshot,
} from "../startup-performance-marks";

assert.equal(STARTUP_MARKS.length, 10);
assert.ok(STARTUP_MARKS.includes("startup:js-start"));
assert.ok(STARTUP_MARKS.includes("startup:cache-ready"));

// بلا __SUNNAH_STARTUP_MARKS__ ولا import.meta.env.DEV في هذا السياق → no-op آمن
markStartup("startup:js-start");
assert.equal(measureStartup("t", "startup:js-start", "startup:root-mounted"), null);
assert.ok(Array.isArray(readStartupMarksSnapshot()));

console.log("startup-performance-marks.test.ts: ok");
