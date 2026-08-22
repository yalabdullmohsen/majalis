/**
 * بوابة خطوط الصفحات الخارجية — scoped بلا تغيير body/--font-app.
 * تشغيل: node --import tsx src/lib/__tests__/public-layout-fonts-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isPublicRoute } from "../public-routes";

const root = resolve(import.meta.dirname, "../../..");

const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const fontsPublic = readFileSync(resolve(root, "src/styles/fonts-public.css"), "utf8");
const publicLayout = readFileSync(resolve(root, "src/styles/public-layout.css"), "utf8");
const theme = readFileSync(resolve(root, "src/app/styles/theme.css"), "utf8");
const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");

assert.equal(isPublicRoute("/about"), true);
assert.equal(isPublicRoute("/discover-islam/articles/what-is-islam"), true);
assert.equal(isPublicRoute("/"), false);
assert.equal(isPublicRoute("/mushaf"), false);
assert.equal(isPublicRoute("/fiqh"), false);
assert.equal(isPublicRoute("/lessons"), false);

assert.match(app, /function PublicLazyRoute/);
assert.match(app, /<PublicLazyRoute component=\{AboutPage\}/);
assert.match(app, /<PublicLazyRoute component=\{DiscoverIslamPage\}/);
assert.doesNotMatch(app, /<PublicLazyRoute component=\{LessonsPage\}/);
assert.doesNotMatch(app, /<PublicLazyRoute component=\{FiqhPage\}/);

assert.match(fontsPublic, /"Noto Kufi Arabic"/);
assert.match(fontsPublic, /"IBM Plex Sans Arabic"/);
assert.match(fontsPublic, /font-display:\s*swap/g);
assert.equal([...fontsPublic.matchAll(/font-weight:\s*(\d+)/g)].map((m) => m[1]).sort().join(","), "400,400,600,700");

assert.match(publicLayout, /\.public-layout\s*\{/);
assert.doesNotMatch(publicLayout, /^\s*body\s*\{/m);
assert.doesNotMatch(publicLayout, /html\s*,\s*body/);
assert.match(publicLayout, /--font-public-heading:\s*"Noto Kufi Arabic"/);
assert.match(publicLayout, /--font-public-body:\s*"IBM Plex Sans Arabic"/);

assert.match(theme, /--font-app:\s*"Amiri"/);
assert.doesNotMatch(indexHtml, /noto-kufi|ibm-plex-sans-ar/);

for (const file of [
  "public/fonts/ui/noto-kufi-400-ar.woff2",
  "public/fonts/ui/noto-kufi-700-ar.woff2",
  "public/fonts/ui/ibm-plex-sans-ar-400-ar.woff2",
  "public/fonts/ui/ibm-plex-sans-ar-600-ar.woff2",
]) {
  assert.ok(existsSync(resolve(root, file)), `${file} موجود`);
}

console.log("\npublic-layout-fonts-gate.test.ts: ok");
