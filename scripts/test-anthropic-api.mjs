#!/usr/bin/env node
/**
 * Verify /api/test-anthropic responds with JSON and reports key status.
 * Run: node scripts/test-anthropic-api.mjs [baseUrl]
 */
const base = process.argv[2] || "http://localhost:24500";
const endpoint = `${base.replace(/\/$/, "")}/api/test-anthropic`;

console.log("[test-anthropic] endpoint:", endpoint);

const res = await fetch(endpoint);
const contentType = res.headers.get("content-type") || "";
console.log("[test-anthropic] status:", res.status, "content-type:", contentType);

if (!contentType.includes("application/json")) {
  const text = await res.text();
  console.error("[test-anthropic] FAIL: expected JSON, got:", text.slice(0, 200));
  process.exit(1);
}

const data = await res.json();
console.log("[test-anthropic] body:", data);

const routeWorks = res.ok && typeof data.success === "boolean";
console.log("\n--- REPORT ---");
console.log("route works:", routeWorks ? "YES" : "NO");
console.log("success:", data.success);
console.log("error:", data.error ?? "(none)");

process.exit(routeWorks ? 0 : 1);
