/**
 * بوابة: نظام مكوّنات سُنّة + توكنات دلالية + طبقة الصقل.
 * Run: node --import tsx src/lib/__tests__/ssunnah-design-system-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const tokens = read("src/styles/design-tokens.css");
const polish = read("src/styles/ssunnah-ux-polish.css");
const main = read("src/main.tsx");
const index = read("src/components/design-system/index.ts");
const unify = read("src/styles/visual-identity-unify.css");
const registry = read("src/config/sections.registry.ts");
const home = read("src/pages/account/ui/HomeView.tsx");
const sacred = read("src/components/home/HomeSacredOfDay.tsx");

assert.match(tokens, /--ss-primary-green/);
assert.match(tokens, /--ss-deep-green/);
assert.match(tokens, /--ss-soft-gold/);
assert.match(tokens, /--ss-warm-bg/);
assert.match(tokens, /--ss-card-bg/);
assert.match(tokens, /--gold:\s*var\(--ss-soft-gold\)/);

assert.match(unify, /--radius-card:\s*24px/);
assert.match(main, /ssunnah-ux-polish\.css/);

assert.match(index, /AppCard/);
assert.match(index, /FeatureCard/);
assert.match(index, /ContentCard/);
assert.match(index, /ActionButton/);
assert.match(index, /PrimaryButton/);
assert.match(index, /SecondaryButton/);
assert.match(index, /IconButton/);
assert.match(index, /LessonCard/);
assert.match(index, /FloatingBackButton/);

assert.match(polish, /\.home-sacred-day/);
assert.match(polish, /prefers-reduced-motion/);
assert.match(polish, /\.sidebar-item\.active/);
assert.match(polish, /transform:\s*none\s*!important/);

assert.doesNotMatch(registry, /#4A5590/i);
assert.match(registry, /discover-islam":\s*"#1F5C48/);

assert.match(home, /HomeSacredOfDay/);
assert.match(sacred, /getDailyAyah|getDailyHadith/);
assert.doesNotMatch(sacred, /scale\(|transform:\s*scale/);

console.log("ssunnah-design-system-gate.test.ts: ok");
