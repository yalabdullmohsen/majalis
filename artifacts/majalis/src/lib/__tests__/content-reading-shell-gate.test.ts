/**
 * بوابة غلاف القراءة الموحّد — يمنع رجوع النصوص العائمة بلا إطار.
 * Run: node --import tsx src/lib/__tests__/content-reading-shell-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const reading = read("src/components/content/ContentReading.tsx");
const shellCss = read("src/styles/components/content-reading-shell.css");
const compact = read("src/styles/components/compact-sources.css");
const ahruf = read("src/pages/quran/ui/QuranSevenAhrufView.tsx");
const main = read("src/main.tsx");
const rsc = read("src/components/content/ReadingSectionCard.tsx");

assert.match(reading, /export function ContentSection/);
assert.match(reading, /export function DefinitionBox/);
assert.match(reading, /export function EvidenceBox/);
assert.match(reading, /export function SourceBox/);
assert.match(reading, /export function RelatedLinksBox/);
assert.match(reading, /export function FAQBox/);
assert.match(reading, /export function QuotePanel/);
assert.match(reading, /export function ContentDetailReadingShell/);

assert.match(rsc, /"definition"/);
assert.match(rsc, /"evidence"/);
assert.match(rsc, /"quote"/);
assert.match(rsc, /"faq"/);

assert.match(shellCss, /\.qr-section/);
assert.match(shellCss, /\.hs-card/);
assert.match(shellCss, /\.gl-term/);
assert.match(shellCss, /\.uq-section/);
assert.match(shellCss, /html\.dark \.qr-section/);

assert.match(compact, /border-radius:\s*var\(--radius-card/);
assert.doesNotMatch(compact, /font-size:\s*0\.68rem;\s*\n\s*line-height:\s*1\.4;\s*\n\s*color:\s*var\(--majalis-ink-soft/);

assert.match(ahruf, /ContentDetailReadingShell/);
assert.match(ahruf, /SourceBox/);
assert.match(ahruf, /RelatedLinksBox/);
assert.doesNotMatch(ahruf, /className="qr-section"/);

assert.match(main, /content-reading-shell\.css/);

console.log("content-reading-shell-gate: ok");
