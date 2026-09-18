/**
 * بوابة: الممر النهائي للوضع الليلي — شارة الزائر + عناوين + بلا أشرطة جانبية.
 * تشغيل: node --import tsx src/lib/__tests__/dark-mode-final-pass-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const refine = readFileSync(resolve(root, "src/styles/premium-dark-refine.css"), "utf8");

assert.match(refine, /Final Dark Pass/, "قسم الممر النهائي موجود");
assert.match(refine, /\.hsh-eyebrow[\s\S]{0,400}border-radius:\s*var\(--radius-mj-pill/, "شارة الزائر حبة ناعمة");
assert.match(refine, /\.hsh-eyebrow[\s\S]{0,500}--pd-emerald/, "شارة الزائر من توكنات التصميم");
assert.match(refine, /\.section-card__title/, "عناوين أقسام مستهدفة");
assert.match(refine, /#f4efe6/, "لون عنوان عالي التباين");
assert.match(
  refine,
  /border-inline-start-width:\s*1px[\s\S]{0,120}border-inline-start-color:\s*var\(--dark-border-subtle/,
  "أشرطة الجانب الزخرفية مُلغاة",
);
assert.match(refine, /\.home-start-here \.hsh-step[\s\S]{0,200}box-shadow:\s*none/, "تسطيح Card-in-Card للزائر");
assert.match(
  refine,
  /pts-immersive[\s\S]{0,400}--dm-bottom-nav/,
  "شريط سفلي موحّد مع الصلاة",
);

console.log("dark-mode-final-pass-gate: ok");
