/**
 * بوابة PR-8: Dark + تجاوب + وصول + انحدار عرض بطاقات المعرفة / الفرق.
 * تشغيل: node --import tsx src/lib/__tests__/islamic-sects-a11y-responsive-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const kxCss = read("src/styles/components/knowledge-summary-card.css");
const sectsCss = read("src/styles/pages/islamic-sects.css");
const card = read("src/components/knowledge/KnowledgeSummaryCard.tsx");
const surface = read("src/components/knowledge/KnowledgeDetailSurface.tsx");
const scroll = read("src/components/ScrollToTop.tsx");
const calm = read("src/styles/sections-calm-polish.css");
const list = read("src/views/IslamicSectsPage.tsx");
const detail = read("src/views/IslamicSectsDetailPage.tsx");

console.log("=== لا شريط جانبي أخضر زخرفي ===");
assert.doesNotMatch(kxCss, /border-inline-start:\s*[34]px/);
assert.doesNotMatch(kxCss, /border-inline-start-width:\s*[34]px/);
assert.match(kxCss, /border-inline-start:\s*none/);
assert.doesNotMatch(sectsCss, /\.sect-card\s*\{[^}]*border-inline-start:\s*[34]px/);
assert.doesNotMatch(sectsCss, /\.kx-summary-card\s*\{[^}]*border-inline-start:\s*[34]px/);

console.log("=== لا Card داخل Card بلا سبب ===");
assert.match(kxCss, /\.kx-detail-surface\s+\.rsc[\s\S]{0,200}?box-shadow:\s*none/);
assert.match(kxCss, /\.kx-detail-surface\s+\.rsc[\s\S]{0,200}?background:\s*transparent/);
assert.doesNotMatch(surface, /kx-summary-card/);
assert.doesNotMatch(detail, /sect-card__detail/);

console.log("=== مسافة سفلية فوق Bottom Nav ===");
assert.match(sectsCss, /sect-hub[\s\S]{0,400}?bottom-nav-height/);
assert.match(kxCss, /\.kx-detail-surface[\s\S]{0,400}?bottom-nav-height/);
assert.match(sectsCss, /inset-bottom/);

console.log("=== Dark: عنوان / ملخص / CTA ===");
assert.match(kxCss, /html\.dark \.kx-summary-card__title/);
assert.match(kxCss, /html\.dark \.kx-summary-card__summary/);
assert.match(kxCss, /html\.dark \.kx-summary-card__cta/);
assert.match(kxCss, /html\.dark \.kx-summary-card__pill/);
assert.match(sectsCss, /html\.dark \.sect-hub__search/);
assert.match(sectsCss, /html\.dark \.sect-hub__note/);

console.log("=== تجاوب iPad ===");
assert.match(sectsCss, /@media \(min-width: 720px\)/);
assert.match(sectsCss, /@media \(min-width: 1024px\) and \(orientation: landscape\)/);
assert.match(
  sectsCss,
  /@media \(min-width: 1024px\) and \(orientation: landscape\)[\s\S]{0,200}?repeat\(3/,
);
assert.match(kxCss, /@media \(min-width: 1024px\) and \(orientation: landscape\)/);

console.log("=== reduced-motion ===");
assert.match(kxCss, /prefers-reduced-motion:\s*reduce/);
assert.match(sectsCss, /prefers-reduced-motion:\s*reduce/);

console.log("=== وصول: عناوين + تركيز + RTL ===");
assert.match(card, /<h3 className="kx-summary-card__title"/);
assert.match(card, /aria-label=\{`\$\{title\} — \$\{ctaLabel\}`\}/);
assert.match(kxCss, /\.kx-summary-card__link:focus-visible/);
assert.match(kxCss, /\.kx-summary-card__title[\s\S]{0,220}?text-align:\s*start/);
assert.match(kxCss, /\.kx-summary-card__summary[\s\S]{0,220}?text-align:\s*start/);
assert.match(kxCss, /\.kx-detail-surface[\s\S]{0,220}?text-align:\s*start/);

console.log("=== زر أعلى لا يظهر عند البداية ويحترم Dialog ===");
assert.match(scroll, /scrollY\s*>\s*280/);
assert.match(scroll, /isModalOverlayOpen|aria-modal|data-radix-dialog/);
assert.match(calm, /:has\(\[role="dialog"\]\[data-state="open"\]\)/);
assert.match(calm, /\.scroll-to-top[\s\S]{0,300}?bottom-nav-height/);

console.log("=== قائمة بلا توسعة داخل البطاقة ===");
assert.match(list, /KnowledgeSummaryCard/);
assert.doesNotMatch(list, /aria-expanded/);
assert.doesNotMatch(list, /sect-card__detail/);
assert.match(detail, /KnowledgeDetailSurface/);

console.log("islamic-sects-a11y-responsive-gate.test.ts: ok");
