/**
 * بوابة: صفحات الحساب/الأدوات بلا ui-card (مع السماح بآثار أزرار مُرحَّلة).
 * node --import tsx src/lib/__tests__/account-tools-soft-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const files = [
  "src/views/CardsPage.tsx",
  "src/views/PrivacyCenterPage.tsx",
  "src/views/UpdatesPage.tsx",
  "src/views/VaultPage.tsx",
  "src/views/UserStatsPage.tsx",
  "src/views/FamilyModePage.tsx",
  "src/views/ResearcherProfilePage.tsx",
  "src/pages/account/ui/FawaidView.tsx",
  "src/pages/account/ui/FlashCardsView.tsx",
  "src/pages/account/ui/AccountDeletionView.tsx",
] as const;

const uiCard = /(?<![\w-])ui-card(?!-btn)(?![\w-])/;

for (const rel of files) {
  const src = readFileSync(resolve(root, rel), "utf8");
  assert.doesNotMatch(src, uiCard, `${rel} بلا ui-card`);
  assert.doesNotMatch(src, /\bui-card-btn\b/, `${rel} بلا ui-card-btn`);
}

const cards = readFileSync(resolve(root, "src/views/CardsPage.tsx"), "utf8");
assert.match(cards, /soft-card/, "CardsPage يستخدم soft-card");
assert.match(cards, /soft-card--on-light/, "CardsPage على سطح فاتح");

console.log(`account-tools-soft-gate.test.ts: ok · ${files.length}`);
