/**
 * بوابة: مكوّنات الرئيسية بلا ui-card/mj-card — AppCard أو soft-card.
 * node --import tsx src/lib/__tests__/home-cards-appcard-gate.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const homeDir = resolve(root, "src/components/home");

const files = readdirSync(homeDir).filter((f) => f.endsWith(".tsx"));
assert.ok(files.length >= 10, "مكوّنات رئيسية موجودة");

const offenders: string[] = [];
for (const f of files) {
  const src = readFileSync(join(homeDir, f), "utf8");
  // تعليقات فقط قد تذكر ui-card — افحص className والاستخدام الحي
  const live = src
    .split("\n")
    .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"))
    .join("\n");
  if (/\bclassName=\{?["'`][^"'`]*\b(ui-card|mj-card)\b/.test(live) || /\bclassName="[^"]*\b(ui-card|mj-card)\b/.test(live)) {
    offenders.push(f);
  }
}

assert.deepEqual(offenders, [], `بطاقات رئيسية ما زالت على ui-card/mj-card: ${offenders.join(", ")}`);

const appCard = readFileSync(resolve(root, "src/components/design-system/AppCard.tsx"), "utf8");
assert.match(appCard, /soft-card--on-light/, "AppCard يستخدم soft-card");

console.log(`home-cards-appcard-gate.test.ts: ok · ${files.length} ملفًا بلا ui-card/mj-card حي`);
