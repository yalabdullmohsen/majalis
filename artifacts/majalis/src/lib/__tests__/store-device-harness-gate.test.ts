/**
 * node --import tsx src/lib/__tests__/store-device-harness-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = readFileSync(
  resolve(root, "src/lib/prayer-notifications/store-device-harness.ts"),
  "utf8",
);

assert.match(src, /STORE_DEVICE_HARNESS_NAMESPACE/);
assert.match(src, /import\.meta\.env\.DEV/);
assert.match(src, /majalis-store-device-harness/);
assert.match(src, /web_context_not_valid_device_proof/);
assert.doesNotMatch(src, /VITE_.*SECRET|service_role/);
console.log("store-device-harness-gate: ok");
