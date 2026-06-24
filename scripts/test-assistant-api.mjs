#!/usr/bin/env node
/**
 * Integration test: simulates AssistantPage → POST /api/assistant
 * Run: node scripts/test-assistant-api.mjs [baseUrl]
 */
const base = process.argv[2] || "http://localhost:24500";
const endpoint = `${base.replace(/\/$/, "")}/api/assistant`;
const question = "ما هي أركان الإسلام؟";

console.log("[test] endpoint:", endpoint);
console.log("[test] question:", question);

const getRes = await fetch(endpoint);
const getData = await getRes.json();
console.log("[test] GET status:", getRes.status, getData);

const postRes = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: question }),
});
const contentType = postRes.headers.get("content-type") || "";
console.log("[test] POST status:", postRes.status, "content-type:", contentType);

if (!contentType.includes("application/json")) {
  const text = await postRes.text();
  console.error("[test] FAIL: expected JSON, got:", text.slice(0, 200));
  process.exit(1);
}

const postData = await postRes.json();
console.log("[test] POST body:", postData);

const fetchWorks = postRes.ok && contentType.includes("application/json");
const reachedServer = getRes.ok && typeof getData.available === "boolean";
const hasKey = getData.available === true;

console.log("\n--- REPORT ---");
console.log("fetch works:", fetchWorks ? "YES" : "NO");
console.log("endpoint:", endpoint);
console.log("request reached server:", reachedServer ? "YES" : "NO");
console.log("ANTHROPIC_API_KEY configured:", hasKey ? "YES" : "NO");
console.log("response ok:", postData.ok);
console.log("fallback:", postData.fallback ?? false);

process.exit(fetchWorks && reachedServer ? 0 : 1);
