/**
 * بوابة وضوح الجوال — tokens + بطاقات + هيرو أخضر + بلا scale على الضغط.
 * تشغيل: node --import tsx src/lib/__tests__/ds-clarity-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.ok(existsSync(resolve(root, "src/styles/ds-clarity.css")));
assert.ok(existsSync(resolve(root, "src/components/ui/FeatureCard.tsx")));
assert.ok(existsSync(resolve(root, "src/components/ui/LessonCard.tsx")));
assert.ok(existsSync(resolve(root, "src/components/ui/ContentCard.tsx")));

const main = read("src/main.tsx");
assert.match(main, /ds-clarity\.css/);

const clarity = read("src/styles/ds-clarity.css");
assert.match(clarity, /--ds-shadow-sm/);
assert.match(clarity, /prefers-reduced-motion/);
assert.doesNotMatch(clarity, /transform:\s*scale\(/);

const native = read("src/styles/components/native-feel.css");
assert.doesNotMatch(
  native,
  /\.mj-pressable:active[\s\S]{0,120}scale\(0\.9/,
  "ضغط اللمس بلا scale مزعج",
);

const theme = read("src/app/styles/theme.css");
assert.match(theme, /--surface-app:\s*#F7F3EB/);
assert.match(theme, /--mj-surface-2:\s*#E8F0EC/);
assert.match(theme, /--mj-surface:\s*#FFFFFF/);

const hero = read("src/styles/components/home-brand-title.css");
assert.match(hero, /#0a3d2e|#0f5c45/);
assert.match(hero, /color:\s*#fff\s*!important/);

const explore = read("src/components/home/HomeExplorePlatform.tsx");
assert.match(explore, /FeatureCard/);
assert.match(explore, /hero/);

const app = read("src/App.tsx");
assert.match(app, /HomeSunnahByTime/);
assert.match(app, /home-spotlight-sunnah/);

console.log("ds-clarity-gate.test.ts: ok");
