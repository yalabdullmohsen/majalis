/**
 * بوابة — نظام البطاقات الموحّد (Card System).
 * Run: node --import tsx src/lib/__tests__/card-system-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const tokens = read("src/styles/card-system-tokens.css");
const css = read("src/styles/card-system.css");
const main = read("src/main.tsx");
const cardSystem = read("src/components/design-system/CardSystem.tsx");
const dsIndex = read("src/components/design-system/index.ts");
const appCard = read("src/components/design-system/AppCard.tsx");

console.log("=== رموز الطبقات ===");
assert.match(tokens, /--cs-surface-1:/);
assert.match(tokens, /--cs-surface-2:/);
assert.match(tokens, /--cs-surface-3:/);
assert.match(tokens, /--cs-primary:/);
assert.match(tokens, /--cs-gold:/);
assert.match(tokens, /--cs-text-primary:/);
assert.match(tokens, /--cs-text-secondary:/);
assert.match(tokens, /--cs-text-muted:/);
assert.match(tokens, /--cs-ink-hero:/);
assert.match(tokens, /--cs-ink-topic:/);
assert.match(tokens, /--cs-ink-lesson:/);
assert.match(tokens, /--cs-ink-path:/);
assert.match(tokens, /--cs-on-ink-title:/);
assert.match(tokens, /--cs-on-ink-body:/);
assert.match(tokens, /@media \(min-width:\s*768px\)/);
assert.match(tokens, /html\.dark/);

console.log("=== استيراد بعد matte ===");
assert.match(main, /card-matte-unify\.css/);
assert.match(main, /card-system\.css/);
const matteIdx = main.indexOf("card-matte-unify.css");
const csIdx = main.indexOf("card-system.css");
assert.ok(csIdx > matteIdx, "card-system بعد card-matte-unify");

console.log("=== أنوع Card System العشرة ===");
const required = [
  "HeroCard",
  "SectionCard",
  "TopicCard",
  "LessonCard",
  "CourseCard",
  "HadithCard",
  "QuranCard",
  "ReferenceCard",
  "RelatedContentCard",
  "ActionCard",
];
for (const name of required) {
  assert.match(cardSystem, new RegExp(name), `يصدّر ${name}`);
  assert.match(cardSystem, /CS_CARD_TYPES/, "قائمة الأنواع الرسمية");
}
assert.match(dsIndex, /from "\.\/CardSystem"/, "تصدير من design-system");
assert.match(dsIndex, /HeroCard/);
assert.match(dsIndex, /ActionCard/);
assert.match(appCard, /data-cs-card/, "AppCard موسوم بنظام البطاقات");
assert.match(appCard, /\bcs-card\b/);

console.log("=== إعادة تخطيط الأسطح القديمة ===");
assert.match(css, /\.soft-card:not\(\[data-scripture\]\)/);
assert.match(css, /\.hub-card:not\(\[data-scripture\]\)/);
assert.match(css, /\.lesson-unified-card/);
assert.match(css, /\.hadith-card:not\(\[data-scripture\]\)/);
assert.match(css, /\.rcc/);
assert.match(css, /\.lpp-path-card/);
assert.match(css, /\.card:not\(\[data-scripture\]\)/);
assert.match(css, /--cs-surface-2/);
assert.match(css, /min-height:\s*0\s*!important/);
assert.match(css, /hadith-card__text--matn|\.hadith-card__matn/);
assert.match(css, /\.hub-card__icon/);
assert.doesNotMatch(css, /box-shadow:[^;]*0\s+0\s+\d+px[^;]*glow/i);
assert.doesNotMatch(css, /filter:\s*drop-shadow/);

console.log("=== كثافة هاتف / iPad ===");
assert.match(css, /@media \(min-width:\s*768px\)/);
assert.match(tokens, /--cs-pad-y:\s*0\.7rem/);
assert.match(tokens, /--cs-pad-y:\s*0\.95rem/);

console.log("=== تفاعل بلا glow ===");
assert.match(css, /\.cs-card:hover/);
assert.match(css, /filter:\s*none/);
assert.match(css, /\.cs-card:active/);
assert.match(css, /aria-pressed="true"/);

console.log("=== زمرد داكن للعناصر الرئيسية · قراءة فاتحة ===");
assert.match(css, /--cs-ink-hero/);
assert.match(css, /--cs-ink-topic/);
assert.match(css, /--cs-ink-lesson/);
assert.match(css, /--cs-ink-path/);
assert.match(css, /--cs-on-ink-title/);
assert.match(css, /\.hub-card:not\(\[data-scripture\]\)[\s\S]*?--cs-ink-topic/);
assert.match(css, /\.lesson-unified-card[\s\S]*?--cs-ink-lesson/);
assert.match(css, /\.lpp-path-card[\s\S]*?--cs-ink-path/);
assert.match(css, /\.cs-hero[\s\S]*?--cs-ink-hero/);
assert.match(css, /\.hadith-card:not\(\[data-scripture\]\)[\s\S]*?--cs-surface-2/);
assert.match(css, /\.rsc[\s\S]*?--cs-surface-2/);
assert.match(css, /\[data-cs-type="reference"\][\s\S]*?--cs-surface-2/);
assert.doesNotMatch(
  css,
  /\.hadith-card:not\(\[data-scripture\]\)[\s\S]{0,200}--cs-ink-/,
  "حديث ليس على زمرد داكن",
);

console.log("card-system-gate.test.ts: ok");
