#!/usr/bin/env node
/**
 * Test cron authentication — all supported auth methods.
 */
import { validateCronAuth, extractCronSecretFromRequest, getEnvStatus } from "../lib/env-config.mjs";

const secret = process.env.CRON_SECRET || process.env.VITE_CRON_SECRET || "test-secret-123";

function mockReq(headers) {
  return { headers, method: "GET" };
}

console.log("=== Cron Auth Test ===\n");
console.log("Env:", getEnvStatus());

const tests = [
  { name: "No auth (production)", headers: {}, env: "production", expect: false },
  { name: "x-vercel-cron: 1", headers: { "x-vercel-cron": "1" }, expect: true },
  { name: "Authorization Bearer", headers: { authorization: `Bearer ${secret}` }, expect: true },
  { name: "x-cron-secret header", headers: { "x-cron-secret": secret }, expect: true },
  { name: "Wrong secret", headers: { authorization: "Bearer wrong" }, expect: false },
  { name: "Empty Bearer", headers: { authorization: "Bearer " }, expect: false },
];

let passed = 0;
for (const t of tests) {
  if (t.env === "production") process.env.NODE_ENV = "production";
  else process.env.NODE_ENV = "development";
  process.env.CRON_SECRET = secret;

  const result = validateCronAuth(mockReq(t.headers));
  const ok = result === t.expect;
  if (ok) passed++;
  console.log(`${ok ? "✓" : "✗"} ${t.name}: ${result} (expected ${t.expect})`);
}

console.log(`\nExtract Bearer: "${extractCronSecretFromRequest(mockReq({ authorization: `Bearer ${secret}` }))}"`);
console.log(`Extract x-cron-secret: "${extractCronSecretFromRequest(mockReq({ "x-cron-secret": secret }))}"`);
console.log(`\n${passed}/${tests.length} passed`);
process.exit(passed === tests.length ? 0 : 1);
