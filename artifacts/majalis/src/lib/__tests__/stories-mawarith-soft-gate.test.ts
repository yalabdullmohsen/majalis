/**
 * بوابة: قصص السور / الأربعين / بطاقة التمييز / زر الميراث على soft-card / ActionButton.
 * node --import tsx src/lib/__tests__/stories-mawarith-soft-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const softFiles = [
  "src/pages/quran/ui/SurahStoriesView.tsx",
  "src/views/ArbaeenLovePage.tsx",
  "src/views/admin/ArbaeenLoveSection.tsx",
  "src/components/reading/HighlightedContentCard.tsx",
] as const;

for (const rel of softFiles) {
  const src = readFileSync(resolve(root, rel), "utf8");
  assert.doesNotMatch(src, /(?<![\w-])ui-card(?!-btn)(?![\w-])/, `${rel} بلا ui-card`);
  assert.match(src, /soft-card/, `${rel} يستخدم soft-card`);
  assert.match(src, /soft-card--on-light/, `${rel} على سطح فاتح موحّد`);
}

const mawarith = readFileSync(resolve(root, "src/pages/fiqh/ui/MawarithCalculatorView.tsx"), "utf8");
assert.doesNotMatch(mawarith, /\bui-card-btn\b/, "Mawarith بلا ui-card-btn");
assert.match(mawarith, /ActionButton/, "Mawarith يستخدم ActionButton");

console.log("stories-mawarith-soft-gate.test.ts: ok");
