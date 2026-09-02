/**
 * بوابة ui-copy — ثوابت النصوص الموحّدة.
 * node --import tsx src/lib/__tests__/copy-quality-gate.test.ts
 */
import assert from "node:assert/strict";
import { BRAND_NAME, BUTTON, EMPTY } from "../ui-copy";

assert.equal(BRAND_NAME, "سُنّة");
assert.ok(BUTTON.start.length <= 10);
assert.ok(BUTTON.details.length <= 20);
assert.ok(EMPTY.search.includes("جرّب"));
assert.ok(EMPTY.competitions.includes("حالية"));

console.log("✓ copy-quality-gate");
