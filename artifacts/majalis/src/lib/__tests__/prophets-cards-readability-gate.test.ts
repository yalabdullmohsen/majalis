/**
 * بوابة: بطاقات الأنبياء مقروءة — حجم/هرمية/تباين/ليلي.
 * Run: node --import tsx src/lib/__tests__/prophets-cards-readability-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/styles/pages/prophet-stories.css"), "utf8");
const view = readFileSync(resolve(root, "src/views/ProphetStoriesPage.tsx"), "utf8");

/* قائمة: عمود واحد ثم عمودان من 400px — لا تضييق odd-child */
assert.match(css, /P0 readability/);
assert.match(
  css,
  /\.prophets-lux-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
  "mobile list uses single full-width column first",
);
assert.match(css, /@media \(min-width:\s*400px\)[\s\S]{0,180}?repeat\(2,\s*minmax\(0,\s*1fr\)/);
assert.match(
  css,
  /\.prophets-lux-grid\s*>\s*:last-child:nth-child\(odd\)[\s\S]{0,120}?max-width:\s*none/s,
  "odd last child must not shrink to half width",
);

/* هرمية الاسم */
assert.match(css, /\.prophet-lux-card__name\s*\{[^}]*font-size:\s*clamp\(1\.2rem/s);
assert.match(css, /\.prophet-lux-card__name\s*\{[^}]*font-weight:\s*800/s);
assert.match(css, /\.prophet-lux-card__title\s*\{[^}]*font-weight:\s*700/s);
assert.match(css, /\.prophet-lux-card\s*\{[^}]*min-height:\s*13\.5rem/s);

/* ترتيب المحتوى في JSX: اسم → لقب → مكان → قرآني → نبذة */
assert.match(
  view,
  /prophet-lux-card__name[\s\S]{0,220}?prophet-lux-card__title[\s\S]{0,160}?prophet-lux-card__place[\s\S]{0,220}?prophet-lux-card__quran[\s\S]{0,160}?prophet-lux-card__bio/s,
);

/* ثانوي واضح — لا hairline كـ soft text */
assert.match(css, /--ps-ink-soft:\s*var\(--text-secondary/);
assert.doesNotMatch(
  css,
  /html\.dark \.prophets-lux-page[\s\S]{0,200}?--ps-ink-soft:\s*var\(--text-secondary,\s*var\(--mj-hairline\)/s,
);
assert.match(css, /html\.dark \.prophets-lux-page[\s\S]{0,80}?--ps-ink-soft:\s*#C8D5CF/s);

/* بطاقات معلومات أكبر */
assert.match(css, /\.prophet-fact-card\s*\{[^}]*min-height:\s*5\.75rem/s);
assert.match(css, /\.prophet-fact-card__value\s*\{[^}]*font-size:\s*1\.05rem/s);
assert.match(css, /\.prophet-fact-card__label\s*\{[^}]*opacity:\s*1/s);

/* ليلي: بطاقة داكنة بلا تدرج فاتح */
assert.match(css, /html\.dark \.prophet-lux-card[\s\S]{0,120}?background:\s*#1A2421/s);
assert.match(css, /html\.dark \.prophet-fact-card[\s\S]{0,120}?background:\s*#15201c/s);
assert.doesNotMatch(css, /word-break:\s*break-all/);

console.log("prophets-cards-readability-gate: ok");
