/**
 * بوابة: نظام القراءة التفاعلية مُلغى — لا يُعاد تفعيله.
 * node --import tsx src/lib/__tests__/reading-focus.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

assert.equal(existsSync(resolve(root, "src/components/reading/AppReadingFocus.tsx")), false);
assert.equal(existsSync(resolve(root, "src/lib/reading-focus.ts")), false);
assert.equal(existsSync(resolve(root, "src/styles/components/app-reading-focus.css")), false);

const app = read("src/App.tsx");
assert.doesNotMatch(app, /AppReadingFocus/);
assert.doesNotMatch(app, /app-reading-focus/);

console.log("reading-focus.test.ts: ok (removed)");
