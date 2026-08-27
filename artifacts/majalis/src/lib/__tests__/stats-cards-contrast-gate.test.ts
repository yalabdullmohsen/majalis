/**
 * بوابة — بطاقات الإحصاء على جسم الصفحة: لا نص أبيض فوق سطح فاتح.
 * Run: node --import tsx src/lib/__tests__/stats-cards-contrast-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const tafsir = read("src/styles/pages/tafsir.css");
const ulum = read("src/styles/pages/ulum-quran.css");
const ds = read("src/styles/design-system.css");

assert.match(tafsir, /\.tf-stat\s*\{[\s\S]*?background:\s*var\(--surface-card/);
assert.match(tafsir, /\.tf-stat strong\s*\{[\s\S]*?color:\s*var\(--mj-brand-deep/);
assert.match(tafsir, /\.tf-stat span\s*\{[\s\S]*?color:\s*var\(--mj-ink-2/);
assert.doesNotMatch(
  tafsir,
  /\.tf-stat strong\s*\{[^}]*color:\s*#FFFFFF/,
);
assert.match(tafsir, /html\.dark \.tf-stat strong/);

assert.match(ulum, /\.uq-stat__num\s*\{[\s\S]*?color:\s*var\(--mj-brand-deep/);
assert.match(ulum, /\.uq-hero \.uq-stat__num/);

assert.match(ds, /\.ds-stat strong\s*\{[\s\S]*?color:\s*var\(--mj-brand-deep/);
assert.match(ds, /html\.dark \.ds-stat strong/);

console.log("stats-cards-contrast-gate: ok");
