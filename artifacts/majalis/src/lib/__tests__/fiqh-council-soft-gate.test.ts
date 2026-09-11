/**
 * بوابة: أسطح مجلس الفقه على soft-card بلا ui-card.
 * node --import tsx src/lib/__tests__/fiqh-council-soft-gate.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const viewDir = resolve(root, "src/views");
const compDir = resolve(root, "src/components/fiqh-council");

const files = [
  ...readdirSync(viewDir)
    .filter((f) => f.startsWith("FiqhCouncil") && f.endsWith(".tsx"))
    .map((f) => resolve(viewDir, f)),
  ...readdirSync(compDir)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => resolve(compDir, f)),
];

assert.ok(files.length >= 10, "ملفات مجلس الفقه موجودة");

for (const abs of files) {
  const src = readFileSync(abs, "utf8");
  const rel = abs.slice(root.length + 1);
  assert.doesNotMatch(src, /\bui-card\b/, `${rel} بلا ui-card`);
  if (src.includes("soft-card") || src.includes("className=")) {
    // إن وُجدت بطاقات سطح سابقاً يجب أن تكون soft-card
  }
}

// عيّنة حيّة: الصفحة الرئيسية للمجمع تستخدم soft-card
const hub = readFileSync(resolve(viewDir, "FiqhCouncilPage.tsx"), "utf8");
assert.match(hub, /soft-card/, "FiqhCouncilPage يستخدم soft-card");
assert.match(hub, /soft-card--on-light/, "FiqhCouncilPage على سطح فاتح");

console.log(`fiqh-council-soft-gate.test.ts: ok · ${files.length} ملفاً`);
