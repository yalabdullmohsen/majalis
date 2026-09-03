/**
 * Phase 8 — static gates for reliability wiring.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const requestManager = readFileSync(join(root, "src/lib/request-manager.ts"), "utf8");
const server = readFileSync(join(root, "server/index.mjs"), "utf8");
const diagnostics = readFileSync(join(root, "src/lib/diagnostics.ts"), "utf8");

assert.match(requestManager, /networkCircuitBreakers/, "RequestManager uses circuit breaker");
assert.match(requestManager, /computeBackoffDelayMs/, "RequestManager uses exponential backoff");
assert.match(requestManager, /structuredLog/, "RequestManager emits structured logs");
assert.match(requestManager, /run\.graceful_failure/, "graceful failure path logged");

assert.match(server, /service:\s*"ssunnah-web"/, "healthz exposes ssunnah-web service");
assert.match(server, /Cache-Control.*s-maxage=60|no-store/, "healthz cache policy is set");

assert.doesNotMatch(diagnostics, /@ts-expect-error|@ts-ignore/, "diagnostics must not suppress TypeScript");

console.log("phase8-reliability-gates: ok");
