#!/usr/bin/env node
/**
 * Test cron authentication — Bearer, HMAC, replay protection, rotation.
 */
import { validateCronAuth, extractCronSecretFromRequest, getEnvStatus, signCronRequest } from "../lib/env-config.mjs";

const secret = process.env.CRON_SECRET || process.env.VITE_CRON_SECRET || "test-secret-123";
const previous = "previous-secret-456";

function mockReq(headers, url = "/api/cron/autonomous-platform-fetch") {
  return { headers, url, method: "GET" };
}

console.log("=== Cron Auth Test ===\n");
console.log("Env:", getEnvStatus());

const tests = [
  { name: "No auth (production)", headers: {}, env: "production", expect: false },
  { name: "Wrong secret", headers: { authorization: "Bearer wrong" }, expect: false },
  { name: "Empty Bearer", headers: { authorization: "Bearer " }, expect: false },
  { name: "Authorization Bearer", headers: { authorization: `Bearer ${secret}` }, expect: true },
  { name: "x-cron-secret header", headers: { "x-cron-secret": secret }, expect: true },
  { name: "Previous secret rotation", headers: { authorization: `Bearer ${previous}` }, secretPrevious: previous, expect: true },
];

let passed = 0;
for (const t of tests) {
  if (t.env === "production") process.env.NODE_ENV = "production";
  else process.env.NODE_ENV = "development";
  process.env.CRON_SECRET = secret;
  process.env.CRON_SECRET_PREVIOUS = t.secretPrevious || "";

  const result = validateCronAuth(mockReq(t.headers));
  const ok = result === t.expect;
  if (ok) passed++;
  console.log(`${ok ? "✓" : "✗"} ${t.name}: ${result} (expected ${t.expect})`);
}

process.env.CRON_SECRET = secret;
process.env.NODE_ENV = "development";
const hmacHeaders = signCronRequest("/api/cron/autonomous-platform-fetch", secret);
const hmacOk = validateCronAuth(mockReq(hmacHeaders));
console.log(`${hmacOk ? "✓" : "✗"} HMAC signature: ${hmacOk}`);
if (hmacOk) passed += 1;

const replayHeaders = { ...hmacHeaders };
const replayOk = validateCronAuth(mockReq(replayHeaders));
console.log(`${!replayOk ? "✓" : "✗"} Replay blocked: ${!replayOk}`);
if (!replayOk) passed += 1;

console.log(`\nExtract Bearer: "${extractCronSecretFromRequest(mockReq({ authorization: `Bearer ${secret}` }))}"`);
console.log(`\n${passed}/${tests.length + 2} passed`);
process.exit(passed === tests.length + 2 ? 0 : 1);
