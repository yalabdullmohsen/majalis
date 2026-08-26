/**
 * بوابة RUM: عتبات CWV + مسار /api/rum + PERF_API_SLOW_MS=500 + إقلاع كسول.
 * تشغيل: node --import tsx src/lib/__tests__/rum-telemetry-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const rum = read("src/lib/rum-telemetry.ts");
assert.match(rum, /RUM_LCP_ALERT_MS\s*=\s*2500/, "عتبة LCP 2.5s");
assert.match(rum, /RUM_INP_ALERT_MS\s*=\s*200/, "عتبة INP 200ms");
assert.match(rum, /allowsAnalytics/, "موافقة تحليلات");
assert.match(rum, /\/api\/rum/, "إرسال إلى /api/rum");
assert.match(rum, /largest-contentful-paint|LCP/, "مراقبة LCP");
assert.match(rum, /event.*INP|observeInp|INP/, "مراقبة INP");

const handler = read("lib/rum-http.mjs");
assert.match(handler, /RUM_ALERT_WEBHOOK|SLACK_WEBHOOK_URL/, "webhook تنبيه");
assert.match(handler, /2500/, "عتبة LCP في الخادم");
assert.match(handler, /200/, "عتبة INP في الخادم");

const dispatch = read("lib/api-dispatch.mjs");
assert.match(dispatch, /\/api\/rum/, "مسار rum في التوزيع");
assert.match(dispatch, /rum-http\.mjs/, "معالج rum خارج api-handlers (بلا danger-path)");
assert.doesNotMatch(dispatch, /api-handlers\/rum/, "لا ملف rum تحت api-handlers");

const perf = read("src/lib/performance-monitor.ts");
assert.match(perf, /PERF_API_SLOW_MS\s*=\s*500/, "تنبيه API >500ms");

const main = read("src/main.tsx");
assert.match(main, /rum-telemetry/, "إقلاع RUM من main");

console.log("rum-telemetry-gate.test.ts: ok");
