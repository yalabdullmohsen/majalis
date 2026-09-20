/**
 * بوابة: بطاقات الأنبياء مقروءة — حجم/هرمية/chips/تباين/ليلي.
 * Run: node --import tsx src/lib/__tests__/prophets-cards-readability-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/styles/pages/prophet-stories.css"), "utf8");
const view = readFileSync(resolve(root, "src/views/ProphetStoriesPage.tsx"), "utf8");

assert.match(css, /P0 readability/);
assert.match(
  css,
  /\.prophets-lux-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
);
assert.match(css, /@media \(min-width:\s*400px\)[\s\S]{0,180}?repeat\(2,\s*minmax\(0,\s*1fr\)/);
assert.match(
  css,
  /\.prophets-lux-grid\s*>\s*:last-child:nth-child\(odd\)[\s\S]{0,120}?max-width:\s*none/s,
);

/* ~مساحة موحّدة أقصر */
assert.match(css, /\.prophet-lux-card\s*\{[^}]*min-height:\s*12\.5rem/s);
assert.match(css, /\.prophet-lux-card__name\s*\{[^}]*font-size:\s*clamp\(1\.32rem/s);
assert.match(css, /\.prophet-lux-card__name\s*\{[^}]*font-weight:\s*800/s);
assert.match(css, /\.prophet-lux-card__title\s*\{[^}]*font-weight:\s*750/s);

/* Chips بدل النصوص الباهتة */
assert.match(view, /prophet-lux-card__chips/);
assert.match(view, /prophet-lux-card__chip--stat/);
assert.match(css, /\.prophet-lux-card__chip\s*\{/);
assert.match(css, /opacity:\s*1/);
assert.doesNotMatch(view, /prophet-lux-card__meter/);

/* ترتيب: اسم → لقب → نبذة → chips */
assert.match(
  view,
  /prophet-lux-card__name[\s\S]{0,220}?prophet-lux-card__title[\s\S]{0,220}?prophet-lux-card__bio[\s\S]{0,220}?prophet-lux-card__chips/s,
);

assert.match(css, /--ps-ink-soft:\s*var\(--text-secondary/);
assert.match(css, /html\.dark \.prophets-lux-page[\s\S]{0,80}?--ps-ink-soft:\s*#C8D5CF/s);
assert.match(css, /html\.dark \.prophet-lux-card__chip[\s\S]{0,220}?#E8F0EC/s);
assert.match(css, /\.prophet-fact-card\s*\{[^}]*min-height:\s*6\.5rem/s);
assert.doesNotMatch(css, /word-break:\s*break-all/);

/* عرض ضيق: عمود واحد + chips أصغر عند 320px */
assert.match(css, /@media \(max-width:\s*320px\)[\s\S]{0,220}?\.prophet-lux-card__chip/s);
assert.match(css, /@media \(max-width:\s*390px\)[\s\S]{0,220}?min-height:\s*11\.5rem/s);

/* سيرة مختصرة + CTA كامل */
assert.match(view, /prophets-seerah-brief/);
assert.match(view, /prophets-seerah-timeline/);
assert.match(view, /اقرأ السيرة النبوية الكاملة/);
assert.match(view, /href="\/seerah"/);
assert.doesNotMatch(view, /بداية السيرة النبوية الشريفة/);

console.log("prophets-cards-readability-gate: ok");
