/**
 * Gate: SPA navigation must not receive cross-origin / www absolute URLs.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(root, "src");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|mjs)$/.test(extname(name))) out.push(p);
  }
  return out;
}

const NAV_CALL =
  /(?:setLocation|navigate|history\.pushState)\s*\(\s*(?:\{\s*[^}]*\}\s*,\s*)?(["'`])(https?:\/\/[^"'`]+)\1/g;
const LINK_ABS =
  /<Link[^>]+href=\{\s*(["'`])(https?:\/\/[^"'`]+)\1\s*\}/g;

const offenders = [];
for (const file of walk(srcRoot)) {
  const src = readFileSync(file, "utf8");
  for (const re of [NAV_CALL, LINK_ABS]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      const url = m[2];
      if (/majlisilm\.com/i.test(url)) {
        offenders.push(`${file.replace(root + "/", "")}: ${url}`);
      }
    }
  }
}

assert.equal(
  offenders.length,
  0,
  `cross-origin router navigation blocked:\n${offenders.slice(0, 20).join("\n")}`,
);

// Runtime helper checks
const require = createRequire(import.meta.url);
// Use dynamic import of compiled TS via tsx-less path: re-read site-config as source assertions
const siteConfigSrc = readFileSync(join(root, "src/lib/site-config.ts"), "utf8");
assert.match(siteConfigSrc, /export function toAppPath/);
assert.match(siteConfigSrc, /assertAppNavigationHref/);
assert.match(siteConfigSrc, /cross_origin_navigation_blocked/);

const contentHref = readFileSync(join(root, "src/lib/content-href.ts"), "utf8");
assert.doesNotMatch(contentHref, /https?:\/\/www\.majlisilm\.com/);
assert.doesNotMatch(contentHref, /https?:\/\/majlisilm\.com/);

const kgService = readFileSync(join(root, "src/lib/knowledge-graph-service.ts"), "utf8");
assert.doesNotMatch(kgService, /https?:\/\/www\.majlisilm\.com/);

const kgPage = readFileSync(join(root, "src/views/KnowledgeGraphPage.tsx"), "utf8");
assert.doesNotMatch(kgPage, /https:\/\/www\.majlisilm\.com/);
assert.match(kgPage, /absoluteUrl\(/);

void require;
console.log("test-router-same-origin: ok");
