/**
 * بوابة نظام القراءة العالمي — رموز اسمية + طبقة نثر + استثناء المصحف.
 * node --import tsx src/lib/__tests__/reading-prose-system-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const tokens = "src/styles/reading-prose-system.css";
const scale = "src/styles/typography-scale.css";
const prose = "src/styles/reading-prose-system.css";
const shell = "src/styles/components/content-reading-shell.css";
const main = "src/main.tsx";

for (const rel of [tokens, scale, prose, shell, main]) {
  assert.ok(existsSync(resolve(root, rel)), `مفقود: ${rel}`);
}

const tok = read(tokens);
const scl = read(scale);
const prs = read(prose);
const shl = read(shell);
const mainSrc = read(main);

for (const name of [
  "--type-title-xl",
  "--type-title-l",
  "--type-section",
  "--type-body-lg",
  "--type-body-regular",
  "--type-body-sm",
  "--type-metadata",
  "--type-caption",
  "--lh-reading",
  "--read-measure",
]) {
  assert.match(tok, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `رمز ${name}`);
}

for (const cls of [
  ".type-title-xl",
  ".type-title-l",
  ".type-section",
  ".type-body-lg",
  ".type-body-regular",
  ".type-body-sm",
  ".type-metadata",
  ".type-caption",
]) {
  assert.match(prs, new RegExp(cls.replace(/\./g, "\\.")), `صنف ${cls}`);
}

assert.match(scl, /--text-h1|--text-body/, "سلم الطباعة موجود");
assert.match(mainSrc, /reading-prose-system\.css/, "main يحمّل نظام النثر");
assert.match(prs, /max-width:\s*var\(--read-measure/, "عرض سطر موحّد");
assert.match(prs, /line-height:\s*var\(--lh-reading/, "ارتفاع سطر قراءة");
assert.match(prs, /\.topic-page__body/, "أسطح الموضوعات");
assert.match(prs, /\.tawhid-page|tawheed-page/, "عقيدة");
assert.match(prs, /\.tarikh-page/, "تاريخ");
assert.match(prs, /\.seerah-page/, "سيرة");
assert.match(prs, /strong,\s*b,\s*dfn/, "إبراز مصطلحات");
assert.match(prs, /qpc|mushaf|mm-reader/i, "استثناء المصحف موثّق");
assert.doesNotMatch(prs, /--mm-qpc-size\s*:/, "لا إعادة تعريف QPC");
assert.match(shl, /--read-measure|--lh-reading|--type-body/, "الغلاف يستخدم رموز القراءة");
assert.match(prs, /--ss-type-screen-title:\s*var\(--type-title-xl/, "جسر عنوان الشاشة");

console.log("reading-prose-system-gate.test.ts: ok");
