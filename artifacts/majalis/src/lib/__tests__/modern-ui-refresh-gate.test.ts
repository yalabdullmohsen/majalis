/**
 * بوابة — طبقة modern-ui-refresh محمّلة ومربوطة.
 * Run: node --import tsx src/lib/__tests__/modern-ui-refresh-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const main = read("src/main.tsx");
const mur = read("src/styles/modern-ui-refresh.css");
const unify = read("src/styles/ssunnah-card-unify.css");
const soft = read("src/styles/soft-cards.css");
const index = read("src/components/design-system/index.ts");
const settingsList = read("src/components/design-system/SettingsList.tsx");
const actionBtn = read("src/components/design-system/ActionButton.tsx");

assert.match(main, /modern-ui-refresh\.css/, "استيراد modern-ui-refresh في main");
assert.match(main, /ssunnah-ds-canonical\.css/, "استيراد ssunnah-ds-canonical في main");
assert.match(mur, /\.mj-segmented-filter/, "Segmented Control في الطبقة");
assert.match(mur, /\.mur-settings-list/, "قائمة إعدادات حديثة");
assert.match(mur, /\.reading-info-block/, "كتل قراءة");
assert.match(mur, /prefers-reduced-motion/, "احترام تقليل الحركة");
assert.match(mur, /Design System Migration/, "طبقة تبني عالمي");
assert.match(unify, /border:\s*1px solid transparent/, "بطاقات بلا حدود ثقيلة");
assert.match(soft, /--soft-card-border:\s*transparent/, "soft-card فاتح بلا إطار");
assert.match(index, /SettingsList/, "تصدير SettingsList");
assert.match(settingsList, /mur-settings-row/, "صفوف SettingsList");
assert.match(actionBtn, /destructive/, "زر Destructive موحّد");

console.log("modern-ui-refresh-gate.test.ts: ok");
