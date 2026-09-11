/**
 * بوابة: بطاقات العبادة (تسبيح / ورد / مراتب) على soft-card بلا ui-card.
 * node --import tsx src/lib/__tests__/worship-cards-soft-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const files = [
  "src/pages/worship/ui/TasbihView.tsx",
  "src/pages/worship/ui/DailyWirdView.tsx",
  "src/pages/worship/ui/PrayerRanksView.tsx",
] as const;

for (const rel of files) {
  const src = readFileSync(resolve(root, rel), "utf8");
  assert.doesNotMatch(src, /\bui-card\b/, `${rel} بلا ui-card`);
  assert.doesNotMatch(src, /\bmj-card\b/, `${rel} بلا mj-card`);
  assert.doesNotMatch(src, /\bui-card-btn\b/, `${rel} بلا ui-card-btn`);
  assert.match(src, /soft-card/, `${rel} يستخدم soft-card`);
  assert.match(src, /soft-card--on-light/, `${rel} على سطح فاتح موحّد`);
}

console.log("worship-cards-soft-gate.test.ts: ok");
