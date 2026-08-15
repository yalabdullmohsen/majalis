/**
 * أساس iOS edge-to-edge — رموز وviewport وtheme-color سطحي.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VIEWPORT_CONTENT } from "../ensure-chrome-meta";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const site = JSON.parse(readFileSync(resolve(root, "site.config.json"), "utf8"));
const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
const themeCss = readFileSync(resolve(root, "src/app/styles/theme.css"), "utf8");

assert.equal(site.themeColor, "#F2F4F3");
assert.equal(site.themeColorDark, "#101614");
assert.equal(VIEWPORT_CONTENT, "width=device-width, initial-scale=1, viewport-fit=cover");
assert.match(indexHtml, new RegExp(VIEWPORT_CONTENT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.doesNotMatch(indexHtml, /maximum-scale|user-scalable/i);
assert.ok(themeCss.includes("--inset-top"));
assert.ok(themeCss.includes("--content-pb"));
assert.ok(existsSync(resolve(root, "src/styles/ios-edge.css")));
assert.ok(existsSync(resolve(root, "src/components/SafeAreaDebugOverlay.tsx")));

const manifest = JSON.parse(readFileSync(resolve(root, "public/manifest.json"), "utf8"));
assert.equal(manifest.theme_color, "#F2F4F3");
/** خلفية الإقلاع/الشاشة الأصلية — زمرد الدخول لا سطح الصفحة */
assert.equal(manifest.background_color, "#002b21");

console.log("ios-edge-foundation.test.ts: ok");
