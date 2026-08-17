/**
 * بوابة: توكنات النص على الداكن صلبة وواضحة.
 * node --import tsx src/lib/__tests__/on-dark-text-tokens.test.ts
 */
import "./theme-contrast-pairs.test.ts";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const theme = readFileSync(resolve(root, "src/app/styles/theme.css"), "utf8");
const aliases = readFileSync(resolve(root, "src/styles/theme-aliases.css"), "utf8");
const tokens = readFileSync(resolve(root, "src/styles/tokens.css"), "utf8");
const darkSurfaces = readFileSync(resolve(root, "src/styles/dark-mode-surfaces.css"), "utf8");

let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

console.log("\n=== توكنات النص على الداكن ===");
assert(/--surface-app:\s*#F2F4F3/.test(theme), "theme: --surface-app نهاري");
assert(/--mj-bg:\s*var\(--surface-app\)/.test(theme), "theme: --mj-bg ← --surface-app");
assert(/\[data-on-dark\]/.test(theme), "theme: سياق [data-on-dark]");
assert(/\.on-dark\s*\{/.test(theme), "theme: صنف .on-dark يعيد رموز النص");
assert(/--on-green:/.test(theme), "theme: --on-green");
assert(/--on-dark-strong:\s*#FFFFFF/.test(theme), "theme: --on-dark-strong أبيض صلب");
assert(/--on-dark-body:\s*#F8FAFC/.test(theme), "theme: --on-dark-body واضح");
assert(/--on-dark-secondary:\s*#E8EEEC/.test(theme), "theme: --on-dark-secondary مقروء");
assert(/--mj-ink:\s*#F8FAFC/.test(theme), "theme ليلي: --mj-ink فاتح");
assert(/--mj-muted:\s*#C5D0CB/.test(theme), "theme ليلي: --mj-muted ليس باهتًا");
assert(aliases.includes("--on-dark-strong"), "aliases: --on-dark-strong");
assert(aliases.includes("--text-on-dark: var(--on-dark-strong)"), "aliases: text-on-dark → on-dark-strong");
assert(/--on-brand-secondary:\s*#F8FAFC/.test(tokens), "tokens: on-brand-secondary صلب بلا alpha");
assert(!/--on-brand-tertiary:\s*rgba\(255,\s*255,\s*255,\s*0\.64\)/.test(tokens), "tokens: لا tertiary 0.64");
assert(darkSurfaces.includes("--on-dark-strong"), "dark-mode-surfaces يستخدم التوكن");
assert(darkSurfaces.includes(".prophet-section-lux__text"), "dark-mode-surfaces يغطّي نص القصة");
assert(darkSurfaces.includes("text-white\\/50") || darkSurfaces.includes("text-white/50"), "تجاوز text-white/50 ليلاً");

if (failed) process.exit(1);
console.log("on-dark-text-tokens: ok");
