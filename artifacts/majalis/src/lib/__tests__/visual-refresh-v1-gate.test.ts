/**
 * Visual Refresh v1 + Sunnah Geometry System — عقود الهوية والعمق.
 * Run: node --import tsx src/lib/__tests__/visual-refresh-v1-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.ok(existsSync(resolve(root, "src/styles/visual-refresh-v1.css")));
assert.ok(existsSync(resolve(root, "src/styles/sunnah-geometry-system.css")));

const svl = read("src/styles/sunnah-visual-language.css");
const geo = read("src/styles/sunnah-geometry-system.css");
const refresh = read("src/styles/visual-refresh-v1.css");
const main = read("src/main.tsx");
const hero = read("src/components/home/HomeHeroLcp.tsx");

console.log("=== Tokens Visual Refresh ===");
assert.match(svl, /Visual Refresh v1/);
assert.match(svl, /--svl-surface-layered/);
assert.match(svl, /--svl-accent-gold-soft/);
assert.match(svl, /--svl-shadow-hero/);
assert.match(svl, /Dark Luxury/);
assert.match(svl, /#0e1613/);
assert.match(svl, /\.svl-card-surface\s*\{[^}]*box-shadow:\s*var\(--svl-shadow-card\)/s);

console.log("=== Geometry System ===");
assert.match(geo, /Sunnah Geometry System/);
assert.match(geo, /\.sgs-hero-geometry/);
assert.match(geo, /\.sgs-card-geometry/);
assert.match(geo, /--sgs-arch/);
assert.match(geo, /prefers-reduced-motion/);

console.log("=== Surfaces ===");
assert.match(refresh, /Premium Welcome Card/);
assert.match(refresh, /home-welcome-premium/);
assert.match(refresh, /Feature Cards/);
assert.match(refresh, /\[data-quran-hub="1"\]/);
assert.match(refresh, /prophet-lux-card/);
assert.match(refresh, /Dark Luxury/);
assert.doesNotMatch(refresh, /#00ff|#39ff|#ff00|neon/i);

console.log("=== Wiring ===");
assert.match(main, /sunnah-geometry-system\.css/);
assert.match(main, /visual-refresh-v1\.css/);
assert.match(hero, /home-welcome-premium/);
assert.match(hero, /sgs-hero-geometry/);
assert.match(hero, /title="سُنّة"/);

console.log("visual-refresh-v1-gate: ok");
