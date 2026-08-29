/**
 * بوابة مقروئية الطباعة الموحّدة — بدون كسر المصحف/QPC.
 * تشغيل: node --import tsx src/lib/__tests__/typography-readable-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const tokens = read("src/styles/design-tokens.css");
assert.match(tokens, /--font-base:\s*1rem/, "جوال 16px");
assert.match(tokens, /--font-base:\s*1\.0625rem/, "سطح مكتب 17px");
assert.match(tokens, /--lh-body:\s*1\.75/, "ارتفاع سطر للنصوص");
assert.match(tokens, /--font-xs:\s*0\.8125rem/, "شريط سفلي 13px");
assert.match(tokens, /--font-heading/, "خط عناوين واجهة");
assert.doesNotMatch(tokens, /--font-xl:\s*clamp\([^)]*vw/, "عناوين بلا vw");

const scale = read("src/styles/typography-scale.css");
assert.match(scale, /font-weight:\s*var\(--font-weight-regular/, "body وزن 400");
assert.match(scale, /\.text-readable/);
assert.match(scale, /\.text-meta/);
assert.match(scale, /\.heading-page/);
assert.match(scale, /\.heading-section/);
assert.match(scale, /\.nav-label/);
assert.match(scale, /letter-spacing:\s*0/);
assert.match(scale, /QPC|--mm-qpc-size/, "توثيق استثناء المصحف");
assert.doesNotMatch(scale, /--mm-qpc-size\s*:/, "لا إعادة تعريف حجم QPC");

const mushaf = read("src/features/mushaf-madinah/mushaf-madinah.css");
assert.match(mushaf, /--mm-qpc-size/, "قياسات المصحف محفوظة");

const navM2030 = read("src/styles/m2030/navigation.css");
assert.doesNotMatch(navM2030, /font-size:\s*0\.68rem/, "لا تصغير شريط سفلي قديم");
assert.doesNotMatch(navM2030, /font-size:\s*0\.62rem/);

const finalCss = read("src/styles/final-release.css");
assert.match(finalCss, /--bottom-nav-height:\s*84px/);
assert.match(finalCss, /--text-nav/);

const indexCss = read("src/index.css");
assert.match(indexCss, /font-weight:\s*var\(--font-weight-regular/);
assert.match(indexCss, /--text-base:\s*1rem/);

console.log("typography-readable-gate.test.ts: ok");
