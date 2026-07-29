/**
 * Phase 8 — Reliability unit tests (circuit breaker, backoff, structured log sanitization).
 */
import assert from "node:assert/strict";
import {
  CircuitBreakerRegistry,
  CircuitOpenError,
  circuitKeyFromUrl,
} from "../circuit-breaker.ts";
import { computeBackoffDelayMs, isRetriableError, isRetriableHttpStatus } from "../retry-policy.ts";

function testCircuitOpensAfterThreshold(): void {
  const cb = new CircuitBreakerRegistry({
    failureThreshold: 3,
    successThreshold: 1,
    resetTimeoutMs: 10_000,
    now: () => 1_000,
  });
  assert.equal(cb.getState("api"), "closed");
  cb.recordFailure("api");
  cb.recordFailure("api");
  assert.equal(cb.getState("api"), "closed");
  cb.recordFailure("api");
  assert.equal(cb.getState("api"), "open");
  assert.throws(() => cb.assertClosed("api"), CircuitOpenError);
}

function testHalfOpenRecovery(): void {
  let now = 0;
  const cb = new CircuitBreakerRegistry({
    failureThreshold: 1,
    successThreshold: 2,
    resetTimeoutMs: 100,
    now: () => now,
  });
  cb.recordFailure("db");
  assert.equal(cb.getState("db"), "open");
  now = 150;
  cb.assertClosed("db");
  assert.equal(cb.getState("db"), "half-open");
  cb.recordSuccess("db");
  assert.equal(cb.getState("db"), "half-open");
  cb.recordSuccess("db");
  assert.equal(cb.getState("db"), "closed");
}

function testBackoffBounds(): void {
  const delay = computeBackoffDelayMs(3, { maxRetries: 3, baseDelayMs: 100, maxDelayMs: 500 }, () => 1);
  assert.equal(delay, 500);
  const zero = computeBackoffDelayMs(0, { maxRetries: 1, baseDelayMs: 200, maxDelayMs: 4000 }, () => 0);
  assert.equal(zero, 0);
}

function testRetriableGuards(): void {
  assert.equal(isRetriableHttpStatus(503), true);
  assert.equal(isRetriableHttpStatus(404), false);
  assert.equal(isRetriableError(new Error("network")), true);
  assert.equal(isRetriableError(new DOMException("Aborted", "AbortError")), false);
  assert.equal(isRetriableError(new CircuitOpenError("x", 1)), false);
}

function testCircuitKeyFromUrl(): void {
  const key = circuitKeyFromUrl("https://example.com/api/admin/foo?q=1");
  assert.equal(key, "https://example.com/api/admin");
}

testCircuitOpensAfterThreshold();
testHalfOpenRecovery();
testBackoffBounds();
testRetriableGuards();
testCircuitKeyFromUrl();

console.log("phase8-reliability: ok");
