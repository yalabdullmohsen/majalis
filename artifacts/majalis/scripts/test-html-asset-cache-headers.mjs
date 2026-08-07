/**
 * Gate: HTML/document must be no-store; hashed /assets/* may be immutable.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vercel = readFileSync(join(root, "vercel.json"), "utf8");

assert.match(vercel, /"source":\s*"\/"/);
assert.match(vercel, /"source":\s*"\/index\.html"/);
assert.match(vercel, /no-cache, no-store, must-revalidate/);
assert.match(vercel, /"source":\s*"\/assets\/\(\.\*\)"/);
assert.match(vercel, /max-age=31536000,\s*immutable/);

const home = readFileSync(join(root, "src/pages/account/ui/HomeView.tsx"), "utf8");
assert.match(home, /HomeUpcomingLessons/);
assert.match(home, /from "@\/components\/home\/HomeUpcomingLessons"/);
assert.match(home, /lazyWithRetry/);

const sw = readFileSync(join(root, "public/sw.js"), "utf8");
assert.match(sw, /text\/html/);
assert.match(sw, /asset not found/);

console.log("test-html-asset-cache-headers: ok");
