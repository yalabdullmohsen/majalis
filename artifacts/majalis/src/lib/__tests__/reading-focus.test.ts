/**
 * بوابة تجربة قراءة تفاعلية — IntersectionObserver + استثناء المصحف.
 * node --import tsx src/lib/__tests__/reading-focus.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isReadingFocusExcludedPath,
  READING_FOCUS_ACTIVE_CLASS,
  READING_FOCUS_NEAR_CLASS,
} from "../reading-focus";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

assert.ok(existsSync(resolve(root, "src/lib/reading-focus.ts")));
assert.ok(existsSync(resolve(root, "src/components/reading/AppReadingFocus.tsx")));
assert.ok(existsSync(resolve(root, "src/styles/components/app-reading-focus.css")));

const app = read("src/App.tsx");
assert.match(app, /AppReadingFocus/);

const component = read("src/components/reading/AppReadingFocus.tsx");
assert.match(component, /IntersectionObserver/);
assert.match(component, /isReadingFocusExcludedPath/);
assert.doesNotMatch(component, /addEventListener\(\s*["']scroll/);

const css = read("src/styles/components/app-reading-focus.css");
assert.match(css, new RegExp(`\\.${READING_FOCUS_ACTIVE_CLASS}`));
assert.match(css, new RegExp(`\\.${READING_FOCUS_NEAR_CLASS}`));
assert.match(css, /\.app-focus-idle/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /\.mm-viewport/);

assert.equal(isReadingFocusExcludedPath("/mushaf"), true);
assert.equal(isReadingFocusExcludedPath("/mushaf/page/5"), true);
assert.equal(isReadingFocusExcludedPath("/quran/recitation-test-ai"), true);
assert.equal(isReadingFocusExcludedPath("/quran-engine"), true);
assert.equal(isReadingFocusExcludedPath("/tafsir"), true);
assert.equal(isReadingFocusExcludedPath("/"), false);
assert.equal(isReadingFocusExcludedPath("/fiqh"), false);
assert.equal(isReadingFocusExcludedPath("/quran/people"), false);
assert.equal(isReadingFocusExcludedPath("/seerah"), false);
assert.equal(isReadingFocusExcludedPath("/search"), false);

console.log("reading-focus.test.ts: ok");
