/**
 * بوابة هيكل الرئيسية الحديثة.
 * Run: node --import tsx src/lib/__tests__/home-modern-shell-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const below = read("src/pages/account/ui/HomeBelowFold.tsx");
const portals = read("src/components/home/HomePrimaryPortals.tsx");
const css = read("src/styles/components/home-modern-shell.css");
const app = read("src/App.tsx");
const hero = read("src/components/home/HomeHeroLcp.tsx");
const startData = read("src/components/home/home-start-here-data.ts");

assert.match(portals, /HomePrimaryPortals/);
assert.match(portals, /IA_HOME_PRIMARY/);
assert.match(portals, /home-primary-portals/);
assert.match(below, /HomePrimaryPortals/);
assert.match(below, /تقدمك اليوم/);
assert.match(below, /HomeMostReadBand/);
assert.match(below, /learning-seasons/);

assert.match(css, /--home-radius/);
assert.match(css, /bottom-nav-height/);
assert.match(css, /html\.dark \.m2030-home/);
assert.match(app, /m2030-home--modern/);
assert.match(hero, /description=/);
assert.match(hero, /home-modern-shell\.css/);
assert.match(startData, /ثلاث خطوات قصيرة/);

console.log("home-modern-shell-gate: ok");
